import { replenishSocialQueues } from '../../utils/social-queue-replenish'

function isScheduledParisReplenishmentRun() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const hour = parts.find(part => part.type === 'hour')?.value

  return hour === '08'
}

export default defineTask({
  meta: {
    name: 'social:replenish',
    description: 'Top up enabled social queues to 30 approved quotes when fewer than 10 remain'
  },
  async run() {
    if (!isScheduledParisReplenishmentRun()) {
      return {
        success: true,
        skipped: true,
        reason: 'outside the 08:00 Europe/Paris schedule',
      }
    }

    return await replenishSocialQueues()
  }
})
