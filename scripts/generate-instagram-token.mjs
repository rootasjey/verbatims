#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'

function printUsage() {
  console.log(`Instagram token helper

Usage:
  node scripts/generate-instagram-token.mjs auth-url --app-id <id> --redirect-uri <uri> [--api-version <v25.0>] [--scopes <comma-separated>]
  node scripts/generate-instagram-token.mjs exchange-code --app-id <id> --app-secret <secret> --code <code> --redirect-uri <uri> [--api-version <v25.0>]
  node scripts/generate-instagram-token.mjs exchange-token --app-id <id> --app-secret <secret> --token <short-lived-token> [--api-version <v25.0>]
  node scripts/generate-instagram-token.mjs from-code --app-id <id> --app-secret <secret> --code <code> --redirect-uri <uri> [--api-version <v25.0>]

Options:
  --app-id         Meta app id
  --app-secret     Meta app secret
  --code           OAuth code returned by Facebook Login redirect
  --token          Short-lived user token
  --redirect-uri   Redirect URI used during login (must be configured in Meta app)
  --api-version    Graph API version (default: v25.0)
  --scopes         OAuth scopes for auth-url command
  --write-env      Write long-lived token to .env (or pass a file path)
  --env-file       Explicit env file path (default: .env)

Env fallbacks:
  META_APP_ID, META_APP_SECRET, META_REDIRECT_URI, NUXT_INSTAGRAM_POST_REDIRECT_URI, NUXT_INSTAGRAM_POST_API_VERSION

Notes:
  - If you pass flags without a command, the CLI safely infers one:
      --code  => from-code
      --token => exchange-token
      otherwise => auth-url
  - Your redirect URI domain must be listed in Meta App > Settings > Basic > App Domains.
  - The full redirect URI must be listed in Facebook Login > Settings > Valid OAuth Redirect URIs.
`)
}

const COMMANDS = new Set(['auth-url', 'exchange-code', 'exchange-token', 'from-code'])

function inferCommand(flags) {
  if (flags.code) return 'from-code'
  if (flags.token) return 'exchange-token'
  if (Object.keys(flags).length > 0) return 'auth-url'
  return ''
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const first = args[0]
  const hasExplicitCommand = Boolean(first && !first.startsWith('--'))
  const command = hasExplicitCommand ? first : ''
  const parsedArgs = hasExplicitCommand ? args.slice(1) : args
  const flags = {}

  for (let index = 0; index < parsedArgs.length; index += 1) {
    const part = parsedArgs[index]
    if (!part?.startsWith('--')) continue
    const key = part.slice(2)
    const value = parsedArgs[index + 1]
    if (!value || value.startsWith('--')) {
      flags[key] = true
      continue
    }
    flags[key] = value
    index += 1
  }

  if (hasExplicitCommand) {
    return {
      command,
      flags,
      inferred: false,
      explicitCommandProvided: true
    }
  }

  const inferredCommand = inferCommand(flags)

  return {
    command: inferredCommand,
    flags,
    inferred: Boolean(inferredCommand),
    explicitCommandProvided: false
  }
}

function requireValue(value, label) {
  if (!value || value === true) {
    throw new Error(`Missing required option: ${label}`)
  }
  return String(value)
}

function requireRedirectUri(value) {
  if (!value || value === true) {
    throw new Error(
      'Missing redirect URI. Pass --redirect-uri <uri> (or set META_REDIRECT_URI). Also add its domain to App Domains and the full URI to Valid OAuth Redirect URIs in Meta.'
    )
  }

  return String(value)
}

function parseExpiresIn(expiresIn) {
  const seconds = Number(expiresIn)
  if (!Number.isFinite(seconds) || seconds <= 0) return null
  const expiresAt = new Date(Date.now() + seconds * 1000)
  return {
    seconds,
    expiresAt
  }
}

async function graphGet(url, params) {
  const requestUrl = new URL(url)
  for (const [key, value] of Object.entries(params)) {
    requestUrl.searchParams.set(key, String(value))
  }

  const response = await fetch(requestUrl)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload?.error) {
    const message = payload?.error?.message || `Request failed (${response.status})`
    throw new Error(message)
  }

  return payload
}

function printTokenResult(label, payload) {
  const accessToken = payload?.access_token ? String(payload.access_token) : ''
  const tokenType = payload?.token_type ? String(payload.token_type) : 'unknown'
  const expiry = parseExpiresIn(payload?.expires_in)

  console.log(`\n${label}`)
  console.log(`- token_type: ${tokenType}`)
  if (expiry) {
    console.log(`- expires_in: ${expiry.seconds}s`)
    console.log(`- expires_at: ${expiry.expiresAt.toISOString()}`)
  }
  console.log(`- access_token: ${accessToken}`)

  return accessToken
}

async function writeTokenToEnvFile(input) {
  const envPath = path.resolve(process.cwd(), input.envFile)
  const variable = 'NUXT_INSTAGRAM_POST_ACCESS_TOKEN'

  let current = ''
  let existed = true

  try {
    current = await fs.readFile(envPath, 'utf8')
  } catch {
    existed = false
  }

  if (existed) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `${envPath}.bak.${stamp}`
    await fs.copyFile(envPath, backupPath)
    console.log(`- backup: ${backupPath}`)
  }

  const line = `${variable}=${input.token}`
  const pattern = new RegExp(`^${variable}=.*$`, 'm')
  const next = current
    ? (pattern.test(current)
        ? current.replace(pattern, line)
        : `${current}${current.endsWith('\n') ? '' : '\n'}${line}\n`)
    : `${line}\n`

  await fs.writeFile(envPath, next, 'utf8')
  console.log(`- wrote: ${envPath}`)
}

