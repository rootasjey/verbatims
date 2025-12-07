/**
 * Return an icon from a reference type.
  */
export const getReferenceIcon = (type: string) => {
  const icons: Record<string, string> = {
    book: 'i-ph-book',
    film: 'i-ph-film-strip',
    tv_series: 'i-ph-television',
    music: 'i-ph-music-note',
    speech: 'i-ph-microphone',
    podcast: 'i-ph-microphone-stage',
    interview: 'i-ph-chat-circle',
    documentary: 'i-ph-video-camera',
    media_stream: 'i-ph-play-circle',
    writings: 'i-ph-article',
    video_game: 'i-ph-game-controller',
    other: 'i-ph-file-text',
  }
  return icons[type] || 'i-ph-question'
}

/**
 * Convert an underscored reference type into a human-readable, title-cased string.
 *
 * Replaces all underscores with spaces and capitalizes the first letter of each word.
 *
 * @param type - The input reference type string (e.g. "user_profile").
 * @returns The formatted string with underscores replaced by spaces and each word capitalized (e.g. "User Profile").
 *
 * @example
 * // returns "Video Game"
 * formatReferenceType("video_game");
 *
 * @example
 * // returns "Tv Series"
 * formatReferenceType("tv_series");
 */
export const formatReferenceType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
