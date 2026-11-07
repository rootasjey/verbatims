/** Convert MM:SS or HH:MM:SS input to a canonical HH:MM:SS timecode. */
export function normalizeTimecode(value: string): string | null {
  const input = value.trim()
  const shortForm = /^(\d+):(\d{1,2})$/.exec(input)

  if (shortForm) {
    const totalMinutes = Number(shortForm[1])
    const seconds = Number(shortForm[2])
    if (!Number.isSafeInteger(totalMinutes) || seconds > 59) return null

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const fullForm = /^(\d+):(\d{1,2}):(\d{1,2})$/.exec(input)
  if (!fullForm) return null

  const hours = Number(fullForm[1])
  const minutes = Number(fullForm[2])
  const seconds = Number(fullForm[3])
  if (!Number.isSafeInteger(hours) || minutes > 59 || seconds > 59) return null

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
