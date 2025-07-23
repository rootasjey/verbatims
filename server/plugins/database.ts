export default defineNitroPlugin(async (nitroApp) => {
  // Initialize database on startup
  console.log('(database plugin) • Initializing database...')

  try {
    // Check if database is available
    const db = hubDatabase()
    if (!db) {
      console.log('Database not available in current environment, skipping initialization')
      return
    }

    const success = await initializeDatabase()
    if (success) {
      console.log('Database initialized successfully')

      // Initialize admin user on first startup
      console.log('Initializing admin user...')
      const adminInitialized = await initializeAdminUser()
      if (adminInitialized) {
        console.log('Admin user initialization completed')
      } else {
        console.error('Failed to initialize admin user')
      }

      // Seed database if needed
      const seedSuccess = await seedDatabase()
      if (seedSuccess) {
        console.log('Database seeded successfully')
      }
    } else {
      console.error('Failed to initialize database')
    }
  } catch (error: any) {
    console.error('Database initialization error:', error)
    console.error('Error details:', error?.message || error)
  }
})
