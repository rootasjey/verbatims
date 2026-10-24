import { db, schema } from 'hub:db'
import { inArray } from 'drizzle-orm'
import { chunkForD1Bindings } from '~~/server/utils/d1-parameter-batching'

export default defineEventHandler(async (event) => {
  try {
    const { user: sessionUser } = await requireAdmin(event)

    const body = await readBody(event)
    const ids = Array.from(new Set(
      (Array.isArray(body?.ids) ? body.ids : [])
        .map((value: unknown) => Number(value))
        .filter((value: number) => Number.isInteger(value) && value > 0)
    )) as number[]

    if (ids.length === 0) {
      throwServer(400, 'No valid user IDs provided')
    }
    if (ids.length > 200) {
      throwServer(400, 'Too many user IDs (max 200)')
    }

    const selectedUsers: Pick<typeof schema.users.$inferSelect, 'id' | 'name' | 'role'>[] = []
    for (const idBatch of chunkForD1Bindings(ids)) {
      selectedUsers.push(...await db.select({
        id: schema.users.id,
        name: schema.users.name,
        role: schema.users.role
      })
        .from(schema.users)
        .where(inArray(schema.users.id, idBatch)))
    }

    const foundIds = new Set(selectedUsers.map(user => user.id))
    const skippedSelf = selectedUsers.filter(selectedUser => selectedUser.id === sessionUser.id)
    const skippedAdmins = selectedUsers.filter(selectedUser => selectedUser.role === 'admin')
    const deletableUsers = selectedUsers.filter(selectedUser => selectedUser.id !== sessionUser.id && selectedUser.role !== 'admin')

    if (deletableUsers.length > 0) {
      for (const idBatch of chunkForD1Bindings(deletableUsers.map(selectedUser => selectedUser.id))) {
        await db.delete(schema.users).where(inArray(schema.users.id, idBatch))
      }
    }

    return {
      success: true,
      deletedCount: deletableUsers.length,
      deletedIds: deletableUsers.map(selectedUser => selectedUser.id),
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
