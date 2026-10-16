import { replenishSocialQueues } from '../../utils/social-queue-replenish'

export default defineTask({
  meta: {
    name: 'social:replenish',
    description: 'Top up enabled social queues to 30 approved quotes when fewer than 10 remain'
  },
  async run() {
    return await replenishSocialQueues()
  }
})
