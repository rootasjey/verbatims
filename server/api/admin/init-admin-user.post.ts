export default defineEventHandler(async (event) => {
  try {
    console.log('Manual admin user initialization started...')
    
    // Initialize admin user
    const adminInitialized = await initializeAdminUser()
    
    if (!adminInitialized) {
      return {
        success: false,
        message: 'Failed to initialize admin user'
      }
    }

    console.log('Admin user initialization completed successfully')
    
    return {
      success: true,
      message: 'Admin user initialized successfully'
    }
    
  } catch (error: any) {
    console.error('Admin user initialization error:', error)
    throwServer(500, error?.message || 'Failed to initialize admin user')
  }
})
