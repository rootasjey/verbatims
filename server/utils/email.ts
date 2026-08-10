import type { H3Event } from 'h3'
import { resolveAppOrigin } from './app-origin'

interface EmailAddress {
  email: string
  name?: string
}

interface EmailSendPayload {
  from: string | EmailAddress
  to: string
  subject: string
  text?: string
  html?: string
}

interface EmailSendBinding {
  send(payload: EmailSendPayload): Promise<{ messageId: string }>
}

function getEmailBinding(): EmailSendBinding | undefined {
  const binding = (process.env as Record<string, unknown>).EMAIL
    || (globalThis as any).__env__?.EMAIL
    || (globalThis as any).EMAIL
  return binding as EmailSendBinding | undefined
}

function getFromAddress(): string {
  const config = useRuntimeConfig()
  return config.emailFromAddress || 'Verbatims <noreply@verbatims.cc>'
}

function parseFromAddress(full: string): string | EmailAddress {
  const match = full.match(/^(.*?)\s*<([^>]+)>$/)
  const name = match?.[1]
  const email = match?.[2]
  if (name !== undefined && email !== undefined) {
    return { name: name.trim(), email: email.trim() }
  }
  return full.trim()
}

async function sendEmail(event: H3Event, payload: Omit<EmailSendPayload, 'from'>): Promise<void> {
  const from = parseFromAddress(getFromAddress())
  const binding = getEmailBinding()

  // Dev fallback: no EMAIL binding under `nuxt dev`, so log instead of sending.
  if (!binding) {
    if (import.meta.dev) {
      const body = payload.html
        ? payload.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        : payload.text || ''
      console.log('\n📧 [DEV] Email to %s\nFrom: %s\nSubject: %s\nBody: %s\n', payload.to, typeof from === 'string' ? from : `${from.name || ''} <${from.email}>`, payload.subject, body)
      return
    }
    throwServer(500, 'Email service not configured')
  }

  try {
    await binding.send({ from, ...payload })
  } catch (error) {
    console.error('Failed to send email:', error)
    throwServer(500, 'Failed to send email')
  }
}

export async function sendPasswordResetEmail(event: H3Event, toEmail: string, token: string): Promise<void> {
  const origin = resolveAppOrigin(event)
  const resetUrl = `${origin}/reset-password?token=${token}`

  await sendEmail(event, {
    to: toEmail,
    subject: 'Reset your Verbatims password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="color: #111827; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #374151; margin-bottom: 24px;">
          We received a request to reset the password for your Verbatims account.
          Click the button below to choose a new password.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #3C82F6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">
          Reset Password
        </a>
        <p style="color: #6B7280; font-size: 14px;">
          If you didn't request this, you can safely ignore this email. This link expires in 1 hour.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">
          Verbatims &mdash; Modern Quotes Service
        </p>
      </div>
    `,
    text: `Reset your Verbatims password.\n\nClick the link below to choose a new password:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
  })
}

export async function sendVerificationEmail(event: H3Event, toEmail: string, token: string): Promise<void> {
  const origin = resolveAppOrigin(event)
  const verifyUrl = `${origin}/verify-email?token=${token}`

  await sendEmail(event, {
    to: toEmail,
    subject: 'Verify your Verbatims email',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="color: #111827; margin-bottom: 16px;">Verify your email address</h2>
        <p style="color: #374151; margin-bottom: 24px;">
          Welcome to Verbatims! Please verify your email address to activate your account and start submitting quotes.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background-color: #3C82F6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">
          Verify Email
        </a>
        <p style="color: #6B7280; font-size: 14px;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">
          Verbatims &mdash; Modern Quotes Service
        </p>
      </div>
    `,
    text: `Verify your Verbatims email.\n\nClick the link below to verify your email address:\n${verifyUrl}\n\nThis link expires in 24 hours. If you didn't create an account, you can safely ignore this email.`,
  })
}

export async function sendSponsorStatusEmail(
  event: H3Event,
  toEmail: string,
  messageText: string,
  status: 'approved' | 'rejected',
  reason?: string | null,
  startsAt?: string | null,
): Promise<void> {
  const origin = resolveAppOrigin(event)
  const dashboardUrl = `${origin}/dashboard/sponsors`

  const isScheduled = status === 'approved' && startsAt && new Date(startsAt) > new Date()

  const subject = status === 'approved'
    ? isScheduled
      ? 'Your sponsored message has been approved on Verbatims'
      : 'Your sponsored message is now live on Verbatims'
    : 'Your sponsored message was not approved'

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const bodyHtml = status === 'approved'
    ? isScheduled
      ? `
      <p style="color: #374151; margin-bottom: 16px;">Your sponsored message has been approved and will go live on <strong>${formatDate(startsAt!)}</strong>.</p>
      <blockquote style="border-left: 3px solid #3C82F6; margin: 16px 0; padding: 8px 16px; color: #374151; font-style: italic;">${messageText}</blockquote>`
      : `
      <p style="color: #374151; margin-bottom: 16px;">Your sponsored message is now live and visible on Verbatims.</p>
      <blockquote style="border-left: 3px solid #3C82F6; margin: 16px 0; padding: 8px 16px; color: #374151; font-style: italic;">${messageText}</blockquote>`
    : `
      <p style="color: #374151; margin-bottom: 16px;">Your sponsored message was reviewed and not approved.</p>
      ${reason ? `<p style="color: #6B7280; margin-bottom: 16px;"><strong>Reason:</strong> ${reason}</p>` : ''}
      <blockquote style="border-left: 3px solid #EF4444; margin: 16px 0; padding: 8px 16px; color: #374151; font-style: italic;">${messageText}</blockquote>
      <p style="color: #6B7280; font-size: 14px;">You can edit your message and resubmit it from your dashboard.</p>`

  const textBody = status === 'approved'
    ? isScheduled
      ? `Your sponsored message has been approved and will go live on ${formatDate(startsAt!)}.\n\n"${messageText}"\n\nView in dashboard: ${dashboardUrl}`
      : `Your sponsored message is now live and visible on Verbatims.\n\n"${messageText}"\n\nView in dashboard: ${dashboardUrl}`
    : `Your sponsored message was reviewed and not approved.\n${reason ? `Reason: ${reason}\n` : ''}\n"${messageText}"\n\nView in dashboard: ${dashboardUrl}`

  try {
    await sendEmail(event, {
      to: toEmail,
      subject,
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="color: #111827; margin-bottom: 16px;">${subject}</h2>
        ${bodyHtml}
        <a href="${dashboardUrl}" style="display: inline-block; background-color: #3C82F6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
          View in Dashboard
        </a>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">Verbatims &mdash; Modern Quotes Service</p>
      </div>
    `,
      text: textBody,
    })
  } catch (error) {
    console.error('Failed to send sponsor status email:', error)
  }
}
