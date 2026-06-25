import { db, schema } from 'hub:db'
import { inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throwServer(401, 'Authentication required')
    }

    if (session.user.role !== 'admin') {
      throwServer(403, 'Admin access required')
    }

    const body = await readBody(event)
    const ids = Array.from(new Set(
      (Array.isArray(body?.ids) ? body.ids : [])
        .map((value: unknown) => Number(value))
        .filter((value: number) => Number.isInteger(value) && value > 0)
    )) as number[]

    if (ids.length === 0) {
      throwServer(400, 'No valid user IDs provided')
    }

    const selectedUsers = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      role: schema.users.role
    })
      .from(schema.users)
      .where(inArray(schema.users.id, ids))

    const foundIds = new Set(selectedUsers.map(user => user.id))
    const skippedSelf = selectedUsers.filter(user => user.id === session.user!.id)
    const skippedAdmins = selectedUsers.filter(user => user.role === 'admin')
    const deletableUsers = selectedUsers.filter(user => user.id !== session.user!.id && user.role !== 'admin')

    if (deletableUsers.length > 0) {
      await db.delete(schema.users).where(inArray(schema.users.id, deletableUsers.map(user => user.id)))
    }

    return {
      success: true,
      deletedCount: deletableUsers.length,
      deletedIds: deletableUsers.map(user => user.id),
      skipped: {
        self: skippedSelf.length,
        admins: skippedAdmins.length,
        notFound: ids.filter(id => !foundIds.has(id)).length
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Admin bulk delete users error:', error)
    throwServer(500, 'Failed to bulk delete users')
  }
})