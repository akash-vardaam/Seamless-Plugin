(function () {
  "use strict";

  /**
   * Initialize accordion functionality
   */
  function initAccordion() {
    const accordionHeaders = document.querySelectorAll(".accordion-header");

    accordionHeaders.forEach((header) => {
      // Remove any existing listeners by cloning
      const newHeader = header.cloneNode(true);
      header.parentNode.replaceChild(newHeader, header);

      // Add click event
      newHeader.addEventListener("click", function (e) {
        e.preventDefault();

        const item = this.closest(".accordion-item");
        if (!item) {
          return;
        }

        const isActive = item.classList.contains("active");

        if (!isActive) {
          // Close any other open accordion items on the page
          const openItems = document.querySelectorAll(".accordion-item.active");
          openItems.forEach((openItem) => {
            if (openItem !== item) {
              openItem.classList.remove("active");
            }
          });

          // Toggle current item
          item.classList.add("active");

          // Scroll to the newly opened accordion after a short delay to allow animation
          setTimeout(() => {
            const headerOffset = 100; // Offset from top of viewport
            const elementPosition = item.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }, 100);
        } else {
          // Just close if already active
          item.classList.remove("active");
        }
      });
    });
  }

  /**
   * Initialize when DOM is ready
   */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAccordion);
  } else {
    initAccordion();
  }

  /**
   * Re-initialize for Elementor preview
   */
  jQuery(window).on("elementor/frontend/init", function () {
    if (typeof elementorFrontend !== "undefined" && elementorFrontend.hooks) {
      elementorFrontend.hooks.addAction(
        "frontend/element_ready/widget",
        function ($scope) {
          initAccordion();
        },
      );
    }
  });
})();
