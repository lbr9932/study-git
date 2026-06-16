export default class SearchForm {
  constructor() {
    this.form = document.querySelector(".search-form");
  }

  init() {
    if (!this.form) return;

    this.form.addEventListener("submit", (event) => this.handleSubmit(event));
  }

  handleSubmit(event) {
    event.preventDefault();
    const input = this.form.querySelector("input[type='search']");
    const query = input?.value.trim();
    if (!query) return;
    console.log(`Search requested: ${query}`);
  }
}
