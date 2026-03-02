#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'

function printUsage() {
  console.log(`Facebook Page token helper

Usage:
  node scripts/generate-facebook-page-token.mjs from-user-token --app-id <id> --app-secret <secret> --user-token <short-user-token> --page-id <id> [--api-version <v25.0>] [--write-env] [--env-file <path>]
  node scripts/generate-facebook-page-token.mjs verify-page-token --app-id <id> --app-secret <secret> --page-token <token> --page-id <id> [--api-version <v25.0>]

Options:
  --app-id         Meta app id
  --app-secret     Meta app secret
  --user-token     Short-lived user token from Graph API Explorer
  --page-token     Page token to verify
  --page-id        Facebook Page id
  --api-version    Graph API version (default: v25.0)
  --write-env      Write page token + page id to env file
  --env-file       Explicit env file path (default: .env)

Flow covered by from-user-token:
  1) Create app access token
  2) Exchange short user token -> long-lived user token
  3) Fetch page token for page id
  4) Debug page token (validity, scopes, type, expiration)
  5) Verify page access with page token

Env fallbacks:
  META_APP_ID, META_APP_SECRET,
  NUXT_FACEBOOK_POST_API_VERSION, NUXT_FACEBOOK_POST_PAGE_ID,
  NUXT_FACEBOOK_POST_ACCESS_TOKEN
`)
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const command = args[0]
  const flags = {}

  for (let index = 1; index < args.length; index += 1) {
    const part = args[index]
    if (!part?.startsWith('--')) continue
    const key = part.slice(2)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) {
      flags[key] = true
      continue
    }
    flags[key] = value
    index += 1
  }

  return { command, flags }
}

function requireValue(value, label) {
  if (!value || value === true) {
    throw new Error(`Missing required option: ${label}`)
  }
  return String(value)
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

async function graphPostForm(url, params) {
  const form = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    form.set(key, String(value))
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.error) {
    const message = payload?.error?.message || `Request failed (${response.status})`
    throw new Error(message)
  }

  return payload
}

function asIso(unixSeconds) {
  const num = Number(unixSeconds)
  if (!Number.isFinite(num) || num <= 0) return 'never (0)'
  return new Date(num * 1000).toISOString()
}

function maskToken(token) {
  if (!token) return ''
  const value = String(token)
  if (value.length <= 16) return value
  return `${value.slice(0, 8)}...${value.slice(-8)}`
}

async function writeFacebookToEnvFile(input) {
  const envPath = path.resolve(process.cwd(), input.envFile)

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

  const entries = {
    NUXT_FACEBOOK_POST_ENABLED: 'true',
    NUXT_FACEBOOK_POST_API_VERSION: input.apiVersion,
    NUXT_FACEBOOK_POST_PAGE_ID: input.pageId,
    NUXT_FACEBOOK_POST_ACCESS_TOKEN: input.pageToken
  }

  const next = upsertEnvLines(current, entries)
  await fs.writeFile(envPath, next, 'utf8')
  console.log(`- wrote: ${envPath}`)
}

function upsertEnvLines(source, entries) {
  const lines = source ? source.split('\n') : []
  const seen = new Set()
  const output = []

  for (const line of lines) {
    let replaced = false
    for (const [key, value] of Object.entries(entries)) {
      if (line.startsWith(`${key}=`)) {
        output.push(`${key}=${value}`)
        seen.add(key)
        replaced = true
        break
      }
    }

    if (!replaced && line.length) output.push(line)
    if (!replaced && !line.length) output.push(line)
  }

  for (const [key, value] of Object.entries(entries)) {
    if (!seen.has(key)) output.push(`${key}=${value}`)
  }

  const joined = output.join('\n')
  return joined.endsWith('\n') ? joined : `${joined}\n`
}

async function createAppAccessToken(input) {
  const payload = await graphGet(`https://graph.facebook.com/${input.apiVersion}/oauth/access_token`, {
    client_id: input.appId,
    client_secret: input.appSecret,
    grant_type: 'client_credentials'
  })

  const accessToken = String(payload?.access_token || '')
  if (!accessToken) {
    throw new Error('Could not create app access token')
  }

  console.log('1) App access token: OK')
  console.log(`   token: ${maskToken(accessToken)}`)

  return accessToken
}

async function exchangeUserToken(input) {
  const payload = await graphGet(`https://graph.facebook.com/${input.apiVersion}/oauth/access_token`, {
    grant_type: 'fb_exchange_token',
    client_id: input.appId,
    client_secret: input.appSecret,
    fb_exchange_token: input.userToken
  })

  const accessToken = String(payload?.access_token || '')
  if (!accessToken) {
    throw new Error('Could not exchange short-lived user token')
  }

  console.log('2) Long-lived user token: OK')
  console.log(`   token: ${maskToken(accessToken)}`)
  if (payload?.expires_in) {
    const expiresAt = new Date(Date.now() + Number(payload.expires_in) * 1000)
    console.log(`   expires_at: ${expiresAt.toISOString()}`)
  }

  return accessToken
}

