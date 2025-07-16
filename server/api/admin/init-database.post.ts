export default defineEventHandler(async (event) => {
  try {
    console.log('Manual database initialization started...')
    const success = await initializeDatabase()

    if (!success) {
      return {
        success: false,
        message: 'Failed to initialize database'
      }
    }

    console.log('Database initialized successfully')
    
    // Seed database if needed
    const seedSuccess = await seedDatabase()
    if (seedSuccess) {
      console.log('Database seeded successfully')
      return {
        success: true,
        message: 'Database initialized and seeded successfully'
      }
    }
    
    return {
      success: true,
      message: 'Database initialized successfully, seeding skipped (already has data)'
    }
  } catch (error: any) {
    console.error('Manual database initialization error:', error)
    return {
      success: false,
      message: 'Database initialization failed',
      error: error?.message || error
    }
  }
})
