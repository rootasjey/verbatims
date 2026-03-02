import { defineTask } from 'nitropack/runtime/task'
import { runSocialAutopost } from '../../server/utils/social-autopost'

export default defineTask({
  meta: {
    name: 'social:autopost',
    description: 'Publish one queued quote to enabled social providers at configured daily local time'
  },
  async run() {
    const result = await runSocialAutopost()
    return { result }
  }
})
