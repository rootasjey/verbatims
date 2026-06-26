export default defineEventHandler(async (event) => {
  try {
    const { user } = await getUserSession(event)
    if (!user) throwServer(401, 'Authentication required')
    if (user.role !== 'admin') {
      throwServer(403, 'Admin access required')
    }

    console.log('Manual database initialization started...')
    const success = await initializeDatabase()

    if (!success) {
      return {
        success: false,
        message: 'Failed to initialize database'
      }
    }

    console.log('Database initialized successfully')

    // Initialize admin user
    console.log('Initializing admin user...')
    const adminInitialized = await initializeAdminUser()
    if (!adminInitialized) {
      return {
        success: false,
        message: 'Database initialized but failed to initialize admin user'
      }
    }
    console.log('Admin user initialization completed')

    // Seed database if needed
    const seedSuccess = await seedDatabase()
    if (seedSuccess) {
      console.log('Database seeded successfully')
      return {
        success: true,
        message: 'Database initialized, admin user created, and seeded successfully'
      }
    }

    return {
      success: true,
      message: 'Database initialized and admin user created successfully, seeding skipped (already has data)'
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Manual database initialization error:', error)
    throwServer(500, 'Failed to initialize database')
  }
})
