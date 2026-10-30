import { runSocialSpotlightAutopost } from '../../utils/social-autopost'

export default defineTask({
  meta: {
    name: 'social:autopost-spotlights',
    description: 'Publish due weekly portrait and work spotlights at 16:08 Europe/Paris'
  },
  async run() {
    return runSocialSpotlightAutopost()
  }
})