async function fetchPageToken(input) {
  const payload = await graphGet(`https://graph.facebook.com/${input.apiVersion}/${input.pageId}`, {
    fields: 'id,name,access_token',
    access_token: input.longUserToken
  })

  const pageToken = String(payload?.access_token || '')
  const pageName = String(payload?.name || '')
  const pageId = String(payload?.id || input.pageId)

  if (!pageToken) {
    throw new Error('Could not fetch page access token from page endpoint')
  }

  console.log('3) Page token: OK')
  console.log(`   page: ${pageName || pageId} (${pageId})`)
  console.log(`   token: ${maskToken(pageToken)}`)

  return { pageToken, pageName, pageId }
}

async function debugToken(input) {
  const payload = await graphGet(`https://graph.facebook.com/${input.apiVersion}/debug_token`, {
    input_token: input.pageToken,
    access_token: input.appAccessToken
  })

  const data = payload?.data || {}
  console.log('4) Debug token: OK')
  console.log(`   is_valid: ${Boolean(data?.is_valid)}`)
  console.log(`   type: ${String(data?.type || 'unknown')}`)
  console.log(`   profile_id: ${String(data?.profile_id || '')}`)
  console.log(`   expires_at: ${asIso(data?.expires_at)}`)
  console.log(`   scopes: ${Array.isArray(data?.scopes) ? data.scopes.join(', ') : ''}`)

  return data
}

async function verifyPageAccess(input) {
  const payload = await graphGet(`https://graph.facebook.com/${input.apiVersion}/${input.pageId}`, {
    fields: 'id,name',
    access_token: input.pageToken
  })

  console.log('5) Page access verification: OK')
  console.log(`   page: ${String(payload?.name || '')} (${String(payload?.id || input.pageId)})`)

  return payload
}

async function runFromUserToken(input) {
  const appAccessToken = await createAppAccessToken(input)
  const longUserToken = await exchangeUserToken(input)
  const { pageToken, pageName, pageId } = await fetchPageToken({
    apiVersion: input.apiVersion,
    pageId: input.pageId,
    longUserToken
  })

  const debug = await debugToken({
    apiVersion: input.apiVersion,
    pageToken,
    appAccessToken
  })

  await verifyPageAccess({
    apiVersion: input.apiVersion,
    pageId,
    pageToken
  })

  console.log('\nSuggested env values:')
  console.log(`NUXT_FACEBOOK_POST_ENABLED=true`)
  console.log(`NUXT_FACEBOOK_POST_API_VERSION=${input.apiVersion}`)
  console.log(`NUXT_FACEBOOK_POST_PAGE_ID=${pageId}`)
  console.log(`NUXT_FACEBOOK_POST_ACCESS_TOKEN=${pageToken}`)

  if (input.writeEnv) {
    console.log('\nWriting Facebook variables to env file...')
    await writeFacebookToEnvFile({
      envFile: input.envFile,
      apiVersion: input.apiVersion,
      pageId,
      pageToken
    })
  }

  if (!debug?.is_valid) {
    throw new Error('Page token is not valid according to debug_token response')
  }
}

async function runVerifyPageToken(input) {
  const appAccessToken = await createAppAccessToken(input)
  await debugToken({
    apiVersion: input.apiVersion,
    pageToken: input.pageToken,
    appAccessToken
  })
  await verifyPageAccess({
    apiVersion: input.apiVersion,
    pageId: input.pageId,
    pageToken: input.pageToken
  })
}

async function run() {
  const { command, flags } = parseArgs(process.argv)

  if (!command || ['-h', '--help', 'help'].includes(command)) {
    printUsage()
    return
  }

  const appId = String(flags['app-id'] || process.env.META_APP_ID || '')
  const appSecret = String(flags['app-secret'] || process.env.META_APP_SECRET || '')
  const apiVersion = String(flags['api-version'] || process.env.NUXT_FACEBOOK_POST_API_VERSION || 'v25.0')
  const pageId = String(flags['page-id'] || process.env.NUXT_FACEBOOK_POST_PAGE_ID || '')
  const envFile = String(flags['env-file'] || '.env')
  const writeEnv = Boolean(flags['write-env'])

  if (command === 'from-user-token') {
    await runFromUserToken({
      appId: requireValue(appId, '--app-id or META_APP_ID'),
      appSecret: requireValue(appSecret, '--app-secret or META_APP_SECRET'),
      apiVersion,
      pageId: requireValue(pageId, '--page-id or NUXT_FACEBOOK_POST_PAGE_ID'),
      userToken: requireValue(flags['user-token'], '--user-token'),
      writeEnv,
      envFile
    })
    return
  }

  if (command === 'verify-page-token') {
    await runVerifyPageToken({
      appId: requireValue(appId, '--app-id or META_APP_ID'),
      appSecret: requireValue(appSecret, '--app-secret or META_APP_SECRET'),
      apiVersion,
      pageId: requireValue(pageId, '--page-id or NUXT_FACEBOOK_POST_PAGE_ID'),
      pageToken: requireValue(flags['page-token'] || process.env.NUXT_FACEBOOK_POST_ACCESS_TOKEN, '--page-token or NUXT_FACEBOOK_POST_ACCESS_TOKEN')
    })
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

run().catch((error) => {
  console.error('\nError:', error?.message || error)
  process.exit(1)
})
