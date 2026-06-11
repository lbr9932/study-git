export function initShareButtons() {
  const buttons = document.querySelectorAll("[data-share]");
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const url = button.getAttribute("data-share-url") || window.location.href;
      const title = button.getAttribute("data-share-title") || document.title;

      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      button.textContent = "Link copied";
    });
  });
}
