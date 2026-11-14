// お問い合わせフォーム（/contact#form）の送信を受け取り、1通のメールにして会社の Gmail へ送る。
//
// 保存はしない。残るのは Gmail に届いたメールだけ（プライバシーポリシー 7.）。
// お客様への自動返信は送らない（任意の相手への送信は Cloudflare の有料プランが要るため）。代わりに送信後の頁で次の流れを示す。
// 送り先は wrangler.jsonc の send_email（destination_address）で、メールルーティングの「確認済みの宛先」に限られる。
// ログには失敗の種類だけを書き、入力の中身は書かない。

export const TO = "vaynexis177@gmail.com";
export const FROM = { email: "form@vaynexis.jp", name: "Vaynexis サイトのフォーム" };

const KINDS = ["初回無料相談", "30分の無料相談", "そのほかのお問い合わせ", "協業・紹介・共同提案"]; // 2026-11-03：新しい値と古い値の両方を受ける（古いページ・キャッシュからの送信を弾かない）。数週間後に「30分の無料相談」を外す
const STYLES = ["オンライン", "滋賀県内の訪問", "未定"];
// 名前: [見出し, 必須か, 上限の字数]
const FIELDS = {
  kind: ["ご用件", true, 20],
  company: ["会社名", true, 100],
  name: ["お名前", true, 60],
  email: ["メールアドレス", true, 254],
  tel: ["電話番号", false, 20],
  body: ["ご相談の内容", true, 3000],
  style: ["ご希望の形式", false, 20],
  when: ["ご希望の日時", false, 100],
  source: ["知ったきっかけ", false, 100],
};
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;
const MIN_MS = 3000; // 頁を開いてから3秒未満の送信は機械とみなして捨てる
const SLOW_MS = 10000; // 3〜10秒は届けるが、件名に【確認】を付ける（人が書けば10秒は超える。人を落とさないよう捨てはしない）
const MAX_BYTES = 20000;
// 2026-11-14：ボット（自動送信の道具）だけを止める。人の営業は止めない（本人の方針）。
// Turnstile（Cloudflare の、人か機械かの確認）。鍵 TURNSTILE_SECRET が Worker に登録されていなければ確かめない
// ＝鍵の登録前に公開しても今までどおり動く。送るのは確認の札（トークン）と鍵だけで、入力の中身と IP は送らない。
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// 入力を確かめる。{ drop } は機械の送信（黙って「受け付けました」を返す）、{ ok: false } は入力の誤り
// notes は「機械かもしれない」印の理由。1つでもあれば件名に【確認】を付けて届ける（捨てない）
export function check(form, now) {
  if (String(form.get("website") || "") !== "") return { drop: true, why: "見えない欄" };
  const t = Number(form.get("t") || "");
  const notes = [];
  if (!t) notes.push("頁の読み込み時刻がない送信です（スクリプトが動かない環境か、機械の送信）。");
  else if (now - t < MIN_MS) return { drop: true, why: "早すぎる送信" };
  else if (now - t < SLOW_MS) notes.push(`頁を開いてから${Math.round((now - t) / 1000)}秒で送られました（人が書くと、ふつうは10秒を超えます）。`);
  // h＝キー入力・貼り付け・音声入力など、ブラウザが本物と認める入力の回数（contact-form.js が数える）。
  // 道具が欄に文字を直接書き込むと 0 になる。古い頁（h の欄がない）からの送信は印を付けない
  if (t && String(form.get("h") ?? "") === "0") notes.push("キー入力や貼り付けの跡がない送信です（道具が欄に直接書き込んだ可能性）。");
  const data = {};
  for (const [k, [label, required, max]] of Object.entries(FIELDS)) {
    let v = String(form.get(k) || "").replace(/\r\n?/g, "\n").trim();
    if (k !== "body") v = v.replace(/\s+/g, " ");
    if (required && !v) return { ok: false, why: `${label}が空` };
    if (v.length > max) return { ok: false, why: `${label}が長すぎる` };
    data[k] = v;
  }
  if (!KINDS.includes(data.kind)) return { ok: false, why: "ご用件が一覧にない" };
  if (data.style && !STYLES.includes(data.style)) return { ok: false, why: "形式が一覧にない" };
  if (!EMAIL_RE.test(data.email)) return { ok: false, why: "メールアドレスの形" };
  if (String(form.get("agree") || "") !== "1") return { ok: false, why: "同意なし" };
  return { ok: true, data, notes };
}

