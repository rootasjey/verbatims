const languageImages: Record<string, string> = {
  en: '/images/languages/english-shield.png',
  fr: '/images/languages/french-love.png',
  la: '/images/languages/latin-emperor.png',
}

export function getLanguageImage(language: string): string | undefined {
  return languageImages[language]
}
