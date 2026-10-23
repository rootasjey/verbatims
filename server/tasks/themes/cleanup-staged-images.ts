import { cleanupAbandonedThemeImages } from '../../utils/theme-image-storage'

export default defineTask({
  meta: {
    name: 'themes:cleanup-staged-images',
    description: 'Delete abandoned theme image uploads after the staging retention period',
  },
  async run() {
    return await cleanupAbandonedThemeImages()
  },
})
