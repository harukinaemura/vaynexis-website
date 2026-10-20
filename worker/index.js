// 動画（/assets/*.mp4）の部分取得に 206 で答える Worker。
//
// Cloudflare の静的アセット配信は Range ヘッダを見ず、常に 200 でファイル全体を返す。
// iPhone の Safari はメディアの配信元に byte-range 対応を求める（Apple の Safari Web Content Guide
// 「Configuring Your Server」）ので、このままだと動画が再生できない恐れがある。
// wrangler.jsonc の run_worker_first で /assets/*.mp4 だけをここに通す。ほかのファイル（HTML・CSS・画像）は
// これまでどおり Worker を通らずに静的配信され、_headers もそのまま効く。
// ここで返す応答のヘッダは env.ASSETS.fetch の応答（_headers の内容を含む）を写したもの。

export default {
  async fetch(request, env) {
    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      return env.ASSETS.fetch(request);
    }

    // Range と If-Range を外した GET で取りに行く（静的配信には普通の GET として扱わせる）。
    // If-None-Match は残す（一致すれば静的配信が 304 を返し、それをそのまま返す）。
    const headers = new Headers(request.headers);
    headers.delete("Range");
    headers.delete("If-Range");
    const asset = await env.ASSETS.fetch(new Request(request.url, { method: "GET", headers }));

    // 200 以外（304・404 の頁など）は触らずに返す（HEAD なら本文だけ外す）
    // 静的アセットに無いパスがここへ回ってきても、静的配信の 404 の頁と状態 404 がそのまま返る
    if (asset.status !== 200) {
      return method === "HEAD" ? new Response(null, asset) : asset;
    }

    const body = await asset.arrayBuffer();
    const size = body.byteLength;
    const out = new Headers(asset.headers);
    out.set("Accept-Ranges", "bytes");

    const rangeHeader = request.headers.get("Range");
    const range = rangeHeader && ifRangeMatches(request, asset) ? parseRange(rangeHeader, size) : null;

    if (range === "unsatisfiable") {
      out.set("Content-Range", `bytes */${size}`);
      out.set("Content-Length", "0");
      return new Response(null, { status: 416, headers: out });
    }

    if (range === null) {
      // Range なし、または読めない・複数の範囲 → 全体を 200 で返す（RFC 9110 では Range を無視してよい）
      out.set("Content-Length", String(size));
      return new Response(method === "HEAD" ? null : body, { status: 200, headers: out });
    }

    const { start, end } = range;
    out.set("Content-Range", `bytes ${start}-${end}/${size}`);
    out.set("Content-Length", String(end - start + 1));
    return new Response(method === "HEAD" ? null : body.slice(start, end + 1), { status: 206, headers: out });
  },
};

// If-Range があるときは、ETag が強い比較で一致したときだけ Range に答える（日付の If-Range は全体を返す）
function ifRangeMatches(request, asset) {
  const ifRange = request.headers.get("If-Range");
  if (ifRange === null) return true;
  const etag = asset.headers.get("ETag");
  return etag !== null && !etag.startsWith("W/") && ifRange.trim() === etag;
}

// 1つの範囲だけを扱う。bytes=開始-終了 / bytes=開始- / bytes=-末尾の長さ
function parseRange(header, size) {
  const m = /^\s*bytes\s*=\s*(\d*)\s*-\s*(\d*)\s*$/i.exec(header);
  if (!m) return null;
  const [, first, last] = m;
  if (first === "" && last === "") return null;

  if (first === "") {
    const suffix = Number(last);
    if (suffix === 0 || size === 0) return "unsatisfiable";
    return { start: Math.max(size - suffix, 0), end: size - 1 };
  }

  const start = Number(first);
  if (last !== "" && Number(last) < start) return null; // 終了が開始より前＝範囲として無効なので無視
  if (start >= size) return "unsatisfiable";
  const end = last === "" ? size - 1 : Math.min(Number(last), size - 1);
  return { start, end };
}
