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
// 1回の実行で使う時間の上限。超えそうなら途中で打ち切り、取得できた分だけ保存する（次の実行で続きを取る）
const DEADLINE = Date.now() + Number(process.env.DEADLINE_MINUTES ?? 40) * 60_000;
class DeadlineError extends Error {}
/** この URL はいま取れない（別の大きさの画像を試すか、次の実行に回す） */
class SkipError extends Error {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 429/5xx は Retry-After（なければ段階的に長く）の分だけ待って再試行する。
 * maxWait より長く待つよう言われたら、その URL はあきらめる（SkipError）。実行の期限を越える待ちは打ち切る。
 */
async function request(url, accept, { maxWait = Infinity, attempts = 6 } = {}) {
  let wait = 5000;
  for (let i = 0; i < attempts; i++) {
    if (Date.now() > DEADLINE) throw new DeadlineError("この実行の時間上限に達しました");
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept, "Api-User-Agent": UA } });
    if (res.ok) return res;
    const retryAfter = Number(res.headers.get("retry-after"));
    const ms = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : wait;
    if (res.status !== 429 && res.status < 500) throw new SkipError(`HTTP ${res.status} ${url.slice(0, 120)}`);
    if (ms > maxWait || i === attempts - 1) {
      console.log(`  HTTP ${res.status}（${Math.round(ms / 1000)}秒待つよう指示。この画像は後回し） ${url.slice(0, 110)}`);
      throw new SkipError(`HTTP ${res.status}（後回し）`);
    }
    console.log(`  HTTP ${res.status}（${Math.round(ms / 1000)}秒待って再試行） ${url.slice(0, 110)}`);
    if (Date.now() + ms > DEADLINE) throw new DeadlineError("待ち時間がこの実行の上限を越えるため打ち切り");
    await sleep(ms);
    wait = Math.min(wait * 2, 300_000);
  }
  throw new SkipError(`retry limit ${url.slice(0, 120)}`);
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

