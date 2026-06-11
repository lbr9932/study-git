export function initSearch() {
  const form = document.querySelector(".search-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = form.querySelector("input[type='search']");
    const query = input?.value.trim();
    if (!query) return;
    console.log(`Search requested: ${query}`);
  });
}
