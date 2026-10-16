import { reconcileStaleSocialQueue } from '../../utils/social-autopost'

export default defineTask({
  meta: {
    name: 'social:reconcile',
    description: 'Silently reconcile stale social queue items with saved post records and recent Threads posts'
  },
  async run() {
    return await reconcileStaleSocialQueue()
  }
})
