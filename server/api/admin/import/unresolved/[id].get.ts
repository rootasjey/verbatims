export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  if (user.role !== 'admin') throwServer(403, 'Admin access required')

  const id = event.context.params?.id
  if (!id) throwServer(400, 'Missing import id')

  const data = getUnresolved(id!)
  const filename = `unresolved-${id}.json`

  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename=${filename}`)
  return data
})
