import { replenishSocialSpotlightQueues } from '../../utils/social-spotlight-replenish'

export default defineTask({
  meta: {
    name: 'social:replenish-spotlights',
    description: 'Queue three rights-documented author portraits or works for weekday afternoon posts'
  },
  async run() {
    return replenishSocialSpotlightQueues()
  }
})
