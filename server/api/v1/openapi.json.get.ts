export default defineEventHandler(async (event) => {
  const { origin } = getRequestURL(event)
  const spec = await $fetch(`${origin}/_openapi.json`)
  spec.paths = Object.fromEntries(
    Object.entries(spec.paths).filter(([path]) => path.startsWith('/api/v1/'))
  )
  return spec
})
