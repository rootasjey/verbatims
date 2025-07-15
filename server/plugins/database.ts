export default defineNitroPlugin(async (nitroApp) => {
  // Initialize database on startup
  console.log('Initializing database...')
  
  try {
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
  } catch (error) {
    console.error('Database initialization error:', error)
  }
})
