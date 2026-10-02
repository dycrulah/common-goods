/**
 * A single shared wrapper so every email looks like it's from the same
 * store. Uses inline styles and a centered max-width block rather than a
 * full table-based layout — simpler to read and edit, and renders fine in
 * modern clients (Gmail, Outlook web/desktop, Apple Mail). If you need
 * pixel-perfect rendering in very old Outlook desktop versions later,
 * that's when to switch this to a table-based layout.
 */
export function emailLayout(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#f7f5ef;font-family:Georgia,'Work Sans',Arial,sans-serif;color:#1e2320;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:#fffdf8;border:1px solid #ddd8c9;">
            <tr>
              <td style="padding:28px 28px 0 28px;">
                <p style="margin:0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#2f4a3c;">
                  Common Goods
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 28px 28px;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:12px;color:#8a8578;">
            Common Goods · Osogbo, Nigeria
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