async function run() {
  const { command, flags, inferred, explicitCommandProvided } = parseArgs(process.argv)

  if (flags.h || flags.help || ['-h', '--help', 'help'].includes(command)) {
    printUsage()
    return
  }

  if (!command) {
    printUsage()
    return
  }

  if (explicitCommandProvided && !COMMANDS.has(command)) {
    throw new Error(`Unknown command: ${command}`)
  }

  if (inferred) {
    console.log(`\nNo command provided. Inferred command: ${command}`)
  }

  const appId = String(flags['app-id'] || process.env.META_APP_ID || '')
  const appSecret = String(flags['app-secret'] || process.env.META_APP_SECRET || '')
  const apiVersion = String(flags['api-version'] || process.env.NUXT_INSTAGRAM_POST_API_VERSION || 'v25.0')
  const redirectUri = String(flags['redirect-uri'] || process.env.META_REDIRECT_URI || process.env.NUXT_INSTAGRAM_POST_REDIRECT_URI || '')
  const writeEnv = Boolean(flags['write-env'])
  const envFileFromWriteFlag = typeof flags['write-env'] === 'string' ? String(flags['write-env']) : ''
  const envFile = String(flags['env-file'] || envFileFromWriteFlag || '.env')

  if (command === 'auth-url') {
    const resolvedAppId = requireValue(appId, '--app-id or META_APP_ID')
    const resolvedRedirectUri = requireRedirectUri(redirectUri)
    const scopes = String(flags.scopes || 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management')
    const loginUrl = new URL(`https://www.facebook.com/${apiVersion}/dialog/oauth`)
    loginUrl.searchParams.set('client_id', resolvedAppId)
    loginUrl.searchParams.set('redirect_uri', resolvedRedirectUri)
    loginUrl.searchParams.set('scope', scopes)
    loginUrl.searchParams.set('response_type', 'code')

    console.log('\nOpen this URL in your browser and complete login/consent:')
    console.log(loginUrl.toString())
    console.log('\nThen copy the `code` query value from the redirect URL and run `from-code` or `exchange-code`.')
    return
  }

  if (command === 'exchange-code') {
    const resolvedAppId = requireValue(appId, '--app-id or META_APP_ID')
    const resolvedAppSecret = requireValue(appSecret, '--app-secret or META_APP_SECRET')
    const resolvedRedirectUri = requireRedirectUri(redirectUri)
    const code = requireValue(flags.code, '--code')

    const shortLived = await graphGet(`https://graph.facebook.com/${apiVersion}/oauth/access_token`, {
      client_id: resolvedAppId,
      redirect_uri: resolvedRedirectUri,
      client_secret: resolvedAppSecret,
      code
    })

    printTokenResult('Short-lived token response', shortLived)
    console.log('\nNext: run `exchange-token` with that access token to obtain a long-lived token.')
    return
  }

  if (command === 'exchange-token') {
    const resolvedAppId = requireValue(appId, '--app-id or META_APP_ID')
    const resolvedAppSecret = requireValue(appSecret, '--app-secret or META_APP_SECRET')
    const shortToken = requireValue(flags.token, '--token')

    const longLived = await graphGet(`https://graph.facebook.com/${apiVersion}/oauth/access_token`, {
      grant_type: 'fb_exchange_token',
      client_id: resolvedAppId,
      client_secret: resolvedAppSecret,
      fb_exchange_token: shortToken
    })

    const token = printTokenResult('Long-lived token response', longLived)
    console.log('\nUse this in your env:')
    console.log(`NUXT_INSTAGRAM_POST_ACCESS_TOKEN=${token}`)

    if (writeEnv) {
      console.log('\nWriting token to env file...')
      await writeTokenToEnvFile({ envFile, token })
    }
    return
  }

  if (command === 'from-code') {
    const resolvedAppId = requireValue(appId, '--app-id or META_APP_ID')
    const resolvedAppSecret = requireValue(appSecret, '--app-secret or META_APP_SECRET')
    const resolvedRedirectUri = requireRedirectUri(redirectUri)
    const code = requireValue(flags.code, '--code')

    const shortLived = await graphGet(`https://graph.facebook.com/${apiVersion}/oauth/access_token`, {
      client_id: resolvedAppId,
      redirect_uri: resolvedRedirectUri,
      client_secret: resolvedAppSecret,
      code
    })

    const shortToken = printTokenResult('Short-lived token response', shortLived)

    const longLived = await graphGet(`https://graph.facebook.com/${apiVersion}/oauth/access_token`, {
      grant_type: 'fb_exchange_token',
      client_id: resolvedAppId,
      client_secret: resolvedAppSecret,
      fb_exchange_token: shortToken
    })

    const longToken = printTokenResult('Long-lived token response', longLived)
    console.log('\nUse this in your env:')
    console.log(`NUXT_INSTAGRAM_POST_ACCESS_TOKEN=${longToken}`)

    if (writeEnv) {
      console.log('\nWriting token to env file...')
      await writeTokenToEnvFile({ envFile, token: longToken })
    }
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

run().catch((error) => {
  console.error('\nError:', error?.message || error)
  process.exit(1)
})
