// Cloudflare Pages Functions middleware: adds a shared footer (home / about / privacy / contact)
// to every HTML page, right after </main>. Static files and non-HTML responses pass through untouched.
// To undo: delete this file (functions/_middleware.js) from the repository.
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

export async function onRequest(context) {
  const response = await context.next();
  if (response.status !== 200) return response;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  const html = await response.text();
  const marker = "</main>";
  const i = html.indexOf(marker);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  if (i < 0 || html.includes("data-sitefooter")) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }
  const out = html.slice(0, i + marker.length) + FOOTER + html.slice(i + marker.length);
  return new Response(out, { status: response.status, statusText: response.statusText, headers });
}