/** 複数の Wikidata ID のロゴ画像を、SPARQL 1回でまとめて取得する */
async function logosByQids(qidList) {
  const out = new Map();
  if (qidList.length === 0) return out;
  const query = `SELECT ?item ?logo ?rank ?start ?end WHERE {
    VALUES ?item { ${qidList.map((q) => "wd:" + q).join(" ")} }
    ?item p:P154 ?st . ?st ps:P154 ?logo ; wikibase:rank ?rank .
    OPTIONAL { ?st pq:P580 ?start } OPTIONAL { ?st pq:P582 ?end }
  }`;
  const j = await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`);
  const rows = new Map();
  for (const b of j.results?.bindings ?? []) {
    const qid = b.item.value.split("/").pop();
    const rank = b.rank.value.split("#").pop();
    if (rank === "DeprecatedRank") continue;
    const file = decodeURIComponent(b.logo.value.split("/").pop()).replace(/_/g, " ");
    rows.set(qid, [...(rows.get(qid) ?? []), { file, preferred: rank === "PreferredRank", end: !!b.end, start: b.start?.value ?? "" }]);
  }
  for (const q of qidList) {
    const list = (rows.get(q) ?? []).sort(
      (a, b) => Number(b.preferred) - Number(a.preferred) || Number(a.end) - Number(b.end) || b.start.localeCompare(a.start),
    );
    out.set(q, { file: list[0]?.file ?? null, candidates: [...new Set(list.map((x) => x.file))] });
  }
  return out;
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

/** 画像のダウンロード。断られたら長くは待たず、次の候補（別の大きさ）へ */
async function download(url, dest) {
  const res = await request(url, "*/*", { maxWait: 30_000, attempts: 2 });
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  await sleep(DOWNLOAD_GAP_MS);
  return buf.length;
}

/** コモンズのサムネイル URL の幅を変える（…/500px-Name.svg.png → …/250px-Name.svg.png） */
const thumbAt = (thumb, w) => thumb?.split("?")[0].replace(/\/(\d+)px-([^/]+)$/, `/${w}px-$2`);
const THUMB_WIDTHS = [500, 330, 250, 220];

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

// ロゴが登録されていないと分かっている会社は、毎回は問い合わせない（REFRESH=1 で再確認）
const knownMissing = (code) =>
  !REFRESH && prev[code]?.missing && /^(Wikidataにロゴ画像\(P154\)なし|記事が見つからない)$/.test(prev[code].reason ?? "") && !sources[code]?.file;

const out = {};
const todo = [];
for (const code of Object.keys(sources)) {
  if (isDone(code) || knownMissing(code)) out[code] = prev[code];
  else todo.push(code);
}

/** 途中経過を書き出す（時間切れでも取得できた分が残るように） */
async function save() {
  const ordered = Object.fromEntries(
    Object.keys(sources).map((k) => [k, out[k] ?? prev[k] ?? { missing: true, reason: "未処理（次の実行で取得）" }]),
  );
  await fs.writeFile(OUT_JSON, JSON.stringify(ordered, null, 1) + "\n");
  return ordered;
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
let p154 = new Map();
try {
  p154 = await logosByQids([...new Set([...qids.values()].map((r) => r?.qid).filter(Boolean))]);
} catch (e) {
  console.log(`SPARQL に失敗したため1件ずつ問い合わせます：${e.message}`);
}
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
      const l = p154.get(r.qid) ?? (await logoFromQid(r.qid));
      if (l.file) {
        chosen.set(code, { file: l.file, qid: r.qid, title: r.title, candidates: l.candidates });
        break;
      }
    }
    if (!chosen.has(code))
      out[code] = prev[code] && !prev[code].missing ? prev[code] : { missing: true, qid: first?.qid ?? null, title: first?.title ?? null, reason: first ? "Wikidataにロゴ画像(P154)なし" : "記事が見つからない" };
  } catch (e) {
    if (e instanceof DeadlineError) break;
    out[code] = prev[code] && !prev[code].missing ? prev[code] : { missing: true, reason: String(e.message).slice(0, 200) };
  }
}

// 3) ファイル情報（まとめて）
let infos = new Map();
try {
  infos = await fileInfos([...chosen.values()].map((c) => c.file));
} catch (e) {
  console.log(`ファイル情報の問い合わせに失敗：${e.message}`);
}

// 4) 画像を1枚ずつダウンロード（毎回順番をまぜ、取れない画像で止まらないようにする）
const order = [...chosen.keys()].sort(() => Math.random() - 0.5);
for (const code of order) {
  const c = chosen.get(code);
  const info = infos.get(c.file);
  if (!info) {
    out[code] = { missing: true, qid: c.qid, title: c.title, reason: `コモンズのファイル情報を取得できず: ${c.file}` };
    continue;
  }
  try {
    // 候補：SVG は原本 → PNG サムネイル（500/330/250/220px）。画像は原本（大きければサムネイル）→ 小さいサムネイル
    const isSvg = info.mime === "image/svg+xml";
    const scale = (w) => ({ width: w, height: Math.round((info.height * w) / info.width) });
    const candidates = [];
    if (isSvg) candidates.push({ url: info.url, ext: "svg", width: info.width, height: info.height, svg: true });
    else if (!(info.thumb && info.width > 500))
      candidates.push({ url: info.url, ext: (info.url.split("?")[0].split(".").pop() || "png").toLowerCase(), width: info.width, height: info.height });
    for (const w of THUMB_WIDTHS) {
      if (!info.thumb || (!isSvg && w >= info.width)) continue;
      const url = thumbAt(info.thumb, w);
      candidates.push({ url, ext: (url.split("?")[0].split(".").pop() || "png").toLowerCase(), ...scale(w) });
    }
    let got = null;
    let lastErr = null;
    for (const cand of candidates) {
      try {
        await removeLogoFiles(code);
        const bytes = await download(cand.url, path.join(LOGO_DIR, `${code}.${cand.ext}`));
        if (cand.svg && bytes > MAX_SVG_BYTES) continue; // 大きすぎる SVG は PNG で取り直す
        got = cand;
        break;
      } catch (e) {
        if (e instanceof DeadlineError) throw e;
        lastErr = e;
        await sleep(3000);
      }
    }
    if (!got) {
      await removeLogoFiles(code);
      throw lastErr ?? new SkipError("画像を取得できず");
    }
    const { ext, width, height } = got;
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
    await save();
  } catch (e) {
    // 前回取得できていた画像があれば残す
    out[code] = prev[code] && !prev[code].missing
      ? prev[code]
      : { missing: true, qid: c.qid, title: c.title, reason: `一時的に取得できず（次の実行で再試行）: ${String(e.message).slice(0, 150)}` };
    console.log(`NG ${code}\t${e.message.slice(0, 120)}`);
    await save();
    if (e instanceof DeadlineError) break;
  }
}

// 対応表の順に並べて保存
const ordered = await save();
const missing = Object.entries(ordered).filter(([, v]) => v.missing);
console.log(`\n${Object.keys(ordered).length - missing.length}/${Object.keys(ordered).length} 社のロゴを取得済み`);
for (const [k, v] of missing) console.log(`  未取得 ${k}: ${v.reason}`);
