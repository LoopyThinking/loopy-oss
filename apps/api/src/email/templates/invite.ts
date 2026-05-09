// HTML + plain-text email template for organization invites.

export interface InviteTemplateInput {
  orgName: string
  role: string
  inviteUrl: string
  expiresAt: string
}

export function renderInviteHtml(input: InviteTemplateInput): string {
  const expires = new Date(input.expiresAt).toLocaleDateString('en', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
      <tr><td style="padding:32px 32px 0;">
        <h1 style="margin:0;font-size:20px;color:#1a1a2e;">You're invited to <strong>${escapeHtml(input.orgName)}</strong></h1>
        <p style="margin:12px 0 0;font-size:14px;color:#555;line-height:1.5;">
          You've been invited to join <strong>${escapeHtml(input.orgName)}</strong> on Loopy with the role of <strong>${escapeHtml(input.role)}</strong>.
        </p>
        <p style="margin:8px 0 0;font-size:14px;color:#555;line-height:1.5;">
          Loopy helps your team track cognitive work — signals, decisions, reflections — across projects and agents.
        </p>
      </td></tr>
      <tr><td align="center" style="padding:24px 32px;">
        <a href="${escapeHtml(input.inviteUrl)}"
           style="display:inline-block;padding:12px 32px;font-size:15px;font-weight:600;color:#fff;background:#4f46e5;border-radius:8px;text-decoration:none;">
          Accept invitation →
        </a>
      </td></tr>
      <tr><td style="padding:0 32px 24px;">
        <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">
          This invitation expires on <strong>${escapeHtml(expires)}</strong>.<br>
          If you have questions, contact the person who invited you.
        </p>
      </td></tr>
      <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #eee;">
        <p style="margin:0;font-size:11px;color:#aaa;">
          Loopy OSS · Self-hosted collaborative intelligence platform
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`
}

export function renderInviteText(input: InviteTemplateInput): string {
  const expires = new Date(input.expiresAt).toLocaleDateString('en', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return [
    `You're invited to join ${input.orgName} on Loopy.`,
    '',
    `Role: ${input.role}`,
    '',
    `Open this link to accept: ${input.inviteUrl}`,
    '',
    `This invitation expires on ${expires}.`,
  ].join('\n')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