// Turnstile の札を Cloudflare に確かめる。"skip"＝鍵が未登録、"ok"、"fail"＝札がない・通らない、"error"＝確かめられない
export async function verifyTurnstile(token, secret, fetchFn = fetch) {
  if (!secret) return "skip";
  if (!token) return "fail";
  try {
    const res = await fetchFn(VERIFY_URL, { method: "POST", body: new URLSearchParams({ secret, response: token }) });
    const j = await res.json();
    if (j && j.success === true) return "ok";
    console.error("お問い合わせ：Turnstile を通らない", (j && j["error-codes"] || []).join(","));
    // 鍵の誤り・形の誤りは当社側の問題＝お客様を止めない
    if (j && (j["error-codes"] || []).some((c) => /secret|bad-request|internal-error/.test(c))) return "error";
    return "fail";
  } catch (e) {
    console.error("お問い合わせ：Turnstile を確かめられない", e && e.message);
    return "error";
  }
}

// 件名と本文。Gmail で「返信」を押すとお客様に届くよう、返信先は呼び出し側で入れる
export function compose(data, notes, at) {
  const flag = notes.length ? "【確認】" : "";
  const subject = `【サイトのお問い合わせ】${data.kind}／${data.company.slice(0, 40)}${flag}`;
  const row = (k) => `${FIELDS[k][0]}：${data[k] || "（未記入）"}`;
  const text = [
    "vaynexis.jp のお問い合わせフォームから届きました。",
    `受付：${at.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
    ...notes.map((n) => `※${n}中身を見て判断してください。`),
    "",
    row("kind"), row("company"), row("name"), row("email"), row("tel"), row("style"), row("when"), row("source"),
    "",
    "―― ご相談の内容 ――",
    data.body,
    "",
    "――",
    "このメールに返信すると、お客様（上のメールアドレス）に届きます。",
    "お問い合わせだけで終わった場合は、最後のやり取りから1年で削除します（プライバシーポリシー 7.）。",
  ].join("\n");
  return { subject, text };
}

function b64(s) {
  let bin = "";
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
  return btoa(bin);
}

// RFC 2047 の符号化語は1つ75字まで。日本語15字ずつに分けて折り返す
function header(s) {
  const parts = [];
  const chars = [...s];
  for (let i = 0; i < chars.length; i += 15) parts.push(`=?UTF-8?B?${b64(chars.slice(i, i + 15).join(""))}?=`);
  return parts.join("\r\n ");
}

// 構造化の send が使えないときのための、生のメール（text/plain・UTF-8・base64）
export function mime({ subject, text, replyTo, replyName, messageId, date }) {
  return [
    `From: ${header(FROM.name)} <${FROM.email}>`,
    `To: <${TO}>`,
    `Reply-To: ${header(replyName)} <${replyTo}>`,
    `Subject: ${header(subject)}`,
    `Date: ${date.toUTCString()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(text.replace(/\n/g, "\r\n")).replace(/.{76}/g, "$&\r\n"),
  ].join("\r\n");
}

export async function handleContact(request, env, EmailMessage) {
  const back = (path) => Response.redirect(new URL(path, request.url).toString(), 303);
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return new Response("Forbidden", { status: 403 });
  if (Number(request.headers.get("Content-Length") || 0) > MAX_BYTES) return back("/contact-error");

  let form;
  try {
    form = await request.formData();
  } catch {
    return back("/contact-error");
  }
  const r = check(form, Date.now());
  if (r.drop) return back("/contact-sent");
  if (!r.ok) {
    console.error("お問い合わせ：入力の誤り", r.why);
    return back("/contact-error");
  }

  // 通らない送信はエラーの頁へ（黙って捨てない＝人だった場合も、メール・電話の案内が見える）
  const ts = await verifyTurnstile(String(form.get("cf-turnstile-response") || ""), env.TURNSTILE_SECRET);
  if (ts === "fail") return back("/contact-error");
  if (ts === "error") r.notes.push("Cloudflare の確認（Turnstile）ができなかった送信です（Cloudflare 側の障害か鍵の誤りの可能性）。");

  const at = new Date();
  const { subject, text } = compose(r.data, r.notes, at);
  try {
    await env.EMAIL.send({ to: TO, from: FROM, replyTo: { email: r.data.email, name: r.data.name }, subject, text });
  } catch (e) {
    console.error("お問い合わせ：send（構造化）に失敗", e && e.code, e && e.message);
    try {
      const raw = mime({ subject, text, replyTo: r.data.email, replyName: r.data.name, messageId: `<${crypto.randomUUID()}@vaynexis.jp>`, date: at });
      await env.EMAIL.send(new EmailMessage(FROM.email, TO, raw));
    } catch (e2) {
      console.error("お問い合わせ：send（MIME）にも失敗", e2 && e2.code, e2 && e2.message);
      return back("/contact-error");
    }
  }
  return back("/contact-sent");
}
