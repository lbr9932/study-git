const storageKey = "dev-notes-theme";

export function initThemeToggle() {
  const root = document.documentElement;
  const button = document.querySelector("[data-theme-toggle]");
  if (!button) return;

  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const saved = localStorage.getItem(storageKey);
  const nextTheme = saved ?? (systemDark.matches ? "dark" : "light");

  root.dataset.theme = nextTheme;
  button.setAttribute("aria-pressed", String(nextTheme === "dark"));

  button.addEventListener("click", () => {
    const current = root.dataset.theme === "dark" ? "dark" : "light";
    const updated = current === "dark" ? "light" : "dark";
    root.dataset.theme = updated;
    localStorage.setItem(storageKey, updated);
    button.setAttribute("aria-pressed", String(updated === "dark"));
  });
}
