// 各社のロゴをウィキメディア・コモンズから取得して、public/logos と src/data/logos.json に保存する。
// たどる順番：会社 → Wikipedia の記事 → Wikidata の「ロゴ画像」(P154) → コモンズのファイル（ライセンス情報も取得）
// ネットワークが必要なので GitHub Actions（.github/workflows/fetch-logos.yml）で実行する。
//
// 入力：src/data/logo-sources.json
//   { "7203": { "wiki": ["ja:トヨタ自動車", "en:Toyota"] }, "xxx": { "file": "Example logo.svg" } }
//   wiki は上から順に試し、ロゴ画像が見つかった最初の記事を使う。file を書くとそのファイルに固定する。
import fs from "node:fs/promises";
import path from "node:path";

const UA = "company-logo-fetch/1.0 (static website build; contact via repository issues)";
const LOGO_DIR = "public/logos";
const OUT_JSON = "src/data/logos.json";
const MAX_SVG_BYTES = 300_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(url, accept) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept } });
    if (res.ok) return res;
    if (res.status === 429 || res.status >= 500) {
      await sleep(2000 * (i + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status} ${url}`);
  }
  throw new Error(`retry limit ${url}`);
}

const getJson = async (url) => (await request(url, "application/json")).json();

/** "ja:トヨタ自動車" → { qid, title } */
async function qidFromWiki(spec) {
  const i = spec.indexOf(":");
  const lang = spec.slice(0, i);
  const title = spec.slice(i + 1);
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item` +
    `&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(title)}`;
  const j = await getJson(url);
  const p = j.query?.pages?.[0];
  if (!p || p.missing) return null;
  return { qid: p.pageprops?.wikibase_item ?? null, title: `${lang}:${p.title}` };
}

/** Wikidata の P154（ロゴ画像）。推奨ランク → 終了日なし → 開始日が新しい順に選ぶ */
async function logoFromQid(qid) {
  const j = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${qid}&property=P154&format=json`);
  const claims = (j.claims?.P154 ?? []).filter((c) => c.rank !== "deprecated" && c.mainsnak?.datavalue?.value);
  const hasEnd = (c) => (c.qualifiers?.P582 ? 1 : 0);
  const start = (c) => c.qualifiers?.P580?.[0]?.datavalue?.value?.time ?? "";
  claims.sort(
    (a, b) =>
      (b.rank === "preferred") - (a.rank === "preferred") || hasEnd(a) - hasEnd(b) || start(b).localeCompare(start(a)),
  );
  return { file: claims[0]?.mainsnak.datavalue.value ?? null, candidates: claims.map((c) => c.mainsnak.datavalue.value) };
}

const strip = (s) =>
  String(s ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/** コモンズのファイル情報（URL・形式・大きさ・ライセンス） */
async function fileInfo(file) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo" +
    `&iiprop=url|mime|size|extmetadata&iiurlwidth=512&titles=${encodeURIComponent("File:" + file)}`;
  const j = await getJson(url);
  const ii = j.query?.pages?.[0]?.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata ?? {};
  return {
    url: ii.url,
    thumb: ii.thumburl,
    thumbWidth: ii.thumbwidth,
    thumbHeight: ii.thumbheight,
    mime: ii.mime,
    width: ii.width,
    height: ii.height,
    page: ii.descriptionurl,
    license: strip(m.LicenseShortName?.value),
    artist: strip(m.Artist?.value),
    restrictions: strip(m.Restrictions?.value),
  };
}

async function download(url, dest) {
  const res = await request(url, "*/*");
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  return buf.length;
}

const sources = JSON.parse(await fs.readFile("src/data/logo-sources.json", "utf8"));
await fs.mkdir(LOGO_DIR, { recursive: true });
// 前回の画像は消してから取り直す（ロゴが無くなった会社の古い画像を残さない）
for (const f of await fs.readdir(LOGO_DIR)) await fs.rm(path.join(LOGO_DIR, f));

const out = {};
const rows = [];
for (const [code, src] of Object.entries(sources)) {
  try {
    let file = src.file ?? null;
    let qid = null;
    let title = null;
    let candidates = [];
    if (!file) {
      for (const spec of src.wiki ?? []) {
        const r = await qidFromWiki(spec);
        await sleep(200);
        if (!r?.qid) continue;
        const l = await logoFromQid(r.qid);
        await sleep(200);
        if (l.file) {
          ({ file, candidates } = l);
          qid = r.qid;
          title = r.title;
          break;
        }
        qid ??= r.qid;
        title ??= r.title;
      }
    }
    if (!file) {
      out[code] = { missing: true, qid, title, reason: qid ? "Wikidataにロゴ画像(P154)なし" : "記事が見つからない" };
      rows.push([code, "-", title ?? "-", out[code].reason]);
      continue;
    }
    const info = await fileInfo(file);
    await sleep(200);
    if (!info) throw new Error(`コモンズにファイルなし: ${file}`);
    let ext;
    let bytes;
    let width = info.width;
    let height = info.height;
    if (info.mime === "image/svg+xml") {
      bytes = await download(info.url, path.join(LOGO_DIR, `${code}.svg`));
      ext = "svg";
      if (bytes > MAX_SVG_BYTES && info.thumb) {
        await fs.rm(path.join(LOGO_DIR, `${code}.svg`));
        bytes = await download(info.thumb, path.join(LOGO_DIR, `${code}.png`));
        ext = "png";
        width = info.thumbWidth;
        height = info.thumbHeight;
      }
    } else {
      const useThumb = info.thumb && info.width > 512;
      const url = useThumb ? info.thumb : info.url;
      ext = (url.split("?")[0].split(".").pop() || "png").toLowerCase();
      bytes = await download(url, path.join(LOGO_DIR, `${code}.${ext}`));
      if (useThumb) {
        width = info.thumbWidth;
        height = info.thumbHeight;
      }
    }
    await sleep(200);
    out[code] = {
      src: `/logos/${code}.${ext}`,
      width,
      height,
      file,
      page: info.page,
      license: info.license || null,
      artist: info.artist || null,
      restrictions: info.restrictions || null,
      qid,
      title,
      ...(candidates.length > 1 ? { candidates } : {}),
    };
    rows.push([code, `${ext} ${bytes}B`, title ?? "(固定)", `${file} [${info.license}]`]);
  } catch (e) {
    out[code] = { missing: true, reason: String(e.message).slice(0, 200) };
    rows.push([code, "ERROR", "-", out[code].reason]);
  }
}

await fs.writeFile(OUT_JSON, JSON.stringify(out, null, 1) + "\n");
for (const r of rows) console.log(r.join("\t"));
const ok = Object.values(out).filter((x) => !x.missing).length;
console.log(`\n${ok}/${Object.keys(out).length} 社のロゴを取得`);
