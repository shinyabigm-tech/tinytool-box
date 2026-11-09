// Cloudflare Pages Functions middleware:
//  1) adds a shared footer (home / about / privacy / contact) to every HTML page, right after </main>
//  2) adds the Google AdSense code to <head> of every HTML page, ONLY when ADSENSE_CLIENT is set below
// Static files and non-HTML responses pass through untouched.
// To undo: delete this file (functions/_middleware.js) from the repository.

// ---- AdSense switch ------------------------------------------------------
// 申請の日に、AdSenseで発行された「ca-pub-」で始まる発行元IDを、ここに1行だけ入れます。
// 空のままなら、広告コードは何も出力されません（今は空のままで大丈夫です）。
const ADSENSE_CLIENT = "ca-pub-3044045257923362";
// const ADSENSE_CLIENT = ""; // 例: "ca-pub-1234567890123456"
// 広告コードを入れないページ（空の配列 [] にすると、全ページに入ります）
const ADSENSE_EXCLUDE = ["/privacy/", "/contact/"];
// --------------------------------------------------------------------------

const FOOTER =
  '<footer data-sitefooter="1" style="max-width:760px;margin:0 auto;padding:18px 16px 40px;font-size:14px;line-height:1.8;color:var(--sub,#53607a);border-top:1px solid var(--line,#c5cedd)">' +
  '<nav aria-label="サイトの案内">' +
  '<a href="/" style="color:var(--accent,#1f3a8a);margin-right:16px">ホーム</a>' +
  '<a href="/about/" style="color:var(--accent,#1f3a8a);margin-right:16px">運営者情報</a>' +
  '<a href="/privacy/" style="color:var(--accent,#1f3a8a);margin-right:16px">プライバシーポリシー</a>' +
  '<a href="/contact/" style="color:var(--accent,#1f3a8a)">お問い合わせ</a>' +
  '</nav>' +
  '<p style="margin:8px 0 0">© 2026 tinytool-box ／ 入力したデータは、ブラウザの中だけで処理され、送信されません。</p>' +
  '</footer>';

function adsenseTag() {
  // Only a well-formed publisher id is ever written into the page.
  if (!/^ca-pub-\d+$/.test(ADSENSE_CLIENT)) return "";
  return (
    '<meta name="google-adsense-account" content="' + ADSENSE_CLIENT + '">' +
    '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
    ADSENSE_CLIENT + '" crossorigin="anonymous"></script>'
  );
}

export async function onRequest(context) {
  const response = await context.next();
  if (response.status !== 200) return response;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  let html = await response.text();
  const headers = new Headers(response.headers);
  headers.delete("content-length");

  // 1) AdSense code in <head> (only when enabled, not on excluded pages, and never twice)
  const tag = adsenseTag();
  const path = new URL(context.request.url).pathname;
  if (tag && !ADSENSE_EXCLUDE.includes(path) &&
      !html.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js") &&
      !html.includes("google-adsense-account")) {
    const m = /<\/head>/i.exec(html);
    if (m) html = html.slice(0, m.index) + tag + html.slice(m.index);
  }

  // 2) shared footer right after </main> (unchanged behaviour)
  const marker = "</main>";
  const i = html.indexOf(marker);
  if (i >= 0 && !html.includes("data-sitefooter")) {
    html = html.slice(0, i + marker.length) + FOOTER + html.slice(i + marker.length);
  }
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
