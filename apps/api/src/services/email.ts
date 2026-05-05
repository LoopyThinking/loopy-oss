// Pluggable email adapter for Loopy OSS.
//
// Configure via environment variables:
//   LOOPY_EMAIL_PROVIDER = smtp | resend | sendgrid (omit = email disabled)
//   LOOPY_EMAIL_FROM     = "Loopy <noreply@example.com>"
//   LOOPY_SMTP_HOST / PORT / USER / PASS / SECURE  (for smtp)
//   LOOPY_RESEND_API_KEY                            (for resend)
//   LOOPY_SENDGRID_API_KEY                          (for sendgrid)

export interface EmailAdapter {
  send(to: string, subject: string, html: string, text: string): Promise<void>
}

// ── Adapter resolution ──────────────────────────────────────────────────────────

export function getEmailAdapter(): EmailAdapter | null {
  const provider = process.env.LOOPY_EMAIL_PROVIDER
  if (!provider) return null

  const from = process.env.LOOPY_EMAIL_FROM ?? 'Loopy <noreply@loopy.local>'

  switch (provider) {
    case 'smtp':
      return createSmtpAdapter(from)
    case 'resend':
      return createResendAdapter(from)
    case 'sendgrid':
      return createSendGridAdapter(from)
    default:
      console.warn(`[email] Unknown LOOPY_EMAIL_PROVIDER "${provider}". Email disabled.`)
      return null
  }
}

// ── SMTP adapter (nodemailer) ──────────────────────────────────────────────────

function createSmtpAdapter(from: string): EmailAdapter | null {
  try {
    const nodemailer = require('nodemailer')
    const transporter = nodemailer.createTransport({
      host: process.env.LOOPY_SMTP_HOST ?? 'localhost',
      port: parseInt(process.env.LOOPY_SMTP_PORT ?? '587', 10),
      secure: process.env.LOOPY_SMTP_SECURE === 'true',
      auth: {
        user: process.env.LOOPY_SMTP_USER ?? '',
        pass: process.env.LOOPY_SMTP_PASS ?? '',
      },
    })
    return {
      async send(to: string, subject: string, html: string, text: string) {
        await transporter.sendMail({ from, to, subject, html, text })
      },
    }
  } catch (e) {
    console.warn('[email] nodemailer not available, install it for SMTP support:', e)
    return null
  }
}

// ── Resend adapter ──────────────────────────────────────────────────────────────

function createResendAdapter(from: string): EmailAdapter | null {
  const apiKey = process.env.LOOPY_RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] LOOPY_RESEND_API_KEY not set')
    return null
  }
  return {
    async send(to: string, subject: string, html: string, text: string) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html, text }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Resend error ${res.status}: ${body}`)
      }
    },
  }
}

// ── SendGrid adapter ────────────────────────────────────────────────────────────

function createSendGridAdapter(from: string): EmailAdapter | null {
  const apiKey = process.env.LOOPY_SENDGRID_API_KEY
  if (!apiKey) {
    console.warn('[email] LOOPY_SENDGRID_API_KEY not set')
    return null
  }
  return {
    async send(to: string, subject: string, html: string, text: string) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from.match(/<(.+)>/)?.[1] ?? from },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`SendGrid error ${res.status}: ${body}`)
      }
    },
  }
}
