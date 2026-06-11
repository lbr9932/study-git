document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger-btn')
  const nav = document.querySelector('.site-nav')

  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open')
      hamburger.setAttribute('aria-expanded', String(isOpen))
    })
  }

  // Mark active nav link
  const currentPath = location.pathname
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href')
    if (href === '/' ? currentPath === '/' : currentPath.startsWith(href)) {
      link.classList.add('active')
      link.setAttribute('aria-current', 'page')
    }
  })
})
