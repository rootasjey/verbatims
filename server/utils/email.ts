import { Resend } from 'resend'
import { resolveAppOrigin } from './app-origin'
import type { H3Event } from 'h3'

function getResendClient(): Resend {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Email service not configured' })
  }
  return new Resend(apiKey)
}

function getFromAddress(): string {
  const config = useRuntimeConfig()
  return config.emailFromAddress || 'Verbatims <noreply@verbatims.cc>'
}

export async function sendPasswordResetEmail(event: H3Event, toEmail: string, token: string): Promise<void> {
  const origin = resolveAppOrigin(event)
  const resetUrl = `${origin}/reset-password?token=${token}`

  const resend = getResendClient()
  const { error } = await resend.emails.send({
    from: getFromAddress(),
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

  if (error) {
    console.error('Failed to send password reset email:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to send password reset email' })
  }
}

export async function sendVerificationEmail(event: H3Event, toEmail: string, token: string): Promise<void> {
  const origin = resolveAppOrigin(event)
  const verifyUrl = `${origin}/verify-email?token=${token}`

  const resend = getResendClient()
  const { error } = await resend.emails.send({
    from: getFromAddress(),
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

  if (error) {
    console.error('Failed to send verification email:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to send verification email' })
  }
}