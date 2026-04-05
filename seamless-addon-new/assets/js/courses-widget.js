/**
 * Seamless Courses List Widget Handler
 */

(function ($) {
  "use strict";

  const DEFAULT_FILTERS = {
    search: "",
    access: "all",
    year: "all",
    sort: "newest",
  };

  const ACCESS_OPTIONS = [
    { value: "all", label: "All Courses" },
    { value: "free", label: "Free" },
    { value: "paid", label: "Paid" },
  ];

  const SORT_OPTIONS = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "title_az", label: "Title (A-Z)" },
    { value: "title_za", label: "Title (Z-A)" },
  ];

  const MENU_CHECK_SVG =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  let widgetInstanceCounter = 0;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function getPlainText(html) {
    if (!html) {
      return "";
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = String(html);
    return (tempDiv.textContent || tempDiv.innerText || "").trim();
  }

  function formatDuration(minutes) {
    if (!minutes) {
      return "Self-paced";
    }

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

  function getTimestamp(dateString) {
    if (!dateString) {
      return null;
    }

    const timestamp = new Date(dateString).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  function formatDate(dateString) {
    const timestamp = getTimestamp(dateString);

    if (timestamp === null) {
      return "";
    }

    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getCourseYear(course) {
    const timestamp = getTimestamp(course?.published_at);

    if (timestamp === null) {
      return "";
    }

    return String(new Date(timestamp).getFullYear());
  }

  function getCourseAccessMeta(course) {
    const accessValue = String(course?.access_type?.value || "").toLowerCase();
    const numericPrice = parseFloat(course?.price);
    const isPaid =
      accessValue === "paid" ||
      (!Number.isNaN(numericPrice) && Number(numericPrice) > 0);

    return {
      value: isPaid ? "paid" : "free",
      label:
        course?.access_type?.label || (isPaid ? "Paid" : "Free"),
    };
  }

  function getCoursePrice(course) {
    const numericPrice = parseFloat(course?.price);

    if (!Number.isNaN(numericPrice) && numericPrice > 0) {
      return `$${numericPrice.toFixed(2)}`;
    }

    return "Free";
  }

  function getLessonsCount(course) {
    if (Array.isArray(course?.lessons)) {
      return course.lessons.length;
    }

    if (typeof course?.lessons_count === "number") {
      return course.lessons_count;
    }

    return 0;
  }

  function getClientDomain() {
    if (window.SeamlessAPI && window.SeamlessAPI.apiDomain) {
      return String(window.SeamlessAPI.apiDomain).replace(/\/+$/, "");
    }

    if (window.seamless_ajax?.api_domain) {
      return String(window.seamless_ajax.api_domain).replace(/\/+$/, "");
    }

    return "";
  }

  function getCourseUrl(course) {
    const slug = String(course?.slug || "").trim();
    const encodedSlug = encodeURIComponent(slug);
    const clientDomain = getClientDomain();

    if (clientDomain && encodedSlug) {
      return `${clientDomain}/courses/${encodedSlug}`;
    }

    if (encodedSlug) {
      return `/courses/${encodedSlug}`;
    }

    return "#";
  }

  function renderCourseCard(course) {
    const title = escapeHtml(course?.title || "Untitled Course");
    const description = getPlainText(
      course?.short_description || course?.description || "",
    );
    const safeDescription = escapeHtml(description);
    const courseUrl = escapeAttr(getCourseUrl(course));
    const imageUrl = String(course?.image || "").trim();
    const safeImageUrl = escapeAttr(imageUrl);
    const publishedDate = formatDate(course?.published_at);
    const accessMeta = getCourseAccessMeta(course);
    const badgeColorClass =
      accessMeta.value === "paid" ? "seamless-badge-paid" : "seamless-badge-free";
    const lessonsCount = getLessonsCount(course);

    return `
      <div class="seamless-course-card">
        <div class="seamless-course-image-wrapper">
          ${imageUrl ? `<img src="${safeImageUrl}" alt="${title}" class="seamless-course-image" />` : ""}
          ${
            !imageUrl
              ? `
          <div class="seamless-course-icon">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="60" height="60" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          `
              : ""
          }
          <div class="seamless-course-badge ${badgeColorClass}">${escapeHtml(accessMeta.label)}</div>
        </div>
        <div class="seamless-course-content">
          <h3 class="seamless-course-title">
            <a href="${courseUrl}">${title}</a>
          </h3>
          ${safeDescription ? `<p class="seamless-course-excerpt">${safeDescription}</p>` : ""}
          <div class="seamless-course-meta-row">
            ${
              publishedDate
                ? `
              <div class="seamless-course-meta">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>${escapeHtml(publishedDate)}</span>
              </div>
            `
                : ""
            }
            <div class="seamless-course-meta">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-clock" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${escapeHtml(formatDuration(course?.duration_minutes || 0))}</span>
            </div>
            ${
              lessonsCount > 0
                ? `
              <div class="seamless-course-meta">
                <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                <span>${lessonsCount} ${lessonsCount === 1 ? "Lesson" : "Lessons"}</span>
              </div>
            `
                : ""
            }
          </div>
          <div class="seamless-course-footer">
            <div class="seamless-course-price">${escapeHtml(getCoursePrice(course))}</div>
            <a href="${courseUrl}" class="seamless-course-button">
              View Details
              <i class="fas fa-chevron-right" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function renderLoader() {
    const lid = Math.random().toString(36).slice(2, 8);

    return `
      <div class="seamless-loader">
        <div class="seamless-plugin-loader">
          <svg xmlns="http://www.w3.org/2000/svg" class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true">
            <defs>
              <linearGradient id="swg1-${lid}" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"></stop><stop offset=".2" stop-color="#2ac9e4"></stop><stop offset=".4" stop-color="#6383ed"></stop><stop offset=".6" stop-color="#904bf5"></stop><stop offset=".8" stop-color="#b022fa"></stop><stop offset=".9" stop-color="#c40afd"></stop><stop offset="1" stop-color="#cc01ff"></stop></linearGradient>
              <linearGradient id="swg2-${lid}" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"></stop><stop offset=".2" stop-color="#2ac9e4"></stop><stop offset=".4" stop-color="#6383ed"></stop><stop offset=".6" stop-color="#904bf5"></stop><stop offset=".8" stop-color="#b022fa"></stop><stop offset=".9" stop-color="#c40afd"></stop><stop offset="1" stop-color="#cc01ff"></stop></linearGradient>
              <linearGradient id="swg3-${lid}" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"></stop><stop offset=".2" stop-color="#2ac9e4"></stop><stop offset=".4" stop-color="#6383ed"></stop><stop offset=".6" stop-color="#904bf5"></stop><stop offset=".8" stop-color="#b022fa"></stop><stop offset=".9" stop-color="#c40afd"></stop><stop offset="1" stop-color="#cc01ff"></stop></linearGradient>
            </defs>
            <g class="sl-ring-outer"><path fill="url(#swg2-${lid})" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z"></path></g>
            <g class="sl-ring-mid"><path fill="url(#swg3-${lid})" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z"></path></g>
            <g class="sl-ring-inner"><path fill="url(#swg1-${lid})" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z"></path></g>
          </svg>
        </div>
        <p>Loading courses...</p>
      </div>
    `;
  }

  function renderError(message) {
    return `
      <div class="seamless-error">
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  function renderNoCourses(message) {
    return `
      <div class="seamless-no-courses">
        <p>${escapeHtml(message || "No courses available at the moment.")}</p>
      </div>
    `;
  }

  function getActiveFilterCount(filters) {
    let count = 0;

    if (filters.search.trim()) {
      count += 1;
    }

    if (filters.access !== "all") {
      count += 1;
    }

    if (filters.year !== "all") {
      count += 1;
    }

    return count;
  }

  function buildYearOptions(courses) {
    const years = Array.from(
      new Set(
        courses
          .map((course) => getCourseYear(course))
          .filter(Boolean),
      ),
    ).sort((left, right) => Number(right) - Number(left));

    return [
      { value: "all", label: "All Years" },
      ...years.map((year) => ({ value: year, label: year })),
    ];
  }

  function getOptionLabel(options, value, fallback) {
    const selectedOption = options.find((option) => option.value === value);
    return selectedOption ? selectedOption.label : fallback;
  }

  function renderMenuItems(options, selectedValue) {
    return options
      .map((option) => {
        const isSelected = option.value === selectedValue;
        return `
          <li role="option" data-value="${escapeAttr(option.value)}" class="${isSelected ? "seamless-nd-menu-selected" : ""}" aria-selected="${isSelected ? "true" : "false"}">
            ${escapeHtml(option.label)}
            ${isSelected ? MENU_CHECK_SVG : ""}
          </li>
        `;
      })
      .join("");
  }

  function renderSearchBar(
    filters,
    yearOptions,
    totalCourses,
    shownCourses,
    instanceId,
  ) {
    const accessLabel = getOptionLabel(
      ACCESS_OPTIONS,
      filters.access,
      "All Courses",
    );
    const yearLabel = getOptionLabel(yearOptions, filters.year, "All Years");
    const sortLabel = getOptionLabel(
      SORT_OPTIONS,
      filters.sort,
      "Newest First",
    );
    const activeFilterCount = getActiveFilterCount(filters);
    const accessMenuId = `seamless-course-access-menu-${instanceId}`;
    const yearMenuId = `seamless-course-year-menu-${instanceId}`;
    const sortMenuId = `seamless-course-sort-menu-${instanceId}`;

    return `
      <section class="seamless-nd-searchbar-section">
        <div class="seamless-nd-searchbar-wrap">
          <div class="seamless-nd-row">
            <div class="seamless-nd-search-field">
              <svg class="seamless-nd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                class="seamless-nd-search-input"
                data-role="course-search"
                value="${escapeAttr(filters.search)}"
                placeholder="Search courses..."
                autocomplete="off"
                aria-label="Search courses" />
            </div>

            <div class="seamless-nd-controls">
              <div class="seamless-nd-dropdown-wrap" data-menu-wrap="access">
                <button
                  type="button"
                  class="seamless-nd-btn seamless-nd-course-type-btn ${filters.access !== "all" ? "seamless-nd-active-filter" : ""}"
                  data-toggle-menu="access"
                  aria-expanded="false"
                  aria-controls="${accessMenuId}">
                  <span class="seamless-nd-course-type-label">${escapeHtml(accessLabel)}</span>
                  <svg class="seamless-nd-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <ul class="seamless-nd-menu" data-menu="access" id="${accessMenuId}" role="listbox" aria-label="Course access filter">
                  ${renderMenuItems(ACCESS_OPTIONS, filters.access)}
                </ul>
              </div>

              <div class="seamless-nd-dropdown-wrap" data-menu-wrap="year">
                <button
                  type="button"
                  class="seamless-nd-btn seamless-nd-year-btn ${filters.year !== "all" ? "seamless-nd-active-filter" : ""}"
                  data-toggle-menu="year"
                  aria-expanded="false"
                  aria-controls="${yearMenuId}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span class="seamless-nd-year-label">${escapeHtml(yearLabel)}</span>
                  <svg class="seamless-nd-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <ul class="seamless-nd-menu" data-menu="year" id="${yearMenuId}" role="listbox" aria-label="Course year filter">
                  ${renderMenuItems(yearOptions, filters.year)}
                </ul>
              </div>

              <div class="seamless-nd-dropdown-wrap" data-menu-wrap="sort">
                <button
                  type="button"
                  class="seamless-nd-btn seamless-nd-sort-btn seamless-nd-active-filter"
                  data-toggle-menu="sort"
                  aria-expanded="false"
                  aria-controls="${sortMenuId}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                  <span class="seamless-nd-sort-label">${escapeHtml(sortLabel)}</span>
                  <svg class="seamless-nd-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <ul class="seamless-nd-menu" data-menu="sort" id="${sortMenuId}" role="listbox" aria-label="Sort courses">
                  ${renderMenuItems(SORT_OPTIONS, filters.sort)}
                </ul>
              </div>

              <button
                type="button"
                class="seamless-nd-btn seamless-nd-reset-btn"
                data-role="reset-filters"
                aria-label="Reset all course filters">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 -0.51-5"></path>
                </svg>
                <span>Reset</span>
                <span class="seamless-nd-reset-badge" style="display:${activeFilterCount > 0 ? "inline-flex" : "none"};">${activeFilterCount}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      <p class="seamless-course-results-summary">Showing ${shownCourses} of ${totalCourses} courses</p>
    `;
  }

  function getFilteredCourses(courses, filters) {
    const searchTerm = filters.search.trim().toLowerCase();
    const filteredCourses = courses.filter((course) => {
      const accessMeta = getCourseAccessMeta(course);
      const courseYear = getCourseYear(course);
      const plainText = getPlainText(
        course?.short_description || course?.description || "",
      ).toLowerCase();
      const title = String(course?.title || "").toLowerCase();

      if (
        searchTerm &&
        !title.includes(searchTerm) &&
        !plainText.includes(searchTerm)
      ) {
        return false;
      }

      if (filters.access !== "all" && accessMeta.value !== filters.access) {
        return false;
      }

      if (filters.year !== "all" && courseYear !== filters.year) {
        return false;
      }

      return true;
    });

    return filteredCourses.sort((left, right) => {
      if (filters.sort === "title_az") {
        return String(left?.title || "").localeCompare(String(right?.title || ""));
      }

      if (filters.sort === "title_za") {
        return String(right?.title || "").localeCompare(String(left?.title || ""));
      }

      const leftTimestamp = getTimestamp(left?.published_at);
      const rightTimestamp = getTimestamp(right?.published_at);

      if (leftTimestamp === null && rightTimestamp === null) {
        return String(left?.title || "").localeCompare(String(right?.title || ""));
      }

      if (leftTimestamp === null) {
        return 1;
      }

      if (rightTimestamp === null) {
        return -1;
      }

      if (filters.sort === "oldest") {
        return leftTimestamp - rightTimestamp;
      }

      return rightTimestamp - leftTimestamp;
    });
  }

  function closeMenus($wrapper) {
    $wrapper.find("[data-toggle-menu]").attr("aria-expanded", "false");
    $wrapper.find(".seamless-nd-menu").removeClass("seamless-nd-menu-open");
  }

  function toggleMenu($wrapper, menuName) {
    const $button = $wrapper.find(`[data-toggle-menu="${menuName}"]`);
    const $menu = $wrapper.find(`[data-menu="${menuName}"]`);
    const isOpen = $menu.hasClass("seamless-nd-menu-open");

    closeMenus($wrapper);

    if (!isOpen) {
      $button.attr("aria-expanded", "true");
      $menu.addClass("seamless-nd-menu-open");
    }
  }

  function renderCoursesWidget($wrapper, options = {}) {
    const state = $wrapper.data("coursesState");

    if (!state) {
      return;
    }

    const filteredCourses = getFilteredCourses(state.courses, state.filters);
    const cardsHtml = filteredCourses.length
      ? filteredCourses.map((course) => renderCourseCard(course)).join("")
      : renderNoCourses("No courses match your current filters.");

    const toolbarHtml = state.showSearchBar
      ? renderSearchBar(
          state.filters,
          state.yearOptions,
          state.courses.length,
          filteredCourses.length,
          $wrapper.data("instanceId"),
        )
      : "";

    $wrapper.html(`
      ${toolbarHtml}
      <div class="seamless-courses-grid">
        ${cardsHtml}
      </div>
    `);

    if (options.focusSearch) {
      const $searchInput = $wrapper.find('[data-role="course-search"]');
      const input = $searchInput.get(0);

      if (input) {
        input.focus();
        const cursorPosition = input.value.length;
        input.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
  }

  function bindWidgetEvents($wrapper) {
    if ($wrapper.data("eventsBound")) {
      return;
    }

    const instanceId = $wrapper.data("instanceId");

    $wrapper.on("input", '[data-role="course-search"]', function () {
      const state = $wrapper.data("coursesState");

      if (!state) {
        return;
      }

      state.filters.search = $(this).val();
      closeMenus($wrapper);
      renderCoursesWidget($wrapper, { focusSearch: true });
    });

    $wrapper.on("click", "[data-toggle-menu]", function (event) {
      event.preventDefault();
      event.stopPropagation();
      toggleMenu($wrapper, $(this).data("toggleMenu"));
    });

    $wrapper.on("click", "[data-menu] li", function () {
      const state = $wrapper.data("coursesState");

      if (!state) {
        return;
      }

      const $menu = $(this).closest("[data-menu]");
      const menuName = $menu.data("menu");
      const nextValue = String($(this).data("value"));

      if (menuName === "access") {
        state.filters.access = nextValue;
      } else if (menuName === "year") {
        state.filters.year = nextValue;
      } else if (menuName === "sort") {
        state.filters.sort = nextValue;
      }

      closeMenus($wrapper);
      renderCoursesWidget($wrapper);
    });

    $wrapper.on("click", '[data-role="reset-filters"]', function () {
      const state = $wrapper.data("coursesState");

      if (!state) {
        return;
      }

      state.filters = { ...DEFAULT_FILTERS };
      closeMenus($wrapper);
      renderCoursesWidget($wrapper);
    });

    $(document).on(`click.seamlessCoursesWidget${instanceId}`, function (event) {
      if (!$wrapper.is(event.target) && !$wrapper.has(event.target).length) {
        closeMenus($wrapper);
      }
    });

    $(document).on(`keydown.seamlessCoursesWidget${instanceId}`, function (event) {
      if (event.key === "Escape") {
        closeMenus($wrapper);
      }
    });

    $wrapper.data("eventsBound", true);
  }

  function renderInitialLoader($wrapper) {
    $wrapper.html(`
      <div class="seamless-courses-grid">
        ${renderLoader()}
      </div>
    `);
  }

  function initCoursesListWidget($wrapper) {
    if (!$wrapper.length || $wrapper.data("initialized")) {
      return;
    }

    $wrapper.data("initialized", true);
    widgetInstanceCounter += 1;
    $wrapper.data("instanceId", widgetInstanceCounter);

    renderInitialLoader($wrapper);

    if (typeof window.SeamlessAPI === "undefined") {
      console.error(
        "[Seamless Courses] SeamlessAPI not found. Make sure seamless-api-client.js is loaded.",
      );
      $wrapper.html(`
        <div class="seamless-courses-grid">
          ${renderError("API client not available. Please contact support.")}
        </div>
      `);
      return;
    }

    window.SeamlessAPI.getAllCourses()
      .then((courses) => {
        const publishedCourses = Array.isArray(courses)
          ? courses.filter((course) => {
              const status = String(course?.status || "").toLowerCase();
              return !status || status === "published";
            })
          : [];

        if (!publishedCourses.length) {
          $wrapper.html(`
            <div class="seamless-courses-grid">
              ${renderNoCourses()}
            </div>
          `);
          return;
        }

        $wrapper.data("coursesState", {
          courses: publishedCourses.slice(),
          filters: { ...DEFAULT_FILTERS },
          yearOptions: buildYearOptions(publishedCourses),
          showSearchBar: String($wrapper.data("show-search-bar")) !== "false",
        });

        bindWidgetEvents($wrapper);
        renderCoursesWidget($wrapper);
      })
      .catch((error) => {
        console.error("[Seamless Courses] Error fetching courses:", error);
        $wrapper.html(`
          <div class="seamless-courses-grid">
            ${renderError("Failed to load courses. Please try again later.")}
          </div>
        `);
      });
  }

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

  $(document).ready(function () {
    $(".seamless-courses-list-wrapper").each(function () {
      initCoursesListWidget($(this));
    });
  });
})(jQuery);
