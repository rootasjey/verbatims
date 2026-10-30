import { runSocialThemeAutopost } from '../../utils/social-autopost'

export default defineTask({
  meta: {
    name: 'social:autopost-themes',
    description: 'Publish queued theme launch announcements at 16:08 Europe/Paris'
  },
  async run() {
    return runSocialThemeAutopost()
  }
})
