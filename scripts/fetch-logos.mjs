// 各社のロゴをウィキメディア・コモンズから取得して、public/logos と src/data/logos.json に保存する。
// たどる順番：会社 → Wikipedia の記事 → Wikidata の「ロゴ画像」(P154) → コモンズのファイル（ライセンス情報も取得）
// ネットワークが必要なので GitHub Actions（.github/workflows/fetch-logos.yml）で実行する。
//
// 入力：src/data/logo-sources.json
//   { "7203": { "wiki": ["ja:トヨタ自動車", "en:Toyota"] }, "xxx": { "file": "Example logo.svg" } }
//   wiki は上から順に試し、ロゴ画像が見つかった最初の記事を使う。file を書くとそのファイルに固定する。
//
// ウィキメディアに負担をかけないよう、記事・ファイル情報はまとめて問い合わせ、画像は1枚ずつ間隔を空けて取得する。
// 取得済みのロゴは残し、足りない会社だけを取りに行く（REFRESH=1 で全社を取り直す）。
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const UA = "company-logo-fetch/1.2 (one-off logo download for a static website; runs on GitHub Actions)";
const LOGO_DIR = "public/logos";
const OUT_JSON = "src/data/logos.json";
const MAX_SVG_BYTES = 300_000;
const REFRESH = process.env.REFRESH === "1";
const API_GAP_MS = 1000;
const DOWNLOAD_GAP_MS = 2500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 429/5xx は Retry-After（なければ段階的に長く）待って再試行する */
async function request(url, accept) {
  let wait = 5000;
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept, "Api-User-Agent": UA } });
    if (res.ok) return res;
    const retryAfter = Number(res.headers.get("retry-after"));
    const ms = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : wait;
    console.log(`  HTTP ${res.status}（${Math.round(ms / 1000)}秒待って再試行） ${url.slice(0, 120)}`);
    if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status} ${url}`);
    await sleep(Math.min(ms, 120_000));
    wait = Math.min(wait * 2, 120_000);
  }
  throw new Error(`retry limit ${url}`);
}

const getJson = async (url) => {
  const j = await (await request(url, "application/json")).json();
  await sleep(API_GAP_MS);
  return j;
};

const chunks = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

/** Wikipedia の記事名 → Wikidata の ID（言語ごとに最大50件ずつまとめて問い合わせ） */
async function resolveQids(specs) {
  const byLang = new Map();
  for (const s of specs) {
    const i = s.indexOf(":");
    const lang = s.slice(0, i);
    byLang.set(lang, [...(byLang.get(lang) ?? []), s.slice(i + 1)]);
  }
  const result = new Map();
  for (const [lang, titles] of byLang) {
    for (const part of chunks([...new Set(titles)], 50)) {
      const url =
        `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item` +
        `&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(part.join("|"))}`;
      const j = await getJson(url);
      const norm = new Map((j.query?.normalized ?? []).map((x) => [x.from, x.to]));
      const redir = new Map((j.query?.redirects ?? []).map((x) => [x.from, x.to]));
      const pages = new Map((j.query?.pages ?? []).map((p) => [p.title, p]));
      for (const t of part) {
        let final = norm.get(t) ?? t;
        final = redir.get(final) ?? final;
        const p = pages.get(final);
        result.set(`${lang}:${t}`, p && !p.missing ? { qid: p.pageprops?.wikibase_item ?? null, title: `${lang}:${p.title}` } : null);
      }
    }
  }
  return result;
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

/** コモンズのファイル情報（最大50件ずつまとめて問い合わせ）。幅500pxは標準のサムネイル幅 */
async function fileInfos(files) {
  const out = new Map();
  for (const part of chunks([...new Set(files)], 50)) {
    const url =
      "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo" +
      `&iiprop=url|mime|size|extmetadata&iiurlwidth=500&titles=${encodeURIComponent(part.map((f) => "File:" + f).join("|"))}`;
    const j = await getJson(url);
    const norm = new Map((j.query?.normalized ?? []).map((x) => [x.from, x.to]));
    const pages = new Map((j.query?.pages ?? []).map((p) => [p.title, p]));
    for (const f of part) {
      const t = norm.get("File:" + f) ?? "File:" + f;
      const ii = pages.get(t)?.imageinfo?.[0];
      if (!ii) {
        out.set(f, null);
        continue;
      }
      const m = ii.extmetadata ?? {};
      out.set(f, {
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
      });
    }
  }
  return out;
}

async function download(url, dest) {
  const res = await request(url, "*/*");
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  await sleep(DOWNLOAD_GAP_MS);
  return buf.length;
}

async function removeLogoFiles(code) {
  for (const f of await fs.readdir(LOGO_DIR)) if (f.startsWith(`${code}.`)) await fs.rm(path.join(LOGO_DIR, f));
}

// ---------------------------------------------------------------------------
const sources = JSON.parse(await fs.readFile("src/data/logo-sources.json", "utf8"));
const prev = existsSync(OUT_JSON) ? JSON.parse(await fs.readFile(OUT_JSON, "utf8")) : {};
await fs.mkdir(LOGO_DIR, { recursive: true });

const isDone = (code) => {
  const p = prev[code];
  if (REFRESH || !p || p.missing || !existsSync(path.join("public", p.src))) return false;
  const pinned = sources[code]?.file;
  return !pinned || pinned === p.file;
};

const out = {};
const todo = [];
for (const code of Object.keys(sources)) {
  if (isDone(code)) out[code] = prev[code];
  else todo.push(code);
}
console.log(`取得済み ${Object.keys(out).length} 社はそのまま。${todo.length} 社を取得します`);

// 1) 記事 → Wikidata ID（まとめて）
const specs = todo.flatMap((c) => (sources[c].file ? [] : (sources[c].wiki ?? [])));
let qids = new Map();
try {
  qids = await resolveQids(specs);
} catch (e) {
  console.log(`記事の問い合わせに失敗：${e.message}`);
}

// 2) 会社ごとにロゴのファイル名を決める（上の記事から順に、ロゴがある最初のもの）
const chosen = new Map();
for (const code of todo) {
  const src = sources[code];
  if (src.file) {
    chosen.set(code, { file: src.file, qid: null, title: null, candidates: [] });
    continue;
  }
  let first = null;
  try {
    for (const spec of src.wiki ?? []) {
      const r = qids.get(spec);
      if (!r?.qid) continue;
      first ??= r;
      const l = await logoFromQid(r.qid);
      if (l.file) {
        chosen.set(code, { file: l.file, qid: r.qid, title: r.title, candidates: l.candidates });
        break;
      }
    }
    if (!chosen.has(code))
      out[code] = prev[code] && !prev[code].missing ? prev[code] : { missing: true, qid: first?.qid ?? null, title: first?.title ?? null, reason: first ? "Wikidataにロゴ画像(P154)なし" : "記事が見つからない" };
  } catch (e) {
    out[code] = { missing: true, reason: String(e.message).slice(0, 200) };
  }
}

// 3) ファイル情報（まとめて）
let infos = new Map();
try {
  infos = await fileInfos([...chosen.values()].map((c) => c.file));
} catch (e) {
  console.log(`ファイル情報の問い合わせに失敗：${e.message}`);
}

// 4) 画像を1枚ずつダウンロード
for (const [code, c] of chosen) {
  const info = infos.get(c.file);
  if (!info) {
    out[code] = { missing: true, qid: c.qid, title: c.title, reason: `コモンズのファイル情報を取得できず: ${c.file}` };
    continue;
  }
  try {
    let ext;
    let width = info.width;
    let height = info.height;
    await removeLogoFiles(code);
    if (info.mime === "image/svg+xml") {
      const bytes = await download(info.url, path.join(LOGO_DIR, `${code}.svg`));
      ext = "svg";
      if (bytes > MAX_SVG_BYTES && info.thumb) {
        await removeLogoFiles(code);
        await download(info.thumb, path.join(LOGO_DIR, `${code}.png`));
        ext = "png";
        width = info.thumbWidth;
        height = info.thumbHeight;
      }
    } else {
      const useThumb = info.thumb && info.width > 500;
      const url = useThumb ? info.thumb : info.url;
      ext = (url.split("?")[0].split(".").pop() || "png").toLowerCase();
      await download(url, path.join(LOGO_DIR, `${code}.${ext}`));
      if (useThumb) {
        width = info.thumbWidth;
        height = info.thumbHeight;
      }
    }
    out[code] = {
      src: `/logos/${code}.${ext}`,
      width,
      height,
      file: c.file,
      page: info.page,
      license: info.license || null,
      artist: info.artist || null,
      restrictions: info.restrictions || null,
      qid: c.qid,
      title: c.title,
      ...(c.candidates.length > 1 ? { candidates: c.candidates } : {}),
    };
    console.log(`OK ${code}\t${c.file}\t[${info.license}]`);
  } catch (e) {
    // 前回取得できていた画像があれば残す
    out[code] = prev[code] && !prev[code].missing ? prev[code] : { missing: true, qid: c.qid, title: c.title, reason: String(e.message).slice(0, 200) };
    console.log(`NG ${code}\t${e.message.slice(0, 120)}`);
  }
}

// 対応表の順に並べて保存
const ordered = Object.fromEntries(Object.keys(sources).map((k) => [k, out[k] ?? { missing: true, reason: "未処理" }]));
await fs.writeFile(OUT_JSON, JSON.stringify(ordered, null, 1) + "\n");
const missing = Object.entries(ordered).filter(([, v]) => v.missing);
console.log(`\n${Object.keys(ordered).length - missing.length}/${Object.keys(ordered).length} 社のロゴを取得済み`);
for (const [k, v] of missing) console.log(`  未取得 ${k}: ${v.reason}`);
