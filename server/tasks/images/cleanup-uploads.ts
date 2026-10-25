import { cleanupAbandonedImageUploads } from '../../utils/image-storage'

export default defineTask({
  meta: {
    name: 'images:cleanup-uploads',
    description: 'Report image uploads that are unreferenced and older than 90 days',
  },
  async run() {
    const result = await cleanupAbandonedImageUploads({ dryRun: true })
    console.info('[images:cleanup-uploads]', result)
    return result
  },
})
