export default defineNitroPlugin(async (nitroApp) => {
  // Initialize database on startup
  console.log('Initializing database...')
  return

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

      // Seed database if needed
      const seedSuccess = await seedDatabase()
      if (seedSuccess) {
        console.log('Database seeded successfully')
      }
    } else {
      console.error('Failed to initialize database')
    }
  } catch (error: any) {
    if (error.message?.includes('Missing Cloudflare DB binding')) {
      console.log('Database not available in development mode, skipping initialization')
      return
    }
    console.error('Database initialization error:', error)
  }
})
