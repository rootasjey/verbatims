import { runSocialAutopost } from '../../utils/social-autopost'

export default defineTask({
  meta: {
    name: 'social:autopost',
    description: 'Publish one queued social post per active provider when the daily schedule matches'
  },
  async run() {
    return await runSocialAutopost()
  }
})