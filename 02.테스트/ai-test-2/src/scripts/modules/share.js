export default class ShareButtons {
  constructor() {
    this.buttons = document.querySelectorAll("[data-share]");
  }

  init() {
    if (!this.buttons.length) return;

    this.buttons.forEach((button) => {
      button.addEventListener("click", () => this.share(button));
    });
  }

  async share(button) {
    const url = button.getAttribute("data-share-url") || window.location.href;
    const title = button.getAttribute("data-share-title") || document.title;

    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    button.textContent = "Link copied";
  }
}
