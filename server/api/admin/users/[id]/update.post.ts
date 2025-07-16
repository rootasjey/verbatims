export default defineEventHandler(async (event) => {
  try {
    // Check authentication and admin privileges
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    if (session.user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }
    
    const userId = getRouterParam(event, 'id')
    if (!userId || isNaN(parseInt(userId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user ID'
      })
    }
    
    const body = await readBody(event)
    const db = hubDatabase()
    
    // Check if user exists
    const user = await db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(userId).first()
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }
    
    // Prevent admin from modifying their own role or status
    if (parseInt(userId) === session.user.id) {
      if (body.role !== undefined && body.role !== user.role) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot modify your own role'
        })
      }
      
      if (body.is_active !== undefined && !body.is_active) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot deactivate your own account'
        })
      }
    }
    
    // Build update query
    const updates = []
    const bindings = []
    
    if (body.role !== undefined && ['user', 'moderator', 'admin'].includes(body.role)) {
      updates.push('role = ?')
      bindings.push(body.role)
    }
    
    if (body.is_active !== undefined) {
      updates.push('is_active = ?')
      bindings.push(body.is_active ? 1 : 0)
    }
    
    if (body.email_verified !== undefined) {
      updates.push('email_verified = ?')
      bindings.push(body.email_verified ? 1 : 0)
    }
    
    if (updates.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid fields to update'
      })
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP')
    bindings.push(userId)
    
    // Update user
    await db.prepare(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run()
    
    // Get updated user with statistics
    const updatedUser = await db.prepare(`
      SELECT 
        u.*,
        COUNT(DISTINCT q.id) as quote_count,
        COUNT(DISTINCT CASE WHEN q.status = 'approved' THEN q.id END) as approved_quotes,
        COUNT(DISTINCT uc.id) as collection_count,
        COUNT(DISTINCT ul.id) as likes_given,
        SUM(q.likes_count) as total_likes_received
      FROM users u
      LEFT JOIN quotes q ON u.id = q.user_id
      LEFT JOIN user_collections uc ON u.id = uc.user_id
      LEFT JOIN user_likes ul ON u.id = ul.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `).bind(userId).first()
    
    return {
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('User update error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user'
    })
  }
})
