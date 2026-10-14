import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = process.cwd()
const nuxtHub = resolve(root, 'node_modules/.bin/nuxt-hub')
const result = spawnSync(process.execPath, [nuxtHub, 'db', 'migrate'], {
  cwd: root,
  env: {
    ...process.env,
    NUXT_HUB_LOCAL_DB: '1',
    NITRO_PRESET: 'node-server',
  },
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
