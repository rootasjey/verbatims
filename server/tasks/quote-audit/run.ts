import { getQuoteAuditConfig } from '../../utils/quote-audit/config'
import { getQuoteAuditPilotStatus, runQuoteAuditBatch } from '../../utils/quote-audit/runner'
import { getQuoteAuditOAuthStatus } from '../../utils/quote-audit/oauth'

function isScheduledParisRun(cadence: 'weekdays' | 'weekly') {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const weekday = values.weekday || ''
  const dayMatches = cadence === 'weekly'
    ? weekday === 'Mon'
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday)

  return dayMatches && values.hour === '09'
}

export default defineTask({
  meta: {
    name: 'quote-audit:run',
    description: 'Audit up to 20 oldest approved quotes without an audit review, then leave findings for a moderator.'
  },
  async run() {
    const config = await getQuoteAuditConfig()
    if (config.mode === 'paused') {
      return { success: true, skipped: true, reason: 'quote audit is paused in admin settings' }
    }

    const oauth = await getQuoteAuditOAuthStatus()
    if (!oauth.connected || oauth.needsReconnect) {
      return { success: true, skipped: true, reason: 'the quote audit requires a connected ChatGPT OAuth session' }
    }
    if (!oauth.modelAvailable) {
      return { success: true, skipped: true, reason: `the connected ChatGPT account does not offer ${oauth.model}` }
    }

    if (!isScheduledParisRun(config.cadence)) {
      return { success: true, skipped: true, reason: `outside the configured ${config.cadence} schedule at 09:00 Europe/Paris` }
    }

    const pilot = await getQuoteAuditPilotStatus()
    if (config.mode === 'pilot' && pilot.count < 20) {
      return await runQuoteAuditBatch(20 - pilot.count, true)
    }

    if (config.mode === 'pilot') {
      return {
        success: true,
        skipped: true,
        pilotComplete: true,
        pilotIds: pilot.ids,
        pilotReviewedCount: pilot.reviewedCount,
        reason: 'the 20-quote pilot is complete and awaits quality review before corpus processing',
      }
    }

    if (pilot.count < 20 || pilot.reviewedCount < 20) {
      return {
        success: true,
        skipped: true,
        pilotIds: pilot.ids,
        pilotReviewedCount: pilot.reviewedCount,
        reason: 'the 20-quote pilot must be completed and reviewed before corpus processing',
      }
    }

    return await runQuoteAuditBatch(20, false)
  }
})
