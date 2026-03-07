import { runSocialAutopost } from '../../utils/social-autopost'

export default defineTask({
  meta: {
    name: 'social:autopost',
    description: 'Publish the next queued social post when the daily schedule matches'
  },
  async run() {
    return await runSocialAutopost()
  }
})