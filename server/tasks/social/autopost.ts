import { runSocialAutopost } from '../../utils/social-autopost'

export default defineTask({
  meta: {
    name: 'social:autopost',
    description: 'Publish one queued quote per active provider at 08:08 Europe/Paris'
  },
  async run() {
    return await runSocialAutopost()
  }
})
