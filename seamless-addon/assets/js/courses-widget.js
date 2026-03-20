/**
 * Seamless Courses List Widget Handler
 */

(function ($) {
  "use strict";

  /**
   * Format duration in minutes to readable text
   */
  function formatDuration(minutes) {
    if (!minutes) return "Self-paced";

    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? "Minute" : "Minutes"}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? "Hour" : "Hours"}`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Format date to readable format
   */
  function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  /**
   * Render course card
   */
  function renderCourseCard(course) {
    const title = course.title || "Untitled Course";
    const slug = course.slug || "";
    const description = course.short_description || course.description || "";
    const price = course.price
      ? `$${parseFloat(course.price).toFixed(2)}`
      : "Free";
    const accessType = course.access_type?.label || "Free";
    const accessValue = course.access_type?.value || "free";
    const duration = course.duration_minutes || 0;
    const lessonsCount = course.lessons?.length || 0;
    const publishedDate = course.published_at
      ? formatDate(course.published_at)
      : "";
    const imageUrl = course.image || "";

    // Get client domain from window.seamless_ajax
    const clientDomain = (window.seamless_ajax?.api_domain || "").replace(
      /\/+$/,
      "",
    );
    const courseUrl = clientDomain
      ? `${clientDomain}/courses/${slug}`
      : `/courses/${slug}`;

    // Determine badge color class based on access type
    const badgeColorClass =
      accessValue === "paid" ? "seamless-badge-paid" : "seamless-badge-free";

    // Strip HTML tags from description
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = description;
    const plainDescription = tempDiv.textContent || tempDiv.innerText || "";

    return `
      <div class="seamless-course-card">
        <div class="seamless-course-image-wrapper">
          ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="seamless-course-image" />` : ""}
          ${
            !imageUrl
              ? `
          <div class="seamless-course-icon">
           <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="60" height="60">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253">
                </path>
            </svg>
          </div>
          `
              : ""
          }
          <div class="seamless-course-badge ${badgeColorClass}">${accessType}</div>
        </div>
        <div class="seamless-course-content">
          <h3 class="seamless-course-title">
            <a href="${courseUrl}">${title}</a>
          </h3>
          ${plainDescription ? `<p class="seamless-course-excerpt">${plainDescription}</p>` : ""}
          <div class="seamless-course-meta-row">
            ${
              publishedDate
                ? `
              <div class="seamless-course-meta">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>${publishedDate}</span>
              </div>
            `
                : ""
            }
            <div class="seamless-course-meta">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-clock"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${formatDuration(duration)}</span>
            </div>
            ${
              lessonsCount > 0
                ? `
              <div class="seamless-course-meta">
                <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253">
                    </path>
                </svg>
                <span>${lessonsCount} ${lessonsCount === 1 ? "Lesson" : "Lessons"}</span>
              </div>
            `
                : ""
            }
          </div>
          <div class="seamless-course-footer">
            <div class="seamless-course-price">${price}</div>
            <a href="${courseUrl}" class="seamless-course-button">
              View Details
              <i class="fas fa-chevron-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render loader
   */
  function renderLoader() {
    return `
      <div class="seamless-loader">
        <div class="seamless-spinners"></div>
        <p>Loading courses...</p>
      </div>
    `;
  }

  /**
   * Render error message
   */
  function renderError(message) {
    return `
      <div class="seamless-error">
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Render no courses message
   */
  function renderNoCourses() {
    return `
      <div class="seamless-no-courses">
        <p>No courses available at the moment.</p>
      </div>
    `;
  }

  /**
   * Initialize Courses List Widget
   */
  function initCoursesListWidget($wrapper) {
    const columns = $wrapper.data("columns") || 3;

    // Create grid container
    const $grid = $("<div>", {
      class: "seamless-courses-grid",
    });

    // Add loader
    $grid.html(renderLoader());
    $wrapper.html($grid);

    // Check if API is available
    if (typeof window.SeamlessAPI === "undefined") {
      console.error(
        "[Seamless Courses] SeamlessAPI not found. Make sure seamless-api-client.js is loaded.",
      );
      $grid.html(
        renderError("API client not available. Please contact support."),
      );
      return;
    }

    // Fetch courses from API
    window.SeamlessAPI.getAllCourses()
      .then((courses) => {
        if (!courses || courses.length === 0) {
          $grid.html(renderNoCourses());
          return;
        }

        // Filter published courses
        const publishedCourses = courses.filter((course) => {
          const status = (course.status || "").toLowerCase();
          return status === "published";
        });

        if (publishedCourses.length === 0) {
          $grid.html(renderNoCourses());
          return;
        }

        // Render course cards
        const cardsHtml = publishedCourses
          .map((course) => renderCourseCard(course))
          .join("");

        $grid.html(cardsHtml);
      })
      .catch((error) => {
        console.error("[Seamless Courses] Error fetching courses:", error);
        $grid.html(
          renderError("Failed to load courses. Please try again later."),
        );
      });
  }

  /**
   * Initialize on page load
   */
  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/seamless-courses-list.default",
      function ($scope) {
        const $wrapper = $scope.find(".seamless-courses-list-wrapper");
        if ($wrapper.length) {
          initCoursesListWidget($wrapper);
        }
      },
    );
  });

  /**
   * Fallback for non-Elementor contexts
   */
  $(document).ready(function () {
    $(".seamless-courses-list-wrapper").each(function () {
      initCoursesListWidget($(this));
    });
  });
})(jQuery);
