const LOCALE_KEY = 'blog-locale'
const DEFAULT_LOCALE = 'ko'

let currentLocale = localStorage.getItem(LOCALE_KEY) || DEFAULT_LOCALE
let translations = {}

async function loadLocale(locale) {
  const res = await fetch(`/locales/${locale}.json`)
  if (!res.ok) throw new Error(`Failed to load locale: ${locale}`)
  return res.json()
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    if (translations[key]) {
      el.textContent = translations[key]
    }
  })

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder')
    if (translations[key]) {
      el.setAttribute('placeholder', translations[key])
    }
  })

  document.documentElement.lang = currentLocale

  const btn = document.querySelector('.lang-btn')
  if (btn) {
    btn.textContent = currentLocale === 'ko' ? 'EN' : '한국어'
    btn.setAttribute('aria-label', currentLocale === 'ko' ? 'Switch to English' : '한국어로 전환')
  }
}

async function switchLocale(locale) {
  currentLocale = locale
  localStorage.setItem(LOCALE_KEY, locale)
  translations = await loadLocale(locale)
  applyTranslations()
}

async function initI18n() {
  try {
    translations = await loadLocale(currentLocale)
    applyTranslations()
  } catch {
    // Silently fall back to default Korean text already in HTML
  }

  const btn = document.querySelector('.lang-btn')
  if (btn) {
    btn.addEventListener('click', () => {
      const next = currentLocale === 'ko' ? 'en' : 'ko'
      switchLocale(next)
    })
  }
}

document.addEventListener('DOMContentLoaded', initI18n)
