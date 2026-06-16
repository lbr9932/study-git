import ThemeToggle from "./modules/theme.js";
import SearchForm from "./modules/search.js";
import ShareButtons from "./modules/share.js";


document.addEventListener("DOMContentLoaded", () => {
	const themeToggle = new ThemeToggle();
	const searchForm = new SearchForm();
	const shareButtons = new ShareButtons();
	
	themeToggle.init();
	searchForm.init();
	shareButtons.init();
});