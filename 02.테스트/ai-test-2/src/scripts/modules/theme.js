const storageKey = "dev-notes-theme";

export default class ThemeToggle {
  constructor() {
    this.root = document.documentElement;
    this.button = document.querySelector("[data-theme-toggle]");
    this.systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  }

  init() {
    if (!this.button) return;

    const saved = localStorage.getItem(storageKey);
    const nextTheme = saved ?? (this.systemDark.matches ? "dark" : "light");

    this.setTheme(nextTheme);
    this.button.addEventListener("click", () => this.toggle());
  }

  toggle() {
    const current = this.root.dataset.theme === "dark" ? "dark" : "light";
    const updated = current === "dark" ? "light" : "dark";
    this.setTheme(updated);
    localStorage.setItem(storageKey, updated);
  }

  setTheme(theme) {
    this.root.dataset.theme = theme;
    this.button.setAttribute("aria-pressed", String(theme === "dark"));
  }
}
