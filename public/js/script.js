document.addEventListener("DOMContentLoaded", function () {
	const toggles = document.querySelectorAll(".accordion-toggle");

	toggles.forEach((toggle) => {
		toggle.addEventListener("click", () => {
			const content = toggle.nextElementSibling;
			const icon = toggle.querySelector(".accordion-icon");

			const isOpen = !content.classList.contains("hidden");
			document.querySelectorAll(".accordion-content").forEach((el) => el.classList.add("hidden"));
			document.querySelectorAll(".accordion-icon").forEach((el) => el.textContent = "+");

			if (!isOpen) {
				content.classList.remove("hidden");
				icon.textContent = "−";
			}
		});
	});
});
