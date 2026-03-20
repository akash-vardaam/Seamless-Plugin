import jQueryModule from "jquery";
import "add-to-calendar-button";

// Make jQuery available globally for Slick Carousel
window.jQuery = jQueryModule;
window.$ = jQueryModule;

// Import Slick after jQuery is global
import "slick-carousel";
import "slick-carousel/slick/slick.css";

// Now use noConflict for our own use
const seamlessJquery = jQueryModule.noConflict(true);

import Calendar from "@toast-ui/calendar";
import "@toast-ui/calendar/dist/toastui-calendar.min.css";
// import '@fortawesome/fontawesome-free/css/all.min.css';
// import '@fortawesome/fontawesome-free/js/all.js';
import "../css/seamless.css";

class SeamlessCalendar {
  constructor(options = {}) {
    this.calendar = null;
    this.currentView = "month";
    this.events = options.events || [];
    this.ajaxUrl = options.ajaxUrl || seamless_ajax.ajax_url;
    this.nonce = options.nonce || seamless_ajax.nonce;
    this.slug = options.slug || "event";
    this.$wrapper = options.wrapper ? seamlessJquery(options.wrapper) : null;
    this.currentDate = new Date();
    this.currentPage = 1;
    this.currentFilters = {
      categories: [],
      sort: "all",
    };
    // Color palette for different events
    this.eventColors = [
      "#F6339A",
      "#2B7FFF",
      "#f59e0b",
      "#3CD679",
      "#AD46FF",
      "#346BCC",
      "#FF6900",
      "#e11d48",
      "#f97316",
    ];
    this.colorAssignments = new Map();
    this.colorCounter = 0;

    this.init();
  }

  getFilterElements() {
    const $wrapper =
      this.$wrapper && this.$wrapper.length
        ? this.$wrapper
        : seamlessJquery(".seamless-event-wrapper").first();

    return {
      $sortBy: $wrapper.find(".seamless-sort-select"),
      $search: $wrapper.find(".seamless-search-input"),
      $categoryDropdowns: $wrapper.find(".seamless-category-dropdowns"),
    };
  }

  init() {
    this.initCalendar();
    this.bindEvents();
    this.updateDateDisplay();
    this.loadEvents();
    this.initMobileEventPreview();
  }

  getEventColor(event) {
    if (this.colorAssignments.has(event.id)) {
      return this.colorAssignments.get(event.id);
    }

    const colorIndex = this.colorCounter % this.eventColors.length;
    const color = this.eventColors[colorIndex];

    this.colorAssignments.set(event.id, color);
    this.colorCounter++;

    return color;
  }

  // Convert hex color to rgba with opacity
  hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  formatTime(date) {
    if (!date) return "";
    const d = new Date(date);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  }

  initCalendar() {
    const calendarEl = document.getElementById("seamlessCalendar");

    if (!calendarEl) {
      console.error("Calendar element #seamlessCalendar not found");
      return;
    }

    this.calendar = new Calendar(calendarEl, {
      defaultView: "month",
      isReadOnly: true,
      useCreationPopup: false,
      useDetailPopup: false,
      calendars: [
        {
          id: "seamless-events",
          name: "Events",
          backgroundColor: "#2B7FFF",
          borderColor: "#3182ce",
          dragBackgroundColor: "#2B7FFF",
        },
      ],
      month: {
        startDayOfWeek: 0, // Sunday (0=Sunday, 1=Monday)
        dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        visibleWeeksCount: 6,
        visibleEventCount: 3, // Show up to 3 events per day
        workweek: false, // Show all 7 days
        narrowWeekend: false, // Don't narrow weekends
      },
      week: {
        startDayOfWeek: 1,
        dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        taskView: false,
        scheduleView: ["allday", "time"],
      },
      day: {
        // Apply the same for the 'day' view
        startDayOfWeek: 1,
        dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        taskView: false,
        scheduleView: ["allday", "time"],
      },
      template: {
        monthGridHeader: (model) => {
          const date = model.date.split("-")[2];
          const isToday = model.isToday;
          const isPastDate =
            new Date(model.date) < new Date().setHours(0, 0, 0, 0);
          const isCurrentMonth = !model.isOtherMonth;

          // On mobile, render colored dots for each event on this date
          let dotsHtml = "";
          if (this.isMobile()) {
            const cellDate = model.date; // "YYYY-MM-DD"
            const eventsOnDay = (this.events || []).filter((ev) => {
              const start = ev.formatted_start_date || ev.start_date || "";
              const end = ev.formatted_end_date || ev.end_date || "";
              if (!start) return false;
              const s = new Date(start);
              const e = end ? new Date(end) : s;
              const d = new Date(cellDate);
              // Normalize to date-only comparison
              const sDate = new Date(
                s.getFullYear(),
                s.getMonth(),
                s.getDate(),
              );
              const eDate = new Date(
                e.getFullYear(),
                e.getMonth(),
                e.getDate(),
              );
              const dDate = new Date(
                d.getFullYear(),
                d.getMonth(),
                d.getDate(),
              );
              return dDate >= sDate && dDate <= eDate;
            });
            const maxDots = 3;
            const shown = eventsOnDay.slice(0, maxDots);
            if (shown.length) {
              const dots = shown
                .map((ev) => {
                  const color = this.getEventColor(ev);
                  return `<span class="seamless-mobile-dot" style="background:${color};"></span>`;
                })
                .join("");
              const extra =
                eventsOnDay.length > maxDots
                  ? `<span class="seamless-mobile-dot seamless-mobile-dot--more"></span>`
                  : "";
              dotsHtml = `<span class="seamless-mobile-dots" data-date="${cellDate}">${dots}${extra}</span>`;
            }
          }

          return `<span class="calendar-date"
                            data-full-date="${model.date}"
                            ${isToday ? 'data-is-today="true"' : ""}
                            ${isPastDate ? 'data-is-past="true"' : ""}
                            ${
                              isCurrentMonth
                                ? 'data-is-current-month="true"'
                                : ""
                            }>
                        ${date}
                    </span>${dotsHtml}`;
        },
        monthGridHeaderExceed: function (hiddenEvents) {
          return `${hiddenEvents} more events...`;
        },
        monthDayname: (model) => {
          return `<span class="calendar-dayname">${model.label}</span>`;
        },
        // Custom event template for month view
        monthMoreTitleDate: (model) => {
          return `<span class="toastui-calendar-month-more-title">${model.ymd}</span>`;
        },
        // Custom event template for week view
        weekGridHeader: (model) => {
          return `<span class="toastui-calendar-week-header">${model.date}</span>`;
        },
        time: (event) => {
          if (this.currentView === "week" || this.currentView === "day") {
            return `
                            <div class="seamless-calendar-event-wrapper">
                                <div class="seamless-event-title">${
                                  event.title
                                }</div>
                                <div class="seamless-event-time">${this.formatTime(
                                  event.start,
                                )}</div>
                            </div>
                        `;
          }
          return `<div style="display: flex; justify-content: space-between; align-items: center; width: 100%;"><span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${
            event.title
          }</span><strong style="flex-shrink: 0; margin-left: 5px;">${this.formatTime(
            event.start,
          )}</strong></div>`;
        },
        allday: (event) => {
          return `<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${event.title}</span>`;
        },
      },
    });

    this.calendar.on("clickEvent", (eventObj) => {
      const event = this.events.find((e) => e.id === eventObj.event.id);
      if (event && event.slug) {
        // No need to pass event_type - auto-detection will handle it
        const details_url = `${window.location.origin}/${this.slug}/${event.slug}`;
        window.open(details_url, "_self");
      } else {
        console.log("No valid link found for event:", event);
      }
    });

    // Handle calendar rendering completion to apply custom styles
    this.calendar.on("afterRender", () => {
      // Apply styles with multiple timeouts to ensure they stick
      setTimeout(() => this.applyEventStyles(), 50);
      // Only sync the mobile class when NOT in a view-switch transition.
      // During a transition, changeView's own setTimeout handles it.
      if (!this._viewTransitioning) {
        this._updateMobileClass();
      }
    });

    // Handle view changes to reapply styles
    this.calendar.on("beforeUpdateEvent", () => {
      setTimeout(() => this.applyEventStyles(), 50);
    });

    // Additional event listeners for better style application
    this.calendar.on("clickDayname", () => {
      setTimeout(() => this.applyEventStyles(), 100);
    });

    this.calendar.on("beforeCreateSchedule", () => {
      setTimeout(() => this.applyEventStyles(), 50);
    });

    this.calendar.on("afterRenderSchedule", () => {
      setTimeout(() => this.applyEventStyles(), 50);
    });

    // Set calendar to 1st of current month on initialization
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.calendar.setDate(firstOfMonth);

    // Toggle mobile-month class on resize
    this._updateMobileClass();
    window.addEventListener("resize", () => {
      this._updateMobileClass();
      // Re-render so dots template re-evaluates on breakpoint crossing
      if (this.currentView === "month") {
        this.calendar.render();
      }
    });
  }

  // Apply custom styles to rendered events
  applyEventStyles() {
    // Apply styles to month view events
    const monthEvents = document.querySelectorAll(
      ".toastui-calendar-weekday-event",
    );
    monthEvents.forEach((eventEl) => {
      const titleEl = eventEl.querySelector(
        ".toastui-calendar-weekday-event-title",
      );
      const dotEl = eventEl.querySelector(
        ".toastui-calendar-weekday-event-dot",
      );

      let hexColor = null;

      // For single-day events with dot
      if (dotEl) {
        const dotColor = window.getComputedStyle(dotEl).backgroundColor;
        const rgbaMatch = dotColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/,
        );

        if (rgbaMatch) {
          const [, r, g, b] = rgbaMatch;
          hexColor = this.rgbToHex(parseInt(r), parseInt(g), parseInt(b));
          // Remove opacity for the dot color (set to solid color)
          dotEl.style.backgroundColor = hexColor;
        }
      }
      // For multi-day events without dot (get color from inline style)
      else if (titleEl) {
        const eventColor = window.getComputedStyle(eventEl).color;
        const rgbaMatch = eventColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/,
        );

        if (rgbaMatch) {
          const [, r, g, b] = rgbaMatch;
          hexColor = this.rgbToHex(parseInt(r), parseInt(g), parseInt(b));
        }
      }

      // Apply styling if we found a color
      if (hexColor && titleEl) {
        // Apply background with 5% opacity
        eventEl.style.backgroundColor = this.hexToRgba(hexColor, 0.05);
        eventEl.style.borderColor = this.hexToRgba(hexColor, 0.5);
        titleEl.style.color = hexColor;
      }
    });

    // Additionally handle Week/Day All-day panel extra events (beyond first 3)
    const alldayPanels = document.querySelectorAll(
      ".toastui-calendar-panel-allday-events",
    );

    const applyAlldayExtraMargins = (panel) => {
      const blocks = panel.querySelectorAll(
        ".toastui-calendar-weekday-event-block",
      );
      if (blocks.length > 3) {
        blocks.forEach((block, idx) => {
          if (idx >= 3) {
            const innerEvent = block.querySelector(
              ".toastui-calendar-weekday-event",
            );
            const target = innerEvent || block;
            target.style.setProperty("margin-left", "6px", "important");
            target.style.setProperty("margin-right", "6px", "important");
            target.style.setProperty("margin-top", "2px", "important");
          }
        });
      }
    };

    alldayPanels.forEach((panel) => {
      // Apply immediately for current DOM
      applyAlldayExtraMargins(panel);

      // Observe future changes (e.g., after clicking +N more)
      if (!panel.__seamlessObserved) {
        const observer = new MutationObserver(() => {
          // Slight delay to allow layout updates
          setTimeout(() => applyAlldayExtraMargins(panel), 0);
        });
        observer.observe(panel, { childList: true, subtree: true });
        panel.__seamlessObserved = true;
      }
    });

    // Apply styles for week and day view events
    const timeGridEvents = document.querySelectorAll(
      ".toastui-calendar-event-time",
    );
    timeGridEvents.forEach((eventEl) => {
      const eventId = eventEl.getAttribute("data-event-id");
      if (eventId) {
        const event = this.events.find((e) => e.id == eventId);
        if (event) {
          const color = this.getEventColor(event);
          eventEl.style.backgroundColor = this.hexToRgba(color, 0.1);
          eventEl.style.borderColor = this.hexToRgba(color, 0.5);

          const titleEl = eventEl.querySelector(".seamless-event-title");
          if (titleEl) {
            titleEl.style.color = color;
          }
          const timeEl = eventEl.querySelector(".seamless-event-time");
          if (timeEl) {
            timeEl.style.color = color;
          }
        }
      }
    });

    // Set up "see more" popup positioning
    this.setupSeeMorePopupPositioning();
  }

  // Position "see more" popup relative to the clicked cell
  setupSeeMorePopupPositioning() {
    // Use event delegation on the calendar container
    const calendarEl = document.getElementById("seamlessCalendar");
    if (!calendarEl) return;

    // Listen for clicks on "more" buttons
    calendarEl.addEventListener("click", (e) => {
      const moreButton = e.target.closest(
        ".toastui-calendar-template-monthGridHeaderExceed",
      );
      if (!moreButton) return;

      // Find the cell that contains this button
      const cell = moreButton.closest(".toastui-calendar-daygrid-cell");
      if (!cell) return;

      // Wait for the popup to be created by Toast UI Calendar
      setTimeout(() => {
        const popup = document.querySelector(
          ".toastui-calendar-see-more-container",
        );
        if (!popup) return;

        // Get cell position
        const cellRect = cell.getBoundingClientRect();
        const calendarRect = calendarEl.getBoundingClientRect();

        // Calculate position relative to the calendar
        const cellTop = cellRect.top - calendarRect.top;
        const cellLeft = cellRect.left - calendarRect.left;

        // Position the popup near the cell
        // Adjust top to be slightly below the cell
        const popupTop = cellTop + cellRect.height + 10;
        const popupLeft = cellLeft;

        // Apply positioning
        popup.style.top = `${popupTop}px`;
        popup.style.left = `${popupLeft}px`;
        popup.style.transform = "none"; // Remove any default transform
        popup.style.maxHeight = "400px"; // Set a reasonable max height
        popup.style.overflowY = "auto"; // Enable scrolling if needed

        // Apply styles to events in the popup
        this.applyPopupEventStyles(popup);
      }, 10);
    });
  }

  // Apply styles to events in the "see more" popup
  applyPopupEventStyles(popup) {
    const popupEvents = popup.querySelectorAll(
      ".toastui-calendar-weekday-event",
    );

    popupEvents.forEach((eventEl) => {
      const titleEl = eventEl.querySelector(
        ".toastui-calendar-weekday-event-title",
      );
      const dotEl = eventEl.querySelector(
        ".toastui-calendar-weekday-event-dot",
      );

      let hexColor = null;

      // For single-day events with dot
      if (dotEl) {
        const dotColor = window.getComputedStyle(dotEl).backgroundColor;
        const rgbaMatch = dotColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/,
        );

        if (rgbaMatch) {
          const [, r, g, b] = rgbaMatch;
          hexColor = this.rgbToHex(parseInt(r), parseInt(g), parseInt(b));
          // Set dot to solid color
          dotEl.style.backgroundColor = hexColor;
        }
      }
      // For multi-day events without dot (get color from inline style)
      else if (titleEl) {
        const eventColor = window.getComputedStyle(eventEl).color;
        const rgbaMatch = eventColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/,
        );

        if (rgbaMatch) {
          const [, r, g, b] = rgbaMatch;
          hexColor = this.rgbToHex(parseInt(r), parseInt(g), parseInt(b));
        }
      }

      // Apply styling if we found a color
      if (hexColor && titleEl) {
        // Apply background with 5% opacity
        eventEl.style.backgroundColor = this.hexToRgba(hexColor, 0.05);
        eventEl.style.borderColor = this.hexToRgba(hexColor, 0.5);
        titleEl.style.color = hexColor;

        eventEl.style.setProperty("margin-left", "6px", "important");
        eventEl.style.setProperty("margin-right", "6px", "important");
        eventEl.style.backdropFilter = "blur(10px) saturate(171%)";
        eventEl.style.webkitBackdropFilter = "blur(10px) saturate(171%)";
      }
    });
  }

  // Convert RGB to Hex
  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  bindEvents() {
    const $ = seamlessJquery;

    // ── Smooth upward animation helper ───────────────────────────
    const _animateCalendar = () => {
      const calEl = document.getElementById("seamlessCalendar");
      const yearEl = document.getElementById("seamlessYearView");
      const listEl = document.getElementById("seamlessListView");
      const target =
        listEl && listEl.style.display !== "none"
          ? listEl
          : yearEl && yearEl.style.display !== "none"
            ? yearEl
            : calEl;
      if (!target) return;
      target.classList.remove("cal-slide-up");
      void target.offsetWidth; // force reflow
      target.classList.add("cal-slide-up");
    };

    // ── Year spinner helpers ──────────────────────────────────────
    const _getSpinnerYear = () => {
      const el = document.getElementById("calendarYearLabel");
      return el ? parseInt(el.textContent, 10) : new Date().getFullYear();
    };
    const _setSpinnerYear = (y) => {
      const el = document.getElementById("calendarYearLabel");
      if (el) el.textContent = y;
    };
    const _applyYearToCalendar = (year) => {
      const month = parseInt(
        document.getElementById("calMonthMenu")
          ? (() => {
              const active = document.querySelector(".cal-month-item.active");
              return active ? parseInt(active.dataset.month, 10) : 0;
            })()
          : 0,
        10,
      );
      this.calendar.setDate(new Date(year, month, 1));
      this.updateDateDisplay();
      this.loadEvents();
      setTimeout(() => this.applyEventStyles(), 50);
    };

    // ── Month dropdown close helper ────────────────────────────
    const _closeMonthMenu = () => {
      const menu = document.getElementById("calMonthMenu");
      const trigger = document.getElementById("calMonthTrigger");
      if (menu) menu.classList.remove("open");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    };

    // Month trigger toggle
    $(document).on("click", "#calMonthTrigger", (e) => {
      e.stopPropagation();
      const menu = document.getElementById("calMonthMenu");
      const trigger = document.getElementById("calMonthTrigger");
      if (!menu) return;
      const isOpen = menu.classList.contains("open");
      _closeMonthMenu();
      if (!isOpen) {
        menu.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    // Month menu item click
    $(document).on("click", ".cal-month-item", (e) => {
      e.stopPropagation();
      const month = parseInt($(e.currentTarget).data("month"), 10);
      const year = _getSpinnerYear();
      _closeMonthMenu();
      this.calendar.setDate(new Date(year, month, 1));
      this.updateDateDisplay();
      this.loadEvents();
      if (this._displayMode === "list") this.renderListView();
      _animateCalendar();
      setTimeout(() => this.applyEventStyles(), 50);
    });

    // Close month menu when clicking outside
    $(document).on("click.calMonthOutside", (e) => {
      if (!$(e.target).closest("#calMonthDropWrap").length) {
        _closeMonthMenu();
      }
    });

    // Year spinner: increment
    $(document).on("click", "#calYearUp", () => {
      const y = _getSpinnerYear() + 1;
      _setSpinnerYear(y);
      if (this.currentView === "year") {
        this._yearViewYear = y;
        if (this._displayMode !== "list") this.renderYearView(y);
        this.updateDateDisplay();
        if (this._displayMode === "list") this.renderListView();
        _animateCalendar();
      } else {
        _applyYearToCalendar(y);
        if (this._displayMode === "list") this.renderListView();
        _animateCalendar();
      }
    });

    // Year spinner: decrement
    $(document).on("click", "#calYearDown", () => {
      const y = _getSpinnerYear() - 1;
      _setSpinnerYear(y);
      if (this.currentView === "year") {
        this._yearViewYear = y;
        if (this._displayMode !== "list") this.renderYearView(y);
        this.updateDateDisplay();
        if (this._displayMode === "list") this.renderListView();
        _animateCalendar();
      } else {
        _applyYearToCalendar(y);
        if (this._displayMode === "list") this.renderListView();
        _animateCalendar();
      }
    });

    // Navigation prev button
    $("#prevBtn").on("click", () => {
      if (this.currentView === "year") {
        this._yearViewYear--;
        _setSpinnerYear(this._yearViewYear);
        if (this._displayMode !== "list")
          this.renderYearView(this._yearViewYear);
        this.updateDateDisplay();
        if (this._displayMode === "list") this.renderListView();
        _animateCalendar();
        return;
      }
      if (this.currentView === "month") {
        const currentDate = this.calendar.getDate();
        const prevMonth = new Date(currentDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        prevMonth.setDate(1);
        this.calendar.setDate(prevMonth);
      } else {
        this.calendar.prev();
      }
      this.updateDateDisplay();
      if (this._displayMode === "list") this.renderListView();
      _animateCalendar();
      setTimeout(() => this.applyEventStyles(), 50);
    });

    // Navigation next button
    $("#nextBtn").on("click", () => {
      if (this.currentView === "year") {
        this._yearViewYear++;
        _setSpinnerYear(this._yearViewYear);
        if (this._displayMode !== "list")
          this.renderYearView(this._yearViewYear);
        this.updateDateDisplay();
        if (this._displayMode === "list") this.renderListView();
        _animateCalendar();
        return;
      }
      if (this.currentView === "month") {
        const currentDate = this.calendar.getDate();
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        this.calendar.setDate(nextMonth);
      } else {
        this.calendar.next();
      }
      this.updateDateDisplay();
      if (this._displayMode === "list") this.renderListView();
      _animateCalendar();
      setTimeout(() => this.applyEventStyles(), 50);
    });

    // Today button
    $("#todayBtn").on("click", () => {
      if (this.currentView === "year") {
        this._yearViewYear = new Date().getFullYear();
        _setSpinnerYear(this._yearViewYear);
        if (this._displayMode !== "list")
          this.renderYearView(this._yearViewYear);
        this.updateDateDisplay();
        if (this._displayMode === "list") this.renderListView();
        _animateCalendar();
        return;
      }
      const today = new Date();
      this.calendar.setDate(today);
      this.updateDateDisplay();
      if (this._displayMode === "list") this.renderListView();
      _animateCalendar();
      setTimeout(() => this.applyEventStyles(), 50);
    });

    // View buttons — guard against displayListBtn (no data-view) stripping active classes
    $(".view-button").on("click", (e) => {
      const view = $(e.target).closest(".view-button").data("view");
      if (!view) return; // displayListBtn has no data-view, skip
      this.changeView(view);
      _animateCalendar();
    });

    // Display List / Calendar toggle
    $(document).on("click", "#displayListBtn", () => {
      this._displayMode = this._displayMode === "list" ? "calendar" : "list";
      this._applyDisplayMode();
      _animateCalendar();
    });
  }

  // Returns true when the viewport is in mobile range
  isMobile() {
    return window.innerWidth <= 768;
  }

  // ── Mobile day-preview bottom sheet ────────────────────────────────────

  initMobileEventPreview() {
    // Build the bottom-sheet DOM once and append to body
    const sheet = document.createElement("div");
    sheet.id = "seamless-mobile-preview";
    sheet.className = "seamless-mobile-preview";
    sheet.innerHTML = `
      <div class="seamless-mobile-preview-backdrop"></div>
      <div class="seamless-mobile-preview-sheet">
        <div class="seamless-mobile-preview-handle"></div>
        <div class="seamless-mobile-preview-header">
          <span class="seamless-mobile-preview-date"></span>
          <button class="seamless-mobile-preview-close" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="seamless-mobile-preview-list"></div>
      </div>
    `;
    document.body.appendChild(sheet);

    sheet
      .querySelector(".seamless-mobile-preview-backdrop")
      .addEventListener("click", () => this.closeMobilePreview());
    sheet
      .querySelector(".seamless-mobile-preview-close")
      .addEventListener("click", () => this.closeMobilePreview());

    this._mobilePreviewSheet = sheet;

    // Delegate dot clicks inside the calendar
    const calendarEl = document.getElementById("seamlessCalendar");
    if (!calendarEl) return;
    calendarEl.addEventListener("click", (e) => {
      const dot = e.target.closest(".seamless-mobile-dot");
      if (!dot) return;
      e.stopPropagation();
      const container = dot.closest(".seamless-mobile-dots");
      const date = container ? container.dataset.date : null;
      if (date) this.showMobileDayPreview(date);
    });
  }

  showMobileDayPreview(date) {
    const sheet = this._mobilePreviewSheet;
    if (!sheet) return;

    // Find all events that span this date
    const eventsOnDay = (this.events || []).filter((ev) => {
      const start = ev.formatted_start_date || ev.start_date || "";
      const end = ev.formatted_end_date || ev.end_date || "";
      if (!start) return false;
      const s = new Date(start);
      const e = end ? new Date(end) : s;
      const d = new Date(date);
      const sDate = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      const eDate = new Date(e.getFullYear(), e.getMonth(), e.getDate());
      const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return dDate >= sDate && dDate <= eDate;
    });
    if (!eventsOnDay.length) return;

    // Header date label
    const dateObj = new Date(date + "T00:00:00");
    const dateLabel = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    sheet.querySelector(".seamless-mobile-preview-date").textContent =
      dateLabel;

    // Render each event as a tappable row
    const listEl = sheet.querySelector(".seamless-mobile-preview-list");
    listEl.innerHTML = eventsOnDay
      .map((ev) => {
        const color = this.getEventColor(ev);
        const startRaw = ev.formatted_start_date || ev.start_date || "";
        const timeStr = startRaw ? this.formatTime(new Date(startRaw)) : "";
        const detailsUrl = `${window.location.origin}/${this.slug}/${ev.slug}`;
        const location = this._getEventLocationText(ev);
        return `
        <a href="${detailsUrl}" class="seamless-mobile-preview-event">
          <span class="seamless-mobile-preview-event-dot" style="background:${color};"></span>
          <div class="seamless-mobile-preview-event-info">
            <span class="seamless-mobile-preview-event-title">${ev.title || ""}</span>
            ${timeStr ? `<span class="seamless-mobile-preview-event-meta">${timeStr}</span>` : ""}
            ${location ? `<span class="seamless-mobile-preview-event-meta seamless-mobile-preview-event-location"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-map-pin"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${location}</span>` : ""}
          </div>
          <svg class="seamless-mobile-preview-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      `;
      })
      .join("");

    sheet.classList.add("is-open");
  }

  closeMobilePreview() {
    if (this._mobilePreviewSheet) {
      this._mobilePreviewSheet.classList.remove("is-open");
    }
  }

  // Extract a short location string for the preview
  _getEventLocationText(event) {
    const venue =
      event.event_type === "group_event" && event.associated_events?.[0]?.venue
        ? event.associated_events[0].venue
        : event.venue || {};
    const parts = [];
    if (venue.city) parts.push(venue.city);
    if (venue.state) parts.push(venue.state);
    if (parts.length) return parts.join(", ");
    if (event.virtual_meeting_link) return "Online";
    if (typeof venue === "string" && venue) return venue;
    return "";
  }

  // Adds/removes the mobile-month CSS class based on current view + screen size
  _updateMobileClass() {
    const calendarEl = document.getElementById("seamlessCalendar");
    if (!calendarEl) return;
    if (this.isMobile() && this.currentView === "month") {
      calendarEl.classList.add("seamless-mobile-month");
    } else {
      calendarEl.classList.remove("seamless-mobile-month");
    }
  }

  changeView(view) {
    const $ = seamlessJquery;
    const calendarEl = document.getElementById("seamlessCalendar");
    const yearViewEl = document.getElementById("seamlessYearView");
    const listEl = document.getElementById("seamlessListView");
    const isMobileView = this.isMobile();

    // Update active view button regardless of mode
    $(".view-button").removeClass("active");
    $(`.view-button[data-view="${view}"]`).addClass("active");

    // ── List display mode: stay in list but switch the view context ──────
    if (this._displayMode === "list") {
      const wasYear = this.currentView === "year";
      this.currentView = view;

      if (view === "year") {
        this._yearViewYear = this._yearViewYear || new Date().getFullYear();
      } else {
        // Sync TUI calendar date from spinner year if coming from year view
        if (wasYear) {
          const syncYear = this._yearViewYear || new Date().getFullYear();
          const curCalDate = new Date(this.calendar.getDate());
          if (curCalDate.getFullYear() !== syncYear) {
            this.calendar.setDate(new Date(syncYear, curCalDate.getMonth(), 1));
          }
        }
        const viewMap = { month: "month", week: "week", day: "day" };
        this.calendar.changeView(viewMap[view]);
      }

      this.updateDateDisplay();
      this.renderListView();
      return;
    }

    // ── Normal (calendar) display mode ───────────────────────────────────
    if (view === "year") {
      if (calendarEl) calendarEl.style.display = "none";
      if (yearViewEl) yearViewEl.style.display = "";
      if (listEl) listEl.style.display = "none";

      this.currentView = "year";
      this._yearViewYear = this._yearViewYear || new Date().getFullYear();
      this.renderYearView(this._yearViewYear);
      this.updateDateDisplay();
      return;
    }

    // Switching away from year view — restore TUI calendar & sync its date
    if (this.currentView === "year") {
      const syncYear = this._yearViewYear || new Date().getFullYear();
      const curCalDate = new Date(this.calendar.getDate());
      if (curCalDate.getFullYear() !== syncYear) {
        this.calendar.setDate(new Date(syncYear, curCalDate.getMonth(), 1));
      }
      if (calendarEl) calendarEl.style.display = "";
      if (yearViewEl) yearViewEl.style.display = "none";
      if (listEl) listEl.style.display = "none";
    }

    if (isMobileView) {
      this._viewTransitioning = true;
      if (calendarEl) {
        calendarEl.style.transition = "none";
        calendarEl.style.opacity = "0";
      }
    }

    this.closeMobilePreview();

    const viewMap = { month: "month", week: "week", day: "day" };
    this.currentView = view;
    this.calendar.changeView(viewMap[view]);
    this.updateDateDisplay();

    if (isMobileView) {
      this.loadEvents()
        .then(() => {
          setTimeout(() => {
            this._updateMobileClass();
            this._viewTransitioning = false;
            if (calendarEl) {
              calendarEl.style.opacity = "1";
              requestAnimationFrame(() => {
                if (calendarEl) calendarEl.style.transition = "";
              });
            }
            this.applyEventStyles();
          }, 50);
        })
        .catch(() => {
          this._updateMobileClass();
          this._viewTransitioning = false;
          if (calendarEl) {
            calendarEl.style.opacity = "1";
            setTimeout(() => {
              if (calendarEl) calendarEl.style.transition = "";
            }, 50);
          }
        });
    } else {
      this._updateMobileClass();
      this.loadEvents();
      setTimeout(() => this.applyEventStyles(), 50);
    }
  }

  updateDateDisplay() {
    const today = new Date();
    const monthAbbrs = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    const fullMonths = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const currentMonthEl = document.getElementById("currentMonth");
    const currentDayEl = document.getElementById("currentDay");
    const rangeEl = document.getElementById("dateRange");
    const monthDropWrapEl = document.getElementById("calMonthDropWrap");
    const yearSpinnerEl = document.getElementById("calendarYearSpinner");
    const yearLabelEl = document.getElementById("calendarYearLabel");
    const monthLabelEl = document.getElementById("calMonthLabel");
    const todayBtnEl = document.getElementById("todayBtn");

    if (currentMonthEl)
      currentMonthEl.textContent = monthAbbrs[today.getMonth()];
    if (currentDayEl) currentDayEl.textContent = today.getDate();

    // Update Today button label based on view
    if (todayBtnEl) {
      const labels = {
        month: "This Month",
        week: "This Week",
        day: "Today",
        year: "This Year",
      };
      todayBtnEl.textContent = labels[this.currentView] || "Today";
    }

    // Helper: pulse an element with cal-slide-up when its content changes
    const _pulseEl = (el) => {
      if (!el) return;
      el.classList.remove("cal-slide-up");
      void el.offsetWidth;
      el.classList.add("cal-slide-up");
    };

    if (this.currentView === "year") {
      if (monthDropWrapEl) monthDropWrapEl.style.display = "none";
      if (yearSpinnerEl) yearSpinnerEl.style.display = "";
      if (rangeEl) rangeEl.style.display = "none";
      const yr = this._yearViewYear || today.getFullYear();
      if (yearLabelEl) {
        const prev = yearLabelEl.textContent;
        yearLabelEl.textContent = yr;
        if (String(prev) !== String(yr)) _pulseEl(yearLabelEl);
      }
      return;
    }

    if (monthDropWrapEl) monthDropWrapEl.style.display = "";
    if (yearSpinnerEl) yearSpinnerEl.style.display = "";
    if (rangeEl) rangeEl.style.display = "";

    const calendarDate = new Date(this.calendar.getDate());
    const viewStart = new Date(this.calendar.getDateRangeStart());
    const viewEnd = new Date(this.calendar.getDateRangeEnd());
    const activeMonth = calendarDate.getMonth();
    const newYear = String(calendarDate.getFullYear());
    const newMonth = fullMonths[activeMonth];

    if (yearLabelEl) {
      const prev = yearLabelEl.textContent;
      yearLabelEl.textContent = newYear;
      if (prev !== newYear);
    }

    if (monthLabelEl) {
      const trigger = document.getElementById("calMonthTrigger");
      const prev = monthLabelEl.textContent;
      monthLabelEl.textContent = newMonth;
      if (prev !== newMonth && trigger) _pulseEl(trigger.children[0]);
    }

    document.querySelectorAll(".cal-month-item").forEach((item) => {
      const m = parseInt(item.dataset.month, 10);
      item.classList.toggle("active", m === activeMonth);
    });

    if (this.currentView === "month") {
      const firstDay = new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth(),
        1,
      );
      const lastDay = new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() + 1,
        0,
      );
      if (rangeEl)
        rangeEl.textContent = `${firstDay.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — ${lastDay.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else if (this.currentView === "week") {
      if (rangeEl)
        rangeEl.textContent = `${viewStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${viewEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      if (rangeEl)
        rangeEl.textContent = viewStart.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
    }
  }

  async loadEvents() {
    const elements = this.getFilterElements();
    const currentSort = elements.$sortBy.val() || this.currentFilters.sort;
    const search = elements.$search.val() || "";
    const selectedCategories = [];
    elements.$categoryDropdowns.find(".category-select").each(function () {
      const value = seamlessJquery(this).val();
      if (value) {
        selectedCategories.push(value);
      }
    });

    this.currentFilters.categories = selectedCategories;
    this.currentFilters.sort = currentSort;

    if (
      window.cachedData &&
      window.cachedData.events &&
      window.cachedData.events.length > 0
    ) {
      // Use cached data and filter locally
      // Build a set of associated event IDs to filter out
      const associatedEventIds = new Set();
      window.cachedData.events.forEach((event) => {
        if (event.event_type === "group_event" && event.associated_events) {
          event.associated_events.forEach((assocEvent) => {
            if (assocEvent.id) {
              associatedEventIds.add(assocEvent.id);
            }
          });
        }
      });

      let filteredEvents = [...window.cachedData.events].filter((e) => {
        // Filter out non-published events
        if ((e.status || "").toLowerCase() !== "published") return false;
        // Filter out associated events
        if (associatedEventIds.has(e.id)) return false;
        return true;
      });

      // Apply search filter
      if (search) {
        filteredEvents = filteredEvents.filter((event) =>
          event.title.toLowerCase().includes(search.toLowerCase()),
        );
      }

      // Apply category filter
      if (selectedCategories.length > 0) {
        filteredEvents = filteredEvents.filter((event) => {
          if (!event.categories || !Array.isArray(event.categories)) {
            return false;
          }
          return selectedCategories.some((catId) =>
            event.categories.some((eventCat) => eventCat.id === catId),
          );
        });
      }

      // Apply sort filter
      if (currentSort !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filteredEvents = filteredEvents.filter((event) => {
          let eventStartStr, eventEndStr;

          if (event.event_type === "group_event") {
            eventStartStr = event.formatted_start_date;
            eventEndStr = event.formatted_end_date;
          } else {
            eventStartStr = event.start_date;
            eventEndStr = event.end_date;
          }

          if (!eventStartStr) return false;

          const eventStartDate = new Date(eventStartStr);
          eventStartDate.setHours(0, 0, 0, 0);

          const eventEndDate = eventEndStr
            ? new Date(eventEndStr)
            : eventStartDate;
          eventEndDate.setHours(23, 59, 59, 999);

          switch (currentSort) {
            case "upcoming":
              return eventStartDate > today;
            case "current":
              return today >= eventStartDate && today <= eventEndDate;
            case "past":
              return eventEndDate < today;
          }
          return false;
        });

        // Apply ordering for sorts: upcoming => ascending by start datetime,
        // past => descending by end datetime (most recent first).
        if (currentSort === "upcoming") {
          filteredEvents.sort((a, b) => {
            const aStart =
              a.event_type === "group_event"
                ? a.formatted_start_date
                : a.start_date;
            const bStart =
              b.event_type === "group_event"
                ? b.formatted_start_date
                : b.start_date;
            const aTime = aStart
              ? new Date(aStart).getTime()
              : Number.POSITIVE_INFINITY;
            const bTime = bStart
              ? new Date(bStart).getTime()
              : Number.POSITIVE_INFINITY;
            return aTime - bTime; // ascending
          });
        } else if (currentSort === "past") {
          filteredEvents.sort((a, b) => {
            const aEnd =
              a.event_type === "group_event"
                ? a.formatted_end_date || a.formatted_start_date
                : a.end_date || a.start_date;
            const bEnd =
              b.event_type === "group_event"
                ? b.formatted_end_date || b.formatted_start_date
                : b.end_date || b.start_date;
            const aTime = aEnd ? new Date(aEnd).getTime() : 0;
            const bTime = bEnd ? new Date(bEnd).getTime() : 0;
            return bTime - aTime; // descending
          });
        }
      }

      this.events = filteredEvents;
      this.renderEvents();
      return;
    }

    // Fallback to API call if no cached data
    try {
      const events = await window.SeamlessAPI.fetchAllEvents(
        this.currentFilters.categories,
        search,
      );

      this.events = events || [];
      this.renderEvents();
    } catch (error) {
      console.error(
        "[Seamless Calendar] Error loading events from API:",
        error,
      );
      this.events = [];
      this.renderEvents();
    }
  }

  renderEvents() {
    // If in year view, just refresh the year grid
    if (this.currentView === "year") {
      this.renderYearView(this._yearViewYear || new Date().getFullYear());
      if (this._displayMode === "list") this.renderListView();
      return;
    }

    // If in list mode, refresh the list view
    if (this._displayMode === "list") {
      this.renderListView();
      return;
    }

    if (!this.calendar) {
      console.log("Calendar not initialized, cannot render events");
      return;
    }

    this.calendar.clear();

    // Convert WordPress events to TUI Calendar format
    const calendarEvents = this.events.map((event) => {
      let startDate, endDate;
      if (event.event_type === "group_event") {
        // For group events, use start_date/end_date which contain time information
        // formatted_start_date/formatted_end_date might not have time component
        startDate = event.start_date || event.formatted_start_date;
        endDate = event.end_date || event.formatted_end_date;
      } else {
        // Use formatted dates for correct local timezone display
        startDate = event.formatted_start_date || event.start_date;
        endDate = event.formatted_end_date || event.end_date;
      }

      let venue = "";

      if (event.venue) {
        if (typeof event.venue === "object" && event.venue !== null) {
          venue =
            event.venue.name ||
            event.venue.title ||
            event.venue.address ||
            JSON.stringify(event.venue);
        } else {
          venue = event.venue;
        }
      }

      // Parse and normalize date strings to ISO format
      const parseDate = (dateStr) => {
        if (!dateStr || typeof dateStr !== "string") return dateStr;

        // Try to parse the date using various formats
        let parsedDate = null;

        // Format: "Mon DD, YYYY" or "Month DD, YYYY" (e.g., "Dec 25, 2024" or "December 25, 2024")
        const monthNameMatch = dateStr.match(
          /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?)?/,
        );
        if (monthNameMatch) {
          const monthNames = {
            jan: 0,
            january: 0,
            feb: 1,
            february: 1,
            mar: 2,
            march: 2,
            apr: 3,
            april: 3,
            may: 4,
            jun: 5,
            june: 5,
            jul: 6,
            july: 6,
            aug: 7,
            august: 7,
            sep: 8,
            september: 8,
            oct: 9,
            october: 9,
            nov: 10,
            november: 10,
            dec: 11,
            december: 11,
          };
          const monthStr = monthNameMatch[1].toLowerCase();
          const month = monthNames[monthStr];
          const day = parseInt(monthNameMatch[2]);
          const year = parseInt(monthNameMatch[3]);

          if (month !== undefined) {
            parsedDate = new Date(year, month, day);

            // Add time if present
            if (monthNameMatch[4]) {
              let hours = parseInt(monthNameMatch[4]);
              const minutes = parseInt(monthNameMatch[5] || 0);
              const seconds = parseInt(monthNameMatch[6] || 0);
              const ampm = monthNameMatch[7];

              if (ampm) {
                if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
                if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
              }

              parsedDate.setHours(hours, minutes, seconds);
            }
          }
        }

        // Format: "DD Month YYYY" (e.g., "25 December 2024")
        if (!parsedDate) {
          const ddMonthYyyyMatch = dateStr.match(
            /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
          );
          if (ddMonthYyyyMatch) {
            const monthNames = {
              jan: 0,
              january: 0,
              feb: 1,
              february: 1,
              mar: 2,
              march: 2,
              apr: 3,
              april: 3,
              may: 4,
              jun: 5,
              june: 5,
              jul: 6,
              july: 6,
              aug: 7,
              august: 7,
              sep: 8,
              september: 8,
              oct: 9,
              october: 9,
              nov: 10,
              november: 10,
              dec: 11,
              december: 11,
            };
            const day = parseInt(ddMonthYyyyMatch[1]);
            const monthStr = ddMonthYyyyMatch[2].toLowerCase();
            const month = monthNames[monthStr];
            const year = parseInt(ddMonthYyyyMatch[3]);

            if (month !== undefined) {
              parsedDate = new Date(year, month, day);

              // Add time if present
              if (ddMonthYyyyMatch[4]) {
                const hours = parseInt(ddMonthYyyyMatch[4]);
                const minutes = parseInt(ddMonthYyyyMatch[5] || 0);
                const seconds = parseInt(ddMonthYyyyMatch[6] || 0);
                parsedDate.setHours(hours, minutes, seconds);
              }
            }
          }
        }

        // Format: "DD-MM-YYYY" or "DD/MM/YYYY" (e.g., "25-12-2024" or "25/12/2024")
        if (!parsedDate) {
          const ddmmyyyyMatch = dateStr.match(
            /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
          );
          if (ddmmyyyyMatch) {
            const day = parseInt(ddmmyyyyMatch[1]);
            const month = parseInt(ddmmyyyyMatch[2]) - 1;
            const year = parseInt(ddmmyyyyMatch[3]);

            // Check if it's DD-MM-YYYY or MM-DD-YYYY by checking if day > 12
            if (day > 12) {
              // Definitely DD-MM-YYYY
              parsedDate = new Date(year, month, day);
            } else if (month > 11) {
              // month is > 11, so first part must be month (MM-DD-YYYY)
              parsedDate = new Date(year, day, month);
            } else {
              // Ambiguous - assume DD-MM-YYYY for European format
              parsedDate = new Date(year, month, day);
            }

            // Add time if present
            if (ddmmyyyyMatch[4]) {
              const hours = parseInt(ddmmyyyyMatch[4]);
              const minutes = parseInt(ddmmyyyyMatch[5] || 0);
              const seconds = parseInt(ddmmyyyyMatch[6] || 0);
              parsedDate.setHours(hours, minutes, seconds);
            }
          }
        }

        // Format: "YYYY-MM-DD" or "YYYY/MM/DD" (ISO format or similar)
        if (!parsedDate) {
          const yyyymmddMatch = dateStr.match(
            /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[\sT](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?([Z])?)?/,
          );
          if (yyyymmddMatch) {
            const year = parseInt(yyyymmddMatch[1]);
            const month = parseInt(yyyymmddMatch[2]) - 1;
            const day = parseInt(yyyymmddMatch[3]);
            parsedDate = new Date(year, month, day);

            // Add time if present
            if (yyyymmddMatch[4]) {
              const hours = parseInt(yyyymmddMatch[4]);
              const minutes = parseInt(yyyymmddMatch[5] || 0);
              const seconds = parseInt(yyyymmddMatch[6] || 0);
              parsedDate.setHours(hours, minutes, seconds);
            }
          }
        }

        // If we successfully parsed, convert to ISO string
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          // Return ISO format: YYYY-MM-DDTHH:mm:ss
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
          const day = String(parsedDate.getDate()).padStart(2, "0");
          const hours = String(parsedDate.getHours()).padStart(2, "0");
          const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
          const seconds = String(parsedDate.getSeconds()).padStart(2, "0");

          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        }

        // Fallback: return original with basic sanitization
        return dateStr
          .replace(".000000Z", "")
          .replace("Z", "")
          .replace(" ", "T");
      };

      // Apply date parsing
      if (startDate) {
        startDate = parseDate(startDate);
      }
      if (endDate) {
        endDate = parseDate(endDate);
      }

      const eventColor = this.getEventColor(event);

      return {
        id: event.id,
        calendarId: "seamless-events",
        title: event.title,
        start: startDate,
        end: endDate || startDate,
        category: "time",
        location: venue,
        backgroundColor: this.hexToRgba(eventColor, 0.05),
        borderColor: eventColor,
        color: eventColor,
        dragBackgroundColor: this.hexToRgba(eventColor, 0.3),
        raw: event,
      };
    });

    this.calendar.createEvents(calendarEvents);
    this.forceStyleApplication();
  }

  // Helper method to force style application with multiple attempts
  forceStyleApplication() {
    const timeouts = [50];
    timeouts.forEach((delay) => {
      setTimeout(() => {
        this.applyEventStyles();
      }, delay);
    });
  }

  // ── Year view renderer ────────────────────────────────────────────────────
  renderYearView(year) {
    const container = document.getElementById("seamlessYearView");
    if (!container) return;

    const MONTH_NAMES = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Build a map: "YYYY-MM-DD" -> [color, color, ...]
    const eventDayMap = {};
    (this.events || []).forEach((ev) => {
      const startRaw = ev.formatted_start_date || ev.start_date || "";
      const endRaw = ev.formatted_end_date || ev.end_date || "";
      if (!startRaw) return;

      const color = this.getEventColor(ev);
      const s = new Date(startRaw);
      const e = endRaw ? new Date(endRaw) : new Date(startRaw);
      // normalise to date-only
      const sDate = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      const eDate = new Date(e.getFullYear(), e.getMonth(), e.getDate());

      for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() !== year) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (!eventDayMap[key]) eventDayMap[key] = [];
        if (eventDayMap[key].length < 4) eventDayMap[key].push(color); // cap at 4 dots
      }
    });

    let html = `<div class="syv-grid">`;

    for (let m = 0; m < 12; m++) {
      const firstOfMonth = new Date(year, m, 1);
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      // getDay(): 0=Sun..6=Sat → convert to Mon=0..Sun=6
      let startDow = firstOfMonth.getDay(); // 0=Sun
      startDow = startDow === 0 ? 6 : startDow - 1; // Mon-based offset

      html += `<div class="syv-month">
        <div class="syv-month-title">${MONTH_NAMES[m]}</div>
        <div class="syv-day-names">${DAY_LABELS.map((d) => `<span>${d}</span>`).join("")}</div>
        <div class="syv-days">`;

      // Empty cells before the 1st
      for (let b = 0; b < startDow; b++) {
        html += `<span class="syv-day syv-empty"></span>`;
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const colors = eventDayMap[key] || [];
        const today = new Date();
        const isToday =
          today.getFullYear() === year &&
          today.getMonth() === m &&
          today.getDate() === day;

        let dotHtml = "";
        if (colors.length === 1) {
          dotHtml = `<span class="syv-dot-wrap"><span class="syv-dot" style="background:${colors[0]}"></span></span>`;
        } else if (colors.length > 1) {
          // Blend into a multi-color conic-gradient circle
          const pct = Math.round(100 / colors.length);
          const stops = colors
            .map((c, i) => `${c} ${i * pct}% ${(i + 1) * pct}%`)
            .join(", ");
          dotHtml = `<span class="syv-dot-wrap"><span class="syv-dot syv-dot-multi" style="background:conic-gradient(${stops})"></span></span>`;
        }

        html += `<span class="syv-day${isToday ? " syv-today" : ""}${colors.length ? " syv-has-event" : ""}" data-date="${key}">
          <span class="syv-day-num">${day}</span>
          ${dotHtml}
        </span>`;
      }

      html += `</div></div>`; // close syv-days + syv-month
    }

    html += `</div>`; // close syv-grid
    container.innerHTML = html;

    // Click a day to navigate to month view — ONLY for event days
    container.querySelectorAll(".syv-day.syv-has-event").forEach((el) => {
      el.addEventListener("click", () => {
        const [y, mo, d] = el.dataset.date.split("-").map(Number);
        const target = new Date(y, mo - 1, d);
        this.calendar.setDate(target);
        this.changeView("month");
      });
    });
  }

  // Method to update events from external source
  updateEvents(newEvents) {
    this.events = newEvents;
    this.renderEvents();
  }

  // Method to add single event
  addEvent(event) {
    this.events.push(event);
    this.renderEvents();
  }

  // Method to remove event
  removeEvent(eventId) {
    this.events = this.events.filter((e) => e.id != eventId);
    this.renderEvents();
  }

  // Method to filter events by categories
  filterByCategories(categories) {
    this.currentFilters.categories = categories;
    this.loadEvents();
  }

  // Method to set sort order
  setSortOrder(sort) {
    this.currentFilters.sort = sort;
    this.loadEvents();
  }

  // Method to update events from external source
  updateEvents(newEvents) {
    this.events = newEvents;
    this.renderEvents();
  }

  // Method to customize color palette
  setColorPalette(colors) {
    this.eventColors = colors;
    this.renderEvents();
  }

  // ── Display List ─────────────────────────────────────────────────────────

  /** Returns {start: Date, end: Date} for the date range shown by the current view */
  _getViewDateRange() {
    const now = new Date();
    if (this.currentView === "year") {
      const y = this._yearViewYear || now.getFullYear();
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59) };
    }
    if (this.currentView === "month") {
      const d = new Date(this.calendar.getDate());
      return {
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      };
    }
    if (this.currentView === "week") {
      const s = new Date(this.calendar.getDateRangeStart());
      const e = new Date(this.calendar.getDateRangeEnd());
      e.setHours(23, 59, 59);
      return { start: s, end: e };
    }
    // day
    const d = new Date(this.calendar.getDate());
    return {
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
      end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
    };
  }

  /** Show/hide calendar vs list panels, and swap the button label */
  _applyDisplayMode() {
    const calEl = document.getElementById("seamlessCalendar");
    const yearEl = document.getElementById("seamlessYearView");
    const listEl = document.getElementById("seamlessListView");
    const toggleBtn = document.getElementById("displayListBtn");
    const isList = this._displayMode === "list";

    if (isList) {
      if (calEl) calEl.style.display = "none";
      if (yearEl) yearEl.style.display = "none";
      if (listEl) listEl.style.display = "";
      this.renderListView();
    } else {
      if (listEl) listEl.style.display = "none";
      if (this.currentView === "year") {
        if (calEl) calEl.style.display = "none";
        if (yearEl) yearEl.style.display = "";
        // Refresh the year grid in case events changed while in list mode
        this.renderYearView(this._yearViewYear || new Date().getFullYear());
      } else {
        if (calEl) calEl.style.display = "";
        if (yearEl) yearEl.style.display = "none";
        // ★ TUI Calendar has stale layout from being hidden while in list mode.
        // Dispatch resize so TUI recalculates row heights, then re-render events
        // so pills appear correctly instead of "N MORE EVENTS..." overflow links.
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event("resize"));
          setTimeout(() => {
            this.renderEvents();
            this.applyEventStyles();
          }, 30);
        });
      }
    }

    if (toggleBtn) {
      // SVG only — no text labels. Swap icon, tooltip and animate.
      if (isList) {
        // Calendar icon (switch back to calendar)
        toggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
        toggleBtn.setAttribute("title", "Display Calendar");
        toggleBtn.setAttribute("aria-label", "Switch to calendar view");
        toggleBtn.classList.add("active");
      } else {
        // List icon (switch to list)
        toggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`;
        toggleBtn.setAttribute("title", "Display List");
        toggleBtn.setAttribute("aria-label", "Switch to list view");
        toggleBtn.classList.remove("active");
      }
      // Animate the icon swap with cal-slide-up
      toggleBtn.children[0].classList.remove("cal-slide-up");
      void toggleBtn.offsetWidth;
      toggleBtn.children[0].classList.add("cal-slide-up");
    }
  }

  /** Render events for the current view's date range as colored list rows */
  renderListView() {
    const listEl = document.getElementById("seamlessListView");
    if (!listEl) return;

    // Preserve any existing search query so re-renders don't clear it
    const existingInput = listEl.querySelector(".cal-list-search-input");
    const existingQuery = existingInput
      ? existingInput.value.trim().toLowerCase()
      : "";

    const { start, end } = this._getViewDateRange();
    const baseEvents = (this.events || []).filter((ev) => {
      const rawStart =
        ev.event_type === "group_event"
          ? ev.formatted_start_date || ev.start_date
          : ev.start_date || ev.formatted_start_date;
      if (!rawStart) return false;
      const s = new Date(rawStart);
      return s >= start && s <= end;
    });

    // Sort chronologically
    baseEvents.sort((a, b) => {
      const aRaw = a.start_date || a.formatted_start_date || "";
      const bRaw = b.start_date || b.formatted_start_date || "";
      return new Date(aRaw) - new Date(bRaw);
    });

    // Build row HTML for a given event array
    const buildRows = (evts) => {
      if (!evts.length) {
        return `<div class="cal-list-empty">No events found for this period.</div>`;
      }
      return `<div class="cal-list-rows">${evts
        .map((ev) => {
          const color = this.getEventColor(ev);
          const rawStart = ev.start_date || ev.formatted_start_date || "";
          const rawEnd = ev.end_date || ev.formatted_end_date || "";
          const startDt = rawStart ? new Date(rawStart) : null;
          const endDt = rawEnd ? new Date(rawEnd) : null;
          const dateLabel = startDt
            ? startDt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "";
          const startTime = startDt ? this.formatTime(startDt) : "";
          const endTime = endDt ? this.formatTime(endDt) : "";
          const timeRange = startTime
            ? endTime && endTime !== startTime
              ? `${startTime} \u2013 ${endTime}`
              : startTime
            : "";
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          const bgColor = `rgba(${r},${g},${b},0.18)`;
          const detailsUrl = `${window.location.origin}/${this.slug}/${ev.slug}`;
          return `
          <a class="cal-list-row" href="${detailsUrl}"
             style="background:${bgColor}; --ev-color:${color};">
            <div class="cal-list-row-left">
              <span class="cal-list-date">${dateLabel}</span>
              <span class="cal-list-title">${ev.title || "(No title)"}</span>
            </div>
            <div class="cal-list-row-right">
              ${timeRange ? `<span class="cal-list-time">${timeRange}</span>` : ""}
            </div>
          </a>`;
        })
        .join("")}</div>`;
    };

    const initialEvents = existingQuery
      ? baseEvents.filter((ev) =>
          (ev.title || "").toLowerCase().includes(existingQuery),
        )
      : baseEvents;

    listEl.innerHTML = `
      <div class="cal-list-search-wrap">
        <svg class="cal-list-search-icon" width="15" height="15" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input class="cal-list-search-input" type="search" placeholder="Search events\u2026"
               value="${existingQuery}" autocomplete="off" />
      </div>
      <div class="cal-list-results" id="calListResults">${buildRows(initialEvents)}</div>
    `;

    // Wire up live search (debounced)
    const input = listEl.querySelector(".cal-list-search-input");
    if (input) {
      let debounce;
      input.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          const q = input.value.trim().toLowerCase();
          const filtered = q
            ? baseEvents.filter((ev) =>
                (ev.title || "").toLowerCase().includes(q),
              )
            : baseEvents;
          const resultsEl = document.getElementById("calListResults");
          if (resultsEl) {
            resultsEl.classList.remove("cal-slide-up");
            void resultsEl.offsetWidth;
            resultsEl.classList.add("cal-slide-up");
            resultsEl.innerHTML = buildRows(filtered);
          }
        }, 200);
      });
      // Restore focus if the user was typing
      if (existingQuery) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }
}

seamlessJquery(document).ready(function ($) {
  // Instant search on typing
  let typingTimer;
  const typingDelay = 300; // ms
  let seamlessAjaxRequest = null; // Variable to hold the AJAX request

  // Cache management
  let cachedData = {
    events: [],
    categories: [],
    raw_categories: [],
    cache_timestamp: null,
    total_events: 0,
  };
  let isDataLoaded = false;

  function getWrapper($el) {
    if ($el && $el.length) {
      const $wrapper = $el.closest(".seamless-event-wrapper");
      if ($wrapper.length) return $wrapper;
    }
    const $wrappers = seamlessJquery(".seamless-event-wrapper");
    return $wrappers.length
      ? $wrappers.first()
      : seamlessJquery("#eventWrapper");
  }

  function getWrapperElements($wrapper) {
    const $scope = $wrapper && $wrapper.length ? $wrapper : getWrapper();
    return {
      $search: $scope.find(".seamless-search-input"),
      $sortBy: $scope.find(".seamless-sort-select"),
      $yearFilter: $scope.find(".seamless-year-select"),
      $currentView: $scope.find(".seamless-current-view"),
      $resetBtn: $scope.find(".seamless-reset-button"),
      $categoryDropdowns: $scope.find(".seamless-category-dropdowns"),
      $tagDropdowns: $scope.find(".seamless-tag-dropdowns"),
      $eventList: $scope.find(".seamless-event-list"),
      $calendarView: $scope.find(".seamless-calendar-view"),
      $pagination: $scope.find(".seamless-pagination-wrapper"),
      $loader: $scope.find("#Seamlessloader").first(),
      $detailsLoader: $scope.find(".details-section #Seamlessloader").first(),
    };
  }

  function updateEventsSummary(
    $wrapper,
    visibleCount,
    totalEvents,
    totalPages,
    page,
  ) {
    const $summaryText = $wrapper.find(".seamless-events-summary-text");
    if (!$summaryText.length) return;

    const safeVisible = Number.isFinite(visibleCount) ? visibleCount : 0;
    const safeTotal = Number.isFinite(totalEvents) ? totalEvents : 0;
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeTotalPages = Number.isFinite(totalPages) ? totalPages : 0;

    $summaryText.text(
      `Showing events ${safeVisible} of ${safeTotal} - page ${safePage} of ${safeTotalPages}`,
    );
  }

  function getElementorWrapper($wrapper) {
    return $wrapper && $wrapper.length
      ? $wrapper.closest(".seamless-elementor-wrapper")
      : seamlessJquery(".seamless-elementor-wrapper").first();
  }

  function getPaginationType($wrapper) {
    const $elementorWrapper = getElementorWrapper($wrapper);
    const type = $elementorWrapper.data("pagination-type");
    return type ? String(type) : "numbers";
  }

  function getLoadMoreConfig($wrapper) {
    const $elementorWrapper = getElementorWrapper($wrapper);
    const text = $elementorWrapper.data("load-more-text") || "Load More";
    const loadingText =
      $elementorWrapper.data("load-more-loading-text") || "Loading...";
    const showSpinner =
      String($elementorWrapper.data("show-spinner")) === "true";
    const spinnerIconEncoded = $elementorWrapper.data("spinner-icon") || "";
    let spinnerIcon = "";
    if (spinnerIconEncoded) {
      try {
        spinnerIcon = atob(spinnerIconEncoded);
      } catch (e) {
        spinnerIcon = "";
      }
    }

    return { text, loadingText, showSpinner, spinnerIcon };
  }

  function getExcludedSlugs($wrapper, type) {
    const $elementorWrapper = getElementorWrapper($wrapper);
    const raw =
      type === "tag"
        ? $elementorWrapper.data("exclude-tag-slugs")
        : $elementorWrapper.data("exclude-category-slugs");
    if (!raw) return new Set();
    return new Set(
      String(raw)
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean),
    );
  }

  function getCurrentPage($wrapper) {
    const value = parseInt($wrapper.data("current-page"), 10);
    return isNaN(value) ? 1 : value;
  }

  function setCurrentPage($wrapper, page) {
    $wrapper.data("current-page", page);
  }

  function showLoader(container) {
    const loader = $("#Seamlessloader");
    if (container) {
      container.empty(); // Clear previous content
    }
    loader.removeClass("hidden");
  }

  function hideLoader(container) {
    const loader = $("#Seamlessloader");
    loader.addClass("hidden");
  }

  // Function to determine smart default sort based on available events
  function determineSmartDefaultSort(events) {
    if (!events || events.length === 0) {
      return "all";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for upcoming events
    const hasUpcoming = events.some((event) => {
      let eventStartStr;
      if (event.event_type === "group_event") {
        eventStartStr = event.formatted_start_date;
      } else {
        eventStartStr = event.start_date;
      }
      if (!eventStartStr) return false;
      const eventStartDate = new Date(eventStartStr);
      eventStartDate.setHours(0, 0, 0, 0);
      return eventStartDate > today;
    });

    if (hasUpcoming) {
      return "upcoming";
    }

    // Check for current events
    const hasCurrent = events.some((event) => {
      let eventStartStr, eventEndStr;
      if (event.event_type === "group_event") {
        eventStartStr = event.formatted_start_date;
        eventEndStr = event.formatted_end_date;
      } else {
        eventStartStr = event.start_date;
        eventEndStr = event.end_date;
      }
      if (!eventStartStr) return false;
      const eventStartDate = new Date(eventStartStr);
      eventStartDate.setHours(0, 0, 0, 0);
      const eventEndDate = eventEndStr ? new Date(eventEndStr) : eventStartDate;
      eventEndDate.setHours(23, 59, 59, 999);
      return today >= eventStartDate && today <= eventEndDate;
    });

    if (hasCurrent) {
      return "current";
    }

    // Default to "all" if no upcoming or current events
    return "all";
  }

  // Function to load data directly from API on initial load
  async function loadCachedData(view = "list") {
    try {
      // Fetch all events directly from API
      const events = await window.SeamlessAPI.fetchAllEvents();

      // Fetch categories directly from API
      const categoriesResult = await window.SeamlessAPI.getCategories();

      // Structure the data similar to the old cached format
      cachedData = {
        events: events,
        categories: categoriesResult.data || [],
        raw_categories: categoriesResult.data || [],
        cache_timestamp: Date.now(),
        total_events: events.length,
        event_slug: "event", // Default slug
      };

      isDataLoaded = true;

      // Make cached data available globally for calendar
      window.cachedData = cachedData;

      return { success: true, data: cachedData };
    } catch (error) {
      console.error("[Seamless] Error loading data from API:", error);
      isDataLoaded = false;
      return { success: false, error: error.message };
    }
  }

  // Function to filter events locally
  function filterEventsLocally(page = 1, $wrapper = null, options = {}) {
    const $scope = getWrapper($wrapper);
    const elements = getWrapperElements($scope);
    const paginationType = getPaginationType($scope);
    const append = options.append === true;
    const search = (elements.$search.val() || "").toLowerCase();
    const sortBy = elements.$sortBy.val() || "all";
    const view = elements.$currentView.val();
    const selectedYear = elements.$yearFilter.val();

    // Collect all selected category IDs
    // PRIMARY: read directly from window.seamlessNDState (set by initNDSearchbar)
    // This avoids the DOM-sync issue where populateCategoryDropdown empties
    // .seamless-category-dropdowns and destroys our hidden selects.
    const selectedCategories = [];
    if (
      window.seamlessNDState &&
      Array.isArray(window.seamlessNDState.categoryIds)
    ) {
      window.seamlessNDState.categoryIds.forEach((v) => {
        if (v && !selectedCategories.includes(String(v)))
          selectedCategories.push(String(v));
      });
    } else {
      // Fallback: read from DOM cat-select elements (legacy / non-ND path)
      elements.$categoryDropdowns.find(".category-select").each(function () {
        const value = seamlessJquery(this).val();
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v && !selectedCategories.includes(v))
              selectedCategories.push(v);
          });
        } else if (value && !selectedCategories.includes(value)) {
          selectedCategories.push(value);
        }
      });
    }

    // Also check Elementor widget category dropdown (events-widget.js path)
    const elementorCategoryValue = seamlessJquery(
      "#seamless-filter-by-category",
    ).val();
    if (
      elementorCategoryValue &&
      !selectedCategories.includes(elementorCategoryValue)
    ) {
      selectedCategories.push(elementorCategoryValue);
    }

    // Collect selected tag IDs
    // PRIMARY: read from window.seamlessNDState
    const selectedTags = [];
    if (
      window.seamlessNDState &&
      Array.isArray(window.seamlessNDState.tagIds)
    ) {
      window.seamlessNDState.tagIds.forEach((v) => {
        if (v && !selectedTags.includes(String(v)))
          selectedTags.push(String(v));
      });
    } else {
      // Fallback: read from DOM tag-select elements
      elements.$tagDropdowns.find(".tag-select").each(function () {
        const value = seamlessJquery(this).val();
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v && !selectedTags.includes(v)) selectedTags.push(v);
          });
        } else if (value && !selectedTags.includes(value)) {
          selectedTags.push(value);
        }
      });
    }

    // Build a set of associated event IDs to filter out
    const associatedEventIds = new Set();
    cachedData.events.forEach((event) => {
      if (event.event_type === "group_event" && event.associated_events) {
        event.associated_events.forEach((assocEvent) => {
          if (assocEvent.id) {
            associatedEventIds.add(assocEvent.id);
          }
        });
      }
    });

    let filteredEvents = [...cachedData.events].filter((e) => {
      // Filter out non-published events
      if ((e.status || "").toLowerCase() !== "published") {
        return false;
      }
      // Filter out associated events
      if (associatedEventIds.has(e.id)) {
        return false;
      }
      return true;
    });

    // Apply search filter
    if (search) {
      filteredEvents = filteredEvents.filter((event) =>
        event.title.toLowerCase().includes(search),
      );
    }

    // Apply year filter
    if (selectedYear) {
      filteredEvents = filteredEvents.filter((event) => {
        const eventDate =
          event.event_type === "group_event"
            ? event.formatted_start_date
            : event.start_date;
        if (!eventDate) return false;
        const eventYear = new Date(eventDate).getFullYear();
        return eventYear === parseInt(selectedYear);
      });
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filteredEvents = filteredEvents.filter((event) => {
        if (!event.categories || !Array.isArray(event.categories)) {
          return false;
        }
        return selectedCategories.some((catId) =>
          event.categories.some(
            (eventCat) => String(eventCat.id) === String(catId),
          ),
        );
      });
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filteredEvents = filteredEvents.filter((event) => {
        if (!event.tags || !Array.isArray(event.tags)) return false;
        return selectedTags.some((tagId) =>
          event.tags.some(
            (t) =>
              String(t.id) === String(tagId) ||
              String(t.slug) === String(tagId),
          ),
        );
      });
    }

    // Apply sort filter
    if (sortBy !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filteredEvents = filteredEvents.filter((event) => {
        let eventStartStr, eventEndStr;

        if (event.event_type === "group_event") {
          eventStartStr = event.formatted_start_date;
          eventEndStr = event.formatted_end_date;
        } else {
          eventStartStr = event.start_date;
          eventEndStr = event.end_date;
        }

        if (!eventStartStr) return false;

        const eventStartDate = new Date(eventStartStr);
        eventStartDate.setHours(0, 0, 0, 0);

        const eventEndDate = eventEndStr
          ? new Date(eventEndStr)
          : eventStartDate;
        eventEndDate.setHours(23, 59, 59, 999);

        switch (sortBy) {
          case "upcoming":
            return eventStartDate > today;
          case "current":
            return today >= eventStartDate && today <= eventEndDate;
          case "past":
            return eventEndDate < today;
        }
        return false;
      });

      // Apply ordering for sorts: upcoming => ascending by start datetime,
      // past => descending by end datetime (most recent first).
      if (sortBy === "upcoming") {
        filteredEvents.sort((a, b) => {
          const aStart =
            a.event_type === "group_event"
              ? a.formatted_start_date
              : a.start_date;
          const bStart =
            b.event_type === "group_event"
              ? b.formatted_start_date
              : b.start_date;
          const aTime = aStart
            ? new Date(aStart).getTime()
            : Number.POSITIVE_INFINITY;
          const bTime = bStart
            ? new Date(bStart).getTime()
            : Number.POSITIVE_INFINITY;
          return aTime - bTime; // ascending
        });
      } else if (sortBy === "past") {
        filteredEvents.sort((a, b) => {
          const aEnd =
            a.event_type === "group_event"
              ? a.formatted_end_date || a.formatted_start_date
              : a.end_date || a.start_date;
          const bEnd =
            b.event_type === "group_event"
              ? b.formatted_end_date || b.formatted_start_date
              : b.end_date || b.start_date;
          const aTime = aEnd ? new Date(aEnd).getTime() : 0;
          const bTime = bEnd ? new Date(bEnd).getTime() : 0;
          return bTime - aTime; // descending
        });
      }
    } else {
      // For "all" filter, sort chronologically: upcoming first, then current, then past
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filteredEvents.sort((a, b) => {
        // Get start and end dates for both events
        const aStartStr =
          a.event_type === "group_event"
            ? a.formatted_start_date
            : a.start_date;
        const aEndStr =
          a.event_type === "group_event" ? a.formatted_end_date : a.end_date;
        const bStartStr =
          b.event_type === "group_event"
            ? b.formatted_start_date
            : b.start_date;
        const bEndStr =
          b.event_type === "group_event" ? b.formatted_end_date : b.end_date;

        const aStart = aStartStr ? new Date(aStartStr) : null;
        const aEnd = aEndStr ? new Date(aEndStr) : aStart;
        const bStart = bStartStr ? new Date(bStartStr) : null;
        const bEnd = bEndStr ? new Date(bEndStr) : bStart;

        if (!aStart) return 1; // Events without dates go to end
        if (!bStart) return -1;

        aStart.setHours(0, 0, 0, 0);
        if (aEnd) aEnd.setHours(23, 59, 59, 999);
        bStart.setHours(0, 0, 0, 0);
        if (bEnd) bEnd.setHours(23, 59, 59, 999);

        // Determine event status
        const aIsUpcoming = aStart > today;
        const aIsCurrent = !aIsUpcoming && aEnd && aEnd >= today;
        const aIsPast = !aIsUpcoming && !aIsCurrent;

        const bIsUpcoming = bStart > today;
        const bIsCurrent = !bIsUpcoming && bEnd && bEnd >= today;
        const bIsPast = !bIsUpcoming && !bIsCurrent;

        // Priority: upcoming > current > past
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;
        if (aIsCurrent && !bIsCurrent) return -1;
        if (!aIsCurrent && bIsCurrent) return 1;

        // Within same category, sort by start date (ascending for upcoming/current, descending for past)
        if (aIsUpcoming || aIsCurrent) {
          return aStart.getTime() - bStart.getTime(); // ascending
        } else {
          // For past events, sort by end date descending (most recent first)
          const aEndTime = aEnd ? aEnd.getTime() : aStart.getTime();
          const bEndTime = bEnd ? bEnd.getTime() : bStart.getTime();
          return bEndTime - aEndTime; // descending
        }
      });
    }

    // Paginate results
    let perPage = 8;

    // If this event list is rendered inside an Elementor widget,
    // respect the widget's events-per-page setting from the wrapper.
    try {
      if (typeof seamlessJquery !== "undefined") {
        const $elementorWrapper = $scope.closest(".seamless-elementor-wrapper");
        if ($elementorWrapper && $elementorWrapper.length) {
          const widgetPerPage = parseInt(
            $elementorWrapper.data("events-per-page"),
            10,
          );
          if (!isNaN(widgetPerPage) && widgetPerPage > 0) {
            perPage = widgetPerPage;
          }
        }
      }
    } catch (e) {
      // Fallback to default perPage if anything goes wrong
    }

    const totalEvents = filteredEvents.length;
    const totalPages = Math.ceil(totalEvents / perPage);
    const offset = (page - 1) * perPage;
    const paginatedEvents = filteredEvents.slice(offset, offset + perPage);

    // For calendar view, pass all filtered events as rawEvents
    const rawEvents = view === "calendar" ? filteredEvents : [];

    // Generate HTML for the current view
    generateEventHTML(
      paginatedEvents,
      rawEvents,
      view,
      page,
      totalEvents,
      totalPages,
      perPage,
      $scope,
      paginationType,
      append,
    );
  }

  // Function to generate event HTML (moved from server-side)
  function generateEventHTML(
    paginatedEvents,
    rawEvents,
    view,
    page,
    totalEvents,
    totalPages,
    perPage,
    $wrapper,
    paginationType,
    append,
  ) {
    const elements = getWrapperElements($wrapper);
    const $elementorWrapper = getElementorWrapper($wrapper);
    if ($elementorWrapper && $elementorWrapper.length) {
      $elementorWrapper
        .data("total-events", totalEvents)
        .data("total-pages", totalPages)
        .data("current-page", page)
        .data("events-per-page", perPage);
    }

    const visibleEventCount =
      view === "calendar" ? totalEvents : paginatedEvents.length;
    updateEventsSummary(
      $wrapper,
      visibleEventCount,
      totalEvents,
      totalPages,
      page,
    );

    let html = "";

    if (paginatedEvents.length === 0 && view !== "calendar") {
      const sortBy = elements.$sortBy.val();
      let message = "No events found.";
      if (sortBy !== "all") {
        message = `No ${sortBy} events found.`;
      }
      html = `<p class="event-message">${message}</p>`;
    } else {
      // Generate HTML based on view type
      if (view === "grid") {
        html = generateGridViewHTML(paginatedEvents);
      } else if (view === "calendar") {
        html = generateCalendarViewHTML();
      } else {
        html = generateListViewHTML(paginatedEvents);
      }
    }

    // Update the display
    if (view === "calendar") {
      elements.$calendarView.removeClass("hidden");
      elements.$eventList.addClass("hidden");

      // Always update calendar with filtered events if it exists
      if (
        window.seamlessCalendar &&
        typeof window.seamlessCalendar.updateEvents === "function"
      ) {
        window.seamlessCalendar.updateEvents(rawEvents || []);
      } else {
        // Calendar doesn't exist yet, check if we have server-generated calendar HTML
        if (window.cachedData && window.cachedData.calendar_html) {
          // Use server-generated HTML which includes the initialization script
          elements.$calendarView.html(window.cachedData.calendar_html);

          // Wait a bit for calendar to initialize, then update with filtered events
          setTimeout(() => {
            if (
              window.seamlessCalendar &&
              typeof window.seamlessCalendar.updateEvents === "function"
            ) {
              window.seamlessCalendar.updateEvents(rawEvents || []);
            }
          }, 100);
        } else {
          // Fallback to client-side generated HTML
          elements.$calendarView.html(html);

          // Initialize calendar with filtered events
          const eventSlug =
            window.cachedData && window.cachedData.event_slug
              ? window.cachedData.event_slug
              : "event";
          window.seamlessCalendar = new SeamlessCalendar({
            ajaxUrl: seamless_ajax.ajax_url,
            nonce: seamless_ajax.nonce,
            events: rawEvents || [],
            slug: eventSlug,
            wrapper: $wrapper,
          });
        }
      }
    } else {
      if (append) {
        if (view === "grid") {
          const $currentGrid = elements.$eventList.find(".event-grid");
          if ($currentGrid.length) {
            const $temp = seamlessJquery("<div></div>").html(html);
            const $newItems = $temp.find(".event-grid").children();
            $currentGrid.append($newItems);
          } else {
            elements.$eventList.html(html).removeClass("hidden");
          }
        } else {
          elements.$eventList.append(html).removeClass("hidden");
        }
      } else {
        elements.$eventList.html(html).removeClass("hidden");
      }
      elements.$calendarView.addClass("hidden");
    }

    // Generate and update pagination (hide for calendar view)
    if (view === "calendar") {
      elements.$pagination.html("").addClass("hidden");
    } else {
      if (paginationType === "load_more") {
        const config = getLoadMoreConfig($wrapper);
        if (page < totalPages) {
          const spinnerHtml =
            config.showSpinner && config.spinnerIcon
              ? `<span class="seamless-spinner">${config.spinnerIcon}</span>`
              : "";
          const buttonHtml = `<button class="seamless-load-more-btn" data-next-page="${page + 1}">${spinnerHtml}${config.text}</button>`;
          elements.$pagination.html(buttonHtml).removeClass("hidden");
        } else {
          elements.$pagination.html("").addClass("hidden");
        }
      } else {
        const pagination = generatePaginationHTML(
          page,
          totalEvents,
          totalPages,
          perPage,
        );
        if (pagination) {
          elements.$pagination.html(pagination).removeClass("hidden");
        } else {
          elements.$pagination.html("").addClass("hidden");
        }
      }
    }
  }

  // Helper functions to generate HTML for different views
  function generateListViewHTML(events) {
    const layout = seamless_ajax.list_view_layout || "option_1";

    if (layout === "option_2") {
      let lastDateString = ""; // Track date for grouping

      return events
        .map((event) => {
          // Skip group events without associated events
          if (
            event.event_type === "group_event" &&
            (!event.associated_events || event.associated_events.length === 0)
          ) {
            return "";
          }

          const image =
            event.featured_image ||
            "/wp-content/plugins/seamless-wordpress-plugin/src/Public/img/default.png";
          const eventType = event.event_type || "event";
          const title = event.title || "";

          // Handle start/end date
          let startDate, endDate;
          let timeZone = "America/Chicago";

          if (eventType === "group_event") {
            startDate = event.formatted_start_date || "";
            endDate = event.formatted_end_date || "";
          } else {
            startDate = event.start_date || "";
            endDate = event.end_date || "";
          }

          const { dateDisplay, timeDisplay, timezoneAbbr } =
            buildEventDateTimeDisplay(startDate, endDate, timeZone, eventType);

          // Helper for location text similar to previous step
          let locationText = "";
          if (event.venue) {
            const v = event.venue;
            const parts = [];
            if (v.city) parts.push(v.city);
            if (v.state) parts.push(v.state);
            if (v.country && v.country !== "US") parts.push(v.country);
            if (parts.length > 0) locationText = parts.join(", ");
            else if (v.address) locationText = v.address;
          }
          if (
            !locationText &&
            (event.virtual_meeting_link ||
              (event.associated_events &&
                event.associated_events[0] &&
                event.associated_events[0].venue))
          ) {
            if (
              event.event_type === "group_event" &&
              event.associated_events &&
              event.associated_events[0] &&
              event.associated_events[0].venue
            ) {
              const v = event.associated_events[0].venue;
              const parts = [];
              if (v.city) parts.push(v.city);
              if (v.state) parts.push(v.state);
              if (parts.length > 0) locationText = parts.join(", ");
            }
            if (!locationText && event.virtual_meeting_link)
              locationText = "Online";
          }
          if (!locationText) locationText = "TBD";

          const slug =
            window.cachedData && window.cachedData.event_slug
              ? window.cachedData.event_slug
              : "event";
          const detailsUrl = `${window.location.origin}/${slug}/${event.slug}`;

          let dateObj = new Date(startDate);
          // Standardize date string for comparison (YYYY-MM-DD)
          const dateStringKey = dateObj.toLocaleDateString("en-CA"); // YYYY-MM-DD format

          // Display parts
          const monthShort = dateObj.toLocaleDateString("en-US", {
            month: "short",
          });
          const dayNumeric = dateObj.getDate();
          const yearNumeric = dateObj.getFullYear();
          const weekday = dateObj.toLocaleDateString("en-US", {
            weekday: "long",
          });

          // Check if same day as previous iteration
          const isSameDay = dateStringKey === lastDateString;
          lastDateString = dateStringKey;

          // Multi-day check
          let multiDayStr = "";
          if (startDate && endDate) {
            const startD = new Date(startDate);
            const endD = new Date(endDate);
            // Check if different days
            if (startD.toDateString() !== endD.toDateString()) {
              const sMonth = startD.toLocaleDateString("en-US", {
                month: "short",
              });
              const sDay = startD.getDate();
              const eMonth = endD.toLocaleDateString("en-US", {
                month: "short",
              });
              const eDay = endD.getDate();
              const sYear = startD.getFullYear();
              const eYear = endD.getFullYear();

              if (sYear !== eYear) {
                multiDayStr = `${sMonth} ${sDay}, ${sYear} – ${eMonth} ${eDay}, ${eYear}`;
              } else {
                // Same year - "Sep 3 – Sep 6, 2024" format requested
                multiDayStr = `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${sYear}`;
              }
            }
          }

          const clockIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-clock"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
          const locIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-map-pin"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
          const calendarIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

          return `
            <div class="event-item-modern ${isSameDay ? "is-same-day" : ""}">
              <div class="event-timeline">
                 <div class="timeline-date-group">
                    <span class="timeline-date-main">${monthShort} ${dayNumeric}, ${yearNumeric}</span>
                    <span class="timeline-weekday">${weekday}</span>
                 </div>
                 <div class="timeline-dot"></div>
              </div>
              <div class="event-card-modern">
                 <div class="event-card-body">
                    <div class="event-info-section">
                        <h3 class="event-title"><a href="${detailsUrl}">${escapeHtml(
                          title,
                        )}</a></h3>
                        
                        <div class="event-meta-data">
                        ${
                          multiDayStr
                            ? `
                        <div class="event-meta-multi-date">
                           ${calendarIcon} <span>${multiDayStr}</span>
                        </div>`
                            : ""
                        }
                        
                        <div class="event-meta-time">
                           ${clockIcon} <span>${
                             timeDisplay
                               ? escapeHtml(
                                   timeDisplay +
                                     (timezoneAbbr ? " " + timezoneAbbr : ""),
                                 )
                               : "All Day"
                           }</span>
                        </div>
                        
                        <div class="event-location-row">
                            ${locIcon} <span>${escapeHtml(locationText)}</span>
                        </div>
                        </div>
                         
                         ${
                           // Handle both field names: except_description (regular events) and excerpt_description (group events)
                           event.excerpt_description || event.except_description
                             ? `<div class="event-excerpt">${escapeHtml(
                                 event.excerpt_description ||
                                   event.except_description,
                               )}</div>`
                             : ""
                         }
                          
                        <div class="event-action-row">
                             <a href="${detailsUrl}" class="view-event-btn">View Event <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>
                        </div>
                    </div>
                    <div class="event-image-section">
                         <img src="${image}" alt="${escapeHtml(
                           title,
                         )}" onload="imageLoaded(this)" />
                    </div>
                 </div>
              </div>
            </div>
           `;
        })
        .join("");
    }

    // Default (Option 1)
    return events
      .map((event) => {
        // Skip group events without associated events
        if (
          event.event_type === "group_event" &&
          (!event.associated_events || event.associated_events.length === 0)
        ) {
          return "";
        }

        const image =
          event.featured_image ||
          "/wp-content/plugins/seamless-wordpress-plugin/src/Public/img/default.png";
        const eventType = event.event_type || "event";
        const title = event.title || "";
        const description = event.description || "";

        // Handle start/end date for both event and group_event
        let startDate, endDate;
        let timeZone = "America/Chicago";

        if (eventType === "group_event") {
          startDate = event.formatted_start_date || "";
          endDate = event.formatted_end_date || "";
        } else {
          startDate = event.start_date || "";
          endDate = event.end_date || "";
        }

        const { dateDisplay, timeDisplay, timezoneAbbr } =
          buildEventDateTimeDisplay(startDate, endDate, timeZone, eventType);

        const locationHtml = buildEventLocationDisplay(event);

        const slug =
          window.cachedData && window.cachedData.event_slug
            ? window.cachedData.event_slug
            : "event";
        const detailsUrl = `${window.location.origin}/${slug}/${event.slug}`;

        return `
        <div class="event-item">
          <div class="image-container">
            <div class="loader"></div>
            <img src="${image}" alt="Event Logo" class="event-image" style="display:none;" onload="imageLoaded(this)" />
          </div>
          <div class="event-details">
            <h3 class="event-title"><a href="${detailsUrl}" class="event-title-link">${escapeHtml(
              title,
            )}</a></h3>
            <div class="event-time">
              <div class="event-time-loc">
                <p class="event-date">
                  ${dateDisplay ? escapeHtml(dateDisplay) : "-"}
                </p>
              </div>
              <div class="event-time-loc">
                <p class="event-time-range">
                  ${
                    timeDisplay
                      ? escapeHtml(
                          `${timeDisplay}${
                            timezoneAbbr ? " " + timezoneAbbr : ""
                          }`,
                        )
                      : "-"
                  }
                </p>
              </div>
              <div class="event-time-loc">
                <p class="event-location">${locationHtml}</p>
              </div>
            </div>
            ${
              event.except_description
                ? `<div class="event-description"
            >${escapeHtml(event.except_description)}</div>`
                : ""
            }
            <a href="${detailsUrl}" class="event-link">SEE DETAILS</a>
          </div>
        </div>
      `;
      })
      .join("");
  }

  function generateGridViewHTML(events) {
    return `
      <div class="event-grid">
        ${events
          .map((event) => {
            // Skip group events without associated events
            if (
              event.event_type === "group_event" &&
              (!event.associated_events || event.associated_events.length === 0)
            ) {
              return "";
            }

            const image =
              event.featured_image ||
              "/wp-content/plugins/seamless-wordpress-plugin/src/Public/img/default.png";
            const eventType = event.event_type || "event";

            // Handle start/end date for both event and group_event
            let startDate, endDate;
            let timeZone = "America/Chicago";

            if (eventType === "group_event") {
              startDate = event.formatted_start_date || "";
              endDate = event.formatted_end_date || "";
            } else {
              startDate = event.start_date || "";
              endDate = event.end_date || "";
            }

            const { dateDisplay, timeDisplay, timezoneAbbr } =
              buildEventDateTimeDisplay(
                startDate,
                endDate,
                timeZone,
                eventType,
              );

            // Location display (uses venue + virtual_meeting_link with Online fallback)
            const locationHtml = buildEventLocationDisplay(event);

            const slug = "event"; // This should match your endpoint setting
            const detailsUrl = `${window.location.origin}/${slug}/${event.slug}`;

            return `
            <div class="event-card">
              <a href="${detailsUrl}" class="event-link">
                <div class="image-container">
                  <div class="loader"></div>
                  <img src="${image}" alt="${escapeHtml(
                    event.title,
                  )}" class="event-image" style="display:none;" onload="imageLoaded(this)">
                </div>
              </a>
              <div class="event-details">
                <h3 class="event-title"><a href="${detailsUrl}" class="event-title-link">${escapeHtml(
                  event.title,
                )}</a></h3>
                <div class="event-time-details">
                  <div class="event-time-loc">
                    <p class="event-date">
                      ${dateDisplay ? escapeHtml(dateDisplay) : "-"}
                    </p>
                  </div>
                  <div class="event-time-loc">
                    <p class="event-time-range">
                      ${
                        timeDisplay
                          ? escapeHtml(
                              `${timeDisplay}${
                                timezoneAbbr ? " " + timezoneAbbr : ""
                              }`,
                            )
                          : "-"
                      }
                    </p>
                  </div>
                </div>
                <a href="${detailsUrl}" class="event-link">SEE DETAILS</a>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  }

  function generateCalendarViewHTML() {
    // Generate calendar HTML template for cached data path
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-based

    const monthAbbrs = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    const fullMonthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const dateRange = `${firstDay.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} \u2014 ${lastDay.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    // Month dropdown (trigger + flyout menu)
    const FULL_MONTHS_LIST = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthItems = FULL_MONTHS_LIST.map((name, i) => {
      const isActive = i === currentMonth;
      return `<li class="cal-month-item${isActive ? " active" : ""}" data-month="${i}" role="option" aria-selected="${isActive}">
        <span>${name}</span>
        <svg class="cal-month-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </li>`;
    }).join("");

    return `
      <div class="seamless-calendar-container">
        <div class="calendar-header">
          <div class="calendar-title">
            <div class="date-info">
              <div class="month-abbr" id="currentMonth">${monthAbbrs[currentMonth]}</div>
              <div class="day-number" id="currentDay">${today.getDate()}</div>
            </div>
            <div>
              <div class="calendar-title-dropdowns" id="calendarTitleDropdowns">
                <div class="cal-month-drop-wrap" id="calMonthDropWrap">
                  <button class="cal-month-trigger" id="calMonthTrigger" type="button"
                    aria-haspopup="listbox" aria-expanded="false" aria-controls="calMonthMenu">
                    <span id="calMonthLabel">${fullMonthNames[currentMonth]}</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.35753 11.9939 7.64245 11.9939 7.81819 11.8182L10.0682 9.56819Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                  </button>
                  <ul class="cal-month-menu" id="calMonthMenu" role="listbox" aria-label="Select month">
                    ${monthItems}
                  </ul>
                </div>
                <div class="cal-year-spinner" id="calendarYearSpinner" aria-label="Year">
                <button class="cys-btn" id="calYearDown" aria-label="Previous year"><i class="fas fa-chevron-left"></i></button>
                <span class="cys-year" id="calendarYearLabel">${currentYear}</span>
                <button class="cys-btn" id="calYearUp" aria-label="Next year"><i class="fas fa-chevron-right"></i></button>
                </div>
              </div>
              <div class="date-range" id="dateRange">${dateRange}</div>
            </div>
          </div>

          <div class="calendar-controls">
            <div class="display-list-view">
              <button class="view-button display-list-btn" id="displayListBtn" title="Display List" aria-label="Toggle list view">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            </div>
            <div class="calendar-navigation">
              <button class="nav-button" id="prevBtn" title="Previous" aria-label="Previous">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button class="nav-button today-button" id="todayBtn" title="Today" aria-label="Today">Today</button>
              <button class="nav-button" id="nextBtn" title="Next" aria-label="Next">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>

            <div class="view-selector">
              <button class="view-button active" data-view="month" title="Month View" aria-label="Month View"><svg width="25" height="25" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="12" width="48" height="44" rx="4"></rect><line x1="8" y1="22" x2="56" y2="22"></line><circle cx="18" cy="32" r="2"></circle><circle cx="32" cy="32" r="2"></circle><circle cx="46" cy="32" r="2"></circle><circle cx="18" cy="44" r="2"></circle><circle cx="32" cy="44" r="2"></circle><circle cx="46" cy="44" r="2"></circle><line x1="20" y1="8" x2="20" y2="16"></line></svg></button>
              <button class="view-button week-view" data-view="week" title="Week View" aria-label="Week View"><svg width="25" height="25" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="12" width="48" height="44" rx="4" /><line x1="8" y1="22" x2="56" y2="22" /><line x1="16" y1="32" x2="48" y2="32" /><line x1="16" y1="40" x2="48" y2="40" /><line x1="16" y1="48" x2="40" y2="48" /><line x1="20" y1="8" x2="20" y2="16" /><line x1="44" y1="8" x2="44" y2="16" /></svg></button>
              <button class="view-button" data-view="day" title="Day View" aria-label="Day View"><svg width="25" height="25" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="12" width="48" height="44" rx="4" /><line x1="8" y1="22" x2="56" y2="22" /><text x="32" y="45" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="currentColor">DAY</text><line x1="20" y1="8" x2="20" y2="16" /><line x1="44" y1="8" x2="44" y2="16" /></svg></button>
              <button class="view-button year-view" data-view="year" title="Year View" aria-label="Year View"><svg width="18" height="18" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="24" height="24" rx="3" /><rect x="36" y="4" width="24" height="24" rx="3" /><rect x="4" y="36" width="24" height="24" rx="3" /><rect x="36" y="36" width="24" height="24" rx="3" /></svg></button>
            </div>
          </div>
        </div>

        <div id="seamlessCalendar"></div>
        <div id="seamlessYearView" class="seamless-year-view" style="display:none;"></div>
        <div id="seamlessListView" class="seamless-list-view" style="display:none;"></div>
      </div>
    `;
  }
  // Helper functions for date formatting and HTML escaping
  // Helper function to parse human-readable date format from API
  // Handles formats like "Mar 04, 2026 12:00 PM"
  function parseHumanReadableDate(dateStr) {
    if (!dateStr) return null;

    // Try to parse as-is first (works for formats like "Mar 04, 2026 12:00 PM")
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // If that fails, try to parse manually
    // Format: "MMM DD, YYYY HH:MM AM/PM"
    const match = dateStr.match(
      /(\w+)\s+(\d+),\s+(\d+)\s+(\d+):(\d+)\s+(AM|PM)/i,
    );
    if (match) {
      const [, month, day, year, hours, minutes, ampm] = match;
      const monthMap = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };

      let hour = parseInt(hours, 10);
      if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
      if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;

      return new Date(
        parseInt(year, 10),
        monthMap[month],
        parseInt(day, 10),
        hour,
        parseInt(minutes, 10),
      );
    }

    return null;
  }

  function buildEventDateTimeDisplay(
    startDateStr,
    endDateStr,
    timeZone = undefined,
    eventType = "event",
  ) {
    if (!startDateStr) {
      return { dateDisplay: "", timeDisplay: "", timezoneAbbr: "" };
    }

    let startDt, endDt;

    try {
      // Parse the human-readable date format from the API
      startDt = parseHumanReadableDate(startDateStr);
      if (endDateStr) {
        endDt = parseHumanReadableDate(endDateStr);
      }

      // If parsing failed, return empty values
      if (!startDt || isNaN(startDt.getTime())) {
        console.warn("Failed to parse start date:", startDateStr);
        return { dateDisplay: "", timeDisplay: "", timezoneAbbr: "" };
      }
    } catch (e) {
      console.error("Error parsing dates:", e, { startDateStr, endDateStr });
      return { dateDisplay: "", timeDisplay: "", timezoneAbbr: "" };
    }

    if (isNaN(startDt.getTime())) {
      return { dateDisplay: "", timeDisplay: "", timezoneAbbr: "" };
    }

    // Format times
    const formatTime = (dt) => {
      let hours = dt.getHours();
      const minutes = dt.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? "0" + minutes : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    };

    const startTime = formatTime(startDt);
    let endTime = "";
    if (endDt && !isNaN(endDt.getTime())) {
      endTime = formatTime(endDt);
    }

    // Get timezone abbreviation (CST/CDT)
    const timezoneAbbr = startDt
      .toLocaleTimeString("en-US", {
        timeZone: "America/Chicago",
        timeZoneName: "short",
      })
      .split(" ")
      .pop();

    // Build date display
    let dateDisplay = "";

    if (endDt && !isNaN(endDt.getTime())) {
      const sameDay =
        startDt.getFullYear() === endDt.getFullYear() &&
        startDt.getMonth() === endDt.getMonth() &&
        startDt.getDate() === endDt.getDate();

      const sameMonthYear =
        startDt.getFullYear() === endDt.getFullYear() &&
        startDt.getMonth() === endDt.getMonth();

      const sameYear = startDt.getFullYear() === endDt.getFullYear();

      const weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const startWeekday = weekdays[startDt.getDay()];
      const endWeekday = weekdays[endDt.getDay()];
      const startMonth = months[startDt.getMonth()];
      const endMonth = months[endDt.getMonth()];
      const startDayNum = startDt.getDate();
      const endDayNum = endDt.getDate();
      const startYear = startDt.getFullYear();
      const endYear = endDt.getFullYear();

      if (sameDay) {
        dateDisplay = `${startWeekday}, ${startMonth} ${startDayNum}, ${startYear}`;
      } else if (sameMonthYear) {
        dateDisplay = `${startWeekday} - ${endWeekday}, ${startMonth} ${startDayNum} - ${endDayNum}, ${startYear}`;
      } else if (sameYear) {
        dateDisplay = `${startWeekday} - ${endWeekday}, ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}, ${startYear}`;
      } else {
        dateDisplay = `${startWeekday}, ${startMonth} ${startDayNum}, ${startYear} - ${endWeekday}, ${endMonth} ${endDayNum}, ${endYear}`;
      }
    } else {
      // Single date
      const weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      dateDisplay = `${weekdays[startDt.getDay()]}, ${
        months[startDt.getMonth()]
      } ${startDt.getDate()}, ${startDt.getFullYear()}`;
    }

    let timeDisplay = "";
    if (startTime && endTime) {
      timeDisplay = `${startTime} – ${endTime}`;
    } else if (startTime) {
      timeDisplay = startTime;
    }

    return { dateDisplay, timeDisplay, timezoneAbbr };
  }

  function buildEventLocationDisplay(event) {
    // Extract venue from associated_events for group events
    const venue =
      event.event_type === "group_event" && event.associated_events?.[0]?.venue
        ? event.associated_events[0].venue
        : event.venue || {};

    const mainParts = [];
    if (venue.name) mainParts.push(venue.name);
    // if (venue.address_line_1) mainParts.push(venue.address_line_1);
    else if (venue.address) mainParts.push(venue.address);

    // City and state will be shown together in parentheses
    const city = venue.city || "";
    const state = venue.state || "";
    const zip = venue.zip_code || "";

    let venueLocation = mainParts.join(", ");

    const cityState = [city, state].filter(Boolean).join(", ");
    if (cityState) {
      venueLocation += (venueLocation ? " " : "") + `(${cityState})`;
    }
    if (zip) {
      venueLocation += (venueLocation ? " " : "") + zip;
    }

    const virtualLink = event.virtual_meeting_link || "";

    // Always show a location. For events that are online-only (no venueLocation)
    // do NOT make the location clickable — show plain text "Online".
    if (venueLocation && virtualLink) {
      return escapeHtml(venueLocation) + " + Online";
    } else if (venueLocation) {
      return escapeHtml(venueLocation);
    } else if (virtualLink) {
      return "Online";
    }

    return "Online";
  }

  // Helper functions for date formatting and HTML escaping
  function formatDate(dateString, format) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const options = {
      weekday: format.includes("l") ? "long" : undefined,
      year: format.includes("Y") ? "numeric" : undefined,
      month: format.includes("F")
        ? "long"
        : format.includes("M")
          ? "short"
          : "numeric",
      day: format.includes("j") ? "numeric" : "2-digit",
      hour: format.includes("h")
        ? "numeric"
        : format.includes("H")
          ? "2-digit"
          : undefined,
      minute: format.includes("i") ? "2-digit" : undefined,
      hour12: format.includes("A") ? true : false,
    };

    return date.toLocaleDateString("en-US", options);
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Helper function to strip HTML tags from text
  function stripHtml(html) {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  // Helper function to extract time from a date string
  function extractTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Helper function to extract time from formatted date string like "Oct 30, 2025 6:00 PM"
  function extractTimeFromFormatted(formattedDate) {
    if (!formattedDate) return "";
    // Match time pattern like "6:00 PM" or "10:30 AM"
    const timeMatch = formattedDate.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
    return timeMatch ? timeMatch[1] : "";
  }

  // Global function for image loading (needed for generated HTML)
  window.imageLoaded = function (img) {
    if (!img) return; // Guard against null/undefined
    img.style.display = "block";
    const loader = img.previousElementSibling;
    if (loader && loader.classList.contains("loader")) {
      loader.style.display = "none";
    }
  };

  function generatePaginationHTML(page, totalEvents, totalPages, perPage) {
    if (totalEvents <= perPage) {
      return "";
    }

    let html = '<div class="seamless-pagination">';

    if (page > 1) {
      html += `<button class="seamless-page-link seamless-prev seamless-btn" data-page="${
        page - 1
      }">« Previous</button>`;
    }

    const visibleRange = 2;
    const start = Math.max(2, page - visibleRange);
    const end = Math.min(totalPages - 1, page + visibleRange);

    html += renderPageButton(1, page);

    if (start > 2) {
      html += '<span class="seamless-ellipsis">...</span>';
    }

    for (let i = start; i <= end; i++) {
      html += renderPageButton(i, page);
    }

    if (end < totalPages - 1) {
      html += '<span class="seamless-ellipsis">...</span>';
    }

    if (totalPages > 1) {
      html += renderPageButton(totalPages, page);
    }

    if (page < totalPages) {
      html += `<button class="seamless-page-link seamless-next seamless-btn" data-page="${
        page + 1
      }">Next »</button>`;
    }

    html += "</div>";
    return html;
  }

  function renderPageButton(pageNum, currentPage) {
    const isActive = pageNum === currentPage;
    const classes = isActive ? "seamless-btn seamless-active" : "seamless-btn";
    return `<button class="seamless-page-link ${classes}" data-page="${pageNum}">${pageNum}</button>`;
  }

  function fetchEvents(page = 1, isInitialLoad = false, $wrapper = null) {
    const $scope = getWrapper($wrapper);
    const elements = getWrapperElements($scope);
    // If we have cached data, use local filtering
    if (isDataLoaded && cachedData.events.length > 0) {
      setCurrentPage($scope, page);
      filterEventsLocally(page, $scope);
      return;
    }

    // Use API client to fetch events instead of AJAX
    if (!isInitialLoad) {
      elements.$detailsLoader.show();
      elements.$eventList
        .add(elements.$calendarView)
        .add(elements.$pagination)
        .css("opacity", "0.2");
    }

    // Load data from API if not already loaded
    loadCachedData()
      .then(() => {
        // After loading, filter and display
        setCurrentPage($scope, page);
        filterEventsLocally(page, $scope);

        if (!isInitialLoad) {
          elements.$detailsLoader.hide();
          elements.$eventList
            .add(elements.$calendarView)
            .add(elements.$pagination)
            .css("opacity", "1");
        }
      })
      .catch((error) => {
        console.error("Error loading events from API:", error);

        const sortBy = elements.$sortBy.val();
        let message = "No events found.";
        if (sortBy !== "upcoming") {
          message = `No ${sortBy} events found.`;
        }

        elements.$eventList
          .html(`<p class="event-message">${message}</p>`)
          .removeClass("hidden");
        elements.$calendarView.addClass("hidden");
        elements.$pagination.html("").addClass("hidden");

        if (!isInitialLoad) {
          elements.$detailsLoader.hide();
          elements.$eventList
            .add(elements.$calendarView)
            .add(elements.$pagination)
            .css("opacity", "1");
        }
      });
  }

  // View toggle
  seamlessJquery(document).on(
    "click",
    ".seamless-event-wrapper .view-toggle",
    function () {
      const $wrapper = getWrapper(seamlessJquery(this));
      const elements = getWrapperElements($wrapper);
      const view = seamlessJquery(this).data("view");

      elements.$currentView.val(view);
      $wrapper.find(".view-toggle").removeClass("active");
      seamlessJquery(this).addClass("active");
      setCurrentPage($wrapper, 1);

      // Show loader when switching tabs
      elements.$detailsLoader.show();
      elements.$eventList
        .add(elements.$calendarView)
        .add(elements.$pagination)
        .css("opacity", "0.4");

      // Use setTimeout to ensure loader is visible before processing
      setTimeout(() => {
        // If switching to calendar view and using cached data, reload with calendar HTML
        if (view === "calendar" && isDataLoaded && !cachedData.calendar_html) {
          loadCachedData("calendar").then(() => {
            filterEventsLocally(1, $wrapper);
            elements.$detailsLoader.hide();
            elements.$eventList
              .add(elements.$calendarView)
              .add(elements.$pagination)
              .css("opacity", "1");
          });
        } else if (isDataLoaded && cachedData.events.length > 0) {
          filterEventsLocally(1, $wrapper);
          elements.$detailsLoader.hide();
          elements.$eventList
            .add(elements.$calendarView)
            .add(elements.$pagination)
            .css("opacity", "1");
        } else {
          fetchEvents(1, false, $wrapper);
        }
      }, 50);
    },
  );

  seamlessJquery(document).on(
    "keyup input",
    ".seamless-event-wrapper .seamless-search-input",
    function () {
      const $wrapper = getWrapper(seamlessJquery(this));
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        setCurrentPage($wrapper, 1);
        if (isDataLoaded && cachedData.events.length > 0) {
          filterEventsLocally(1, $wrapper);
        } else {
          fetchEvents(1, false, $wrapper);
        }
      }, typingDelay);
    },
  );

  seamlessJquery(document).on(
    "change",
    ".seamless-event-wrapper .seamless-sort-select",
    function () {
      const $wrapper = getWrapper(seamlessJquery(this));
      setCurrentPage($wrapper, 1);
      if (isDataLoaded && cachedData.events.length > 0) {
        filterEventsLocally(1, $wrapper);
      } else {
        fetchEvents(1, false, $wrapper);
      }
    },
  );

  // Expose global trigger function for external filtering (Elementor widgets)
  window.seamlessTriggerFilter = function (target) {
    const $targets = target
      ? getWrapper(seamlessJquery(target))
      : seamlessJquery(".seamless-event-wrapper");

    const $wrappers = $targets.length
      ? $targets
      : seamlessJquery(".seamless-event-wrapper");

    $wrappers.each(function () {
      const $wrapper = seamlessJquery(this);
      setCurrentPage($wrapper, 1);
      if (isDataLoaded && cachedData.events.length > 0) {
        filterEventsLocally(1, $wrapper);
      } else {
        fetchEvents(1, false, $wrapper);
      }
    });
  };

  // Category filter change events are now handled in populateCategoryDropdown()

  seamlessJquery(document).on(
    "click",
    ".seamless-event-wrapper .seamless-page-link",
    function (e) {
      e.preventDefault();
      const $wrapper = getWrapper(seamlessJquery(this));
      const page = parseInt(seamlessJquery(this).data("page"));
      const currentPage = getCurrentPage($wrapper);

      if (page && page !== currentPage) {
        setCurrentPage($wrapper, page);
        if (isDataLoaded && cachedData.events.length > 0) {
          filterEventsLocally(page, $wrapper);
        } else {
          fetchEvents(page, false, $wrapper);
        }

        const $eventList = getWrapperElements($wrapper).$eventList;
        if ($eventList.length) {
          seamlessJquery("html, body").animate(
            {
              scrollTop: $eventList.offset().top - 100,
            },
            300,
          );
        }
      }
    },
  );

  seamlessJquery(document).on(
    "click",
    ".seamless-event-wrapper .seamless-load-more-btn",
    function (e) {
      e.preventDefault();
      const $wrapper = getWrapper(seamlessJquery(this));
      const elements = getWrapperElements($wrapper);
      const config = getLoadMoreConfig($wrapper);
      const nextPage = getCurrentPage($wrapper) + 1;

      const loadingSpinnerHtml =
        config.showSpinner && config.spinnerIcon
          ? `<span class="seamless-spinner">${config.spinnerIcon}</span>`
          : "";
      seamlessJquery(this).prop("disabled", true).addClass("is-loading");
      seamlessJquery(this).html(loadingSpinnerHtml + config.loadingText);

      setCurrentPage($wrapper, nextPage);
      if (isDataLoaded && cachedData.events.length > 0) {
        filterEventsLocally(nextPage, $wrapper, { append: true });
      } else {
        fetchEvents(nextPage, false, $wrapper);
      }

      elements.$detailsLoader.show();
      elements.$eventList
        .add(elements.$calendarView)
        .add(elements.$pagination)
        .css("opacity", "0.6");

      setTimeout(() => {
        elements.$detailsLoader.hide();
        elements.$eventList
          .add(elements.$calendarView)
          .add(elements.$pagination)
          .css("opacity", "1");
      }, 100);
    },
  );

  seamlessJquery(document).on(
    "click",
    ".seamless-event-wrapper .seamless-reset-button",
    function (e) {
      e.preventDefault();
      const $wrapper = getWrapper(seamlessJquery(this));
      const elements = getWrapperElements($wrapper);

      elements.$search.val("");
      elements.$yearFilter.val("");
      // Reset all category dropdowns
      elements.$categoryDropdowns.find(".category-select").val("");
      // Reset tag dropdowns
      elements.$tagDropdowns.find(".tag-select").val("");
      // Reset Elementor filter dropdowns
      seamlessJquery("#seamless-filter-by-category").val("");
      seamlessJquery("#seamless-filter-by-tag").val("");
      // Notify the ND searchbar UI to clear its state
      seamlessJquery(document).trigger("seamless:nd:reset");

      // Check if we're in an Elementor widget context with a specific default view
      const $elementorWrapper = $wrapper.closest(".seamless-elementor-wrapper");
      const isElementorWidget = $elementorWrapper.length > 0;
      let resetView = "list"; // default

      if (isElementorWidget) {
        const defaultView = $elementorWrapper.data("default-view");
        if (defaultView && defaultView !== "all") {
          resetView = defaultView;
        }
      }

      // Set the view
      elements.$currentView.val(resetView);
      $wrapper.find(".view-toggle").removeClass("active");
      $wrapper
        .find('.view-toggle[data-view="' + resetView + '"]')
        .addClass("active");

      // Determine smart default sort based on available events
      if (isElementorWidget) {
        elements.$sortBy.val("all");
      } else if (isDataLoaded && cachedData.events.length > 0) {
        const smartDefault = determineSmartDefaultSort(cachedData.events);
        elements.$sortBy.val(smartDefault);
      } else {
        elements.$sortBy.val("upcoming");
      }

      setCurrentPage($wrapper, 1);
      if (isDataLoaded && cachedData.events.length > 0) {
        filterEventsLocally(1, $wrapper);
      } else {
        fetchEvents(1, false, $wrapper);
      }
    },
  );

  // Fetch and populate categories
  function fetchCategories($wrapper) {
    seamlessJquery.ajax({
      url: seamless_ajax.ajax_url,
      method: "GET",
      data: {
        action: "get_seamless_categories",
        nonce: seamless_ajax.nonce,
      },
      success: function (res) {
        if (res.success && res.data.categories) {
          populateCategoryDropdown(res.data.categories, $wrapper);
          // Initial content is ready, show it
          $wrapper.find(".loader-container").hide();
          $wrapper.find(".seamless-main-content").show();
        }
      },
      error: function (xhr, status, error) {
        console.error("Error loading categories:", error);
        // Even if categories fail, hide loader and show content
        $wrapper.find(".loader-container").hide();
        $wrapper.find(".seamless-main-content").show();
      },
    });
  }

  function populateCategoryDropdown(categories, $wrapper) {
    const elements = getWrapperElements($wrapper);
    const container = elements.$categoryDropdowns;
    const excludeSlugs = getExcludedSlugs($wrapper, "category");
    container.empty(); // Clear existing dropdowns

    // Create a dropdown for each parent category
    categories.forEach((parentCategory) => {
      if (excludeSlugs.has(parentCategory.slug)) {
        return;
      }
      if (parentCategory.children && parentCategory.children.length > 0) {
        // Create dropdown for this parent category
        const dropdown = seamlessJquery("<select></select>")
          .addClass("category-select")
          .attr("data-parent-id", parentCategory.id)
          .attr("data-parent-slug", parentCategory.slug);

        // Add parent category name as default option (without 'All' prefix)
        dropdown.append(
          seamlessJquery("<option></option>")
            .val("")
            .text(parentCategory.label || parentCategory.name),
        );

        // Add children as options
        parentCategory.children.forEach((child) => {
          if (excludeSlugs.has(child.slug)) {
            return;
          }
          dropdown.append(
            seamlessJquery("<option></option>")
              .val(child.id)
              .text(child.label || child.name),
          );
        });

        // Add change event listener
        dropdown.on("change", function () {
          setCurrentPage($wrapper, 1);
          if (isDataLoaded && cachedData.events.length > 0) {
            filterEventsLocally(1, $wrapper);
          } else {
            fetchEvents(1, false, $wrapper);
          }
        });

        container.append(dropdown);
      }
    });
  }

  function populateYearFilter(events, $wrapper) {
    const elements = getWrapperElements($wrapper);
    const yearFilter = elements.$yearFilter;
    const years = new Set();

    // Extract unique years from events
    events.forEach((event) => {
      if (event.start_date) {
        const year = new Date(event.start_date).getFullYear();
        if (!isNaN(year)) {
          years.add(year);
        }
      }
    });

    // Sort years in descending order
    const sortedYears = Array.from(years).sort((a, b) => b - a);

    // Clear existing options except "All Years"
    yearFilter.find("option:not(:first)").remove();

    // Add year options
    sortedYears.forEach((year) => {
      yearFilter.append(
        seamlessJquery("<option></option>").val(year).text(year),
      );
    });

    // Add change event listener
    yearFilter.off("change").on("change", function () {
      setCurrentPage($wrapper, 1);
      if (isDataLoaded && cachedData.events.length > 0) {
        filterEventsLocally(1, $wrapper);
      } else {
        fetchEvents(1, false, $wrapper);
      }
    });
  }

  const $eventWrappers = seamlessJquery(".seamless-event-wrapper");
  if ($eventWrappers.length) {
    // Set initial view toggle state per wrapper
    $eventWrappers.each(function () {
      const $wrapper = seamlessJquery(this);
      const elements = getWrapperElements($wrapper);
      const $elementorWrapper = $wrapper.closest(".seamless-elementor-wrapper");
      const defaultView = $elementorWrapper.data("default-view");
      const initialView =
        defaultView && defaultView !== "all" ? defaultView : "list";

      elements.$currentView.val(initialView);
      $wrapper.find(".view-toggle").removeClass("active");
      $wrapper
        .find('.view-toggle[data-view="' + initialView + '"]')
        .addClass("active");
    });

    // Load cached data first, then populate categories and events
    loadCachedData()
      .then(() => {
        if (isDataLoaded && cachedData.categories.length > 0) {
          $eventWrappers.each(function () {
            const $wrapper = seamlessJquery(this);
            const elements = getWrapperElements($wrapper);
            const $elementorWrapper = $wrapper.closest(
              ".seamless-elementor-wrapper",
            );
            const isElementorWidget = $elementorWrapper.length > 0;

            // Use cached categories
            populateCategoryDropdown(cachedData.categories, $wrapper);
            // Populate year filter with events
            if (cachedData.events.length > 0) {
              populateYearFilter(cachedData.events, $wrapper);

              if (isElementorWidget) {
                elements.$sortBy.val("all");
              } else {
                const smartDefault = determineSmartDefaultSort(
                  cachedData.events,
                );
                elements.$sortBy.val(smartDefault);
              }
            } else {
              elements.$sortBy.val("all");
            }
            $wrapper.find(".loader-container").hide();
            $wrapper.find(".seamless-main-content").show();
            setCurrentPage($wrapper, 1);
            filterEventsLocally(1, $wrapper);
          });
        } else {
          // Fallback to original method per wrapper
          $eventWrappers.each(function () {
            const $wrapper = seamlessJquery(this);
            const elements = getWrapperElements($wrapper);
            elements.$sortBy.val("upcoming");
            fetchCategories($wrapper);
            fetchEvents(1, true, $wrapper);
          });
        }
      })
      .catch(() => {
        // Fallback to original method if cached data fails
        $eventWrappers.each(function () {
          const $wrapper = seamlessJquery(this);
          const elements = getWrapperElements($wrapper);
          elements.$sortBy.val("upcoming");
          fetchCategories($wrapper);
          fetchEvents(1, true, $wrapper);
        });
      });
  }

  let event_detail = seamlessJquery("#event_detail");
  if (event_detail.length && event_detail.data("event-slug")) {
    const event_slug = event_detail.data("event-slug");
    const loader = seamlessJquery("#Seamlessloader");

    loader.removeClass("hidden");

    // Use API client to fetch event data
    // Use getEventBySlug which automatically detects event type
    if (typeof window.SeamlessAPI !== "undefined") {
      window.SeamlessAPI.getEventBySlug(event_slug)
        .then((result) => {
          if (result && result.success && result.data) {
            // The event_type is now included in result.data from getEventBySlug
            const eventType = result.data.event_type || "event";
            // Don't hide loader yet - wait for rendering to complete
            renderSingleEventDetail(result.data, eventType, loader);
          } else {
            loader.addClass("hidden");
            event_detail.html('<p class="event-message">Event not found.</p>');
          }
        })
        .catch((error) => {
          console.error("Error loading single event:", error);
          loader.addClass("hidden");
          event_detail.html(
            '<p class="event-message">An error occurred loading the event. Please try again.</p>',
          );
        });
    } else {
      console.error("SeamlessAPI is not available");
      loader.addClass("hidden");
      event_detail.html(
        '<p class="event-message">API client not available. Please refresh the page.</p>',
      );
    }
  }

  /**
   * Render single event detail on the client side
   * This mirrors the PHP template structure in tpl-single-event-detail.php
   */
  function renderSingleEventDetail(event, eventType, loader) {
    const container = seamlessJquery("#event_detail");
    if (!container.length) {
      if (loader) loader.addClass("hidden");
      return;
    }

    // For now, create a simple AJAX call to get the rendered template
    // This is a temporary solution - we'll need to either:
    // 1. Create a new AJAX endpoint that doesn't use Events.php
    // 2. Or fully render client-side (more complex)

    // Let's use a simpler approach: Send event data to a generic renderer
    seamlessJquery.ajax({
      type: "POST",
      url: seamless_ajax.ajax_url,
      data: {
        action: "render_event_template",
        event_data: JSON.stringify(event),
        event_type: eventType,
        nonce: seamless_ajax.nonce,
      },
      success: function (response) {
        if (response.success && response.data) {
          container.html(response.data);

          // Initialize Slick Carousel after content is loaded
          initializeSponsorsCarousel();

          // Hide loader after content is rendered
          if (loader) loader.addClass("hidden");
        } else {
          container.html(
            '<p class="event-message">Error rendering event details.</p>',
          );
          if (loader) loader.addClass("hidden");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error rendering event template:", error);
        container.html(
          '<p class="event-message">An error occurred rendering the event. Please try again.</p>',
        );
        if (loader) loader.addClass("hidden");
      },
    });
  }

  // Function to initialize sponsors carousel
  function initializeSponsorsCarousel() {
    if (seamlessJquery(".sponsors-carousel").length) {
      seamlessJquery(".sponsors-carousel").slick({
        slidesToShow: 2,
        slidesToScroll: 1,
        autoplay: false,
        autoplaySpeed: 4000,
        arrows: true,
        dots: true,
        infinite: true,
        pauseOnHover: true,
        pauseOnFocus: true,
        prevArrow:
          '<button type="button" class="slick-prev"><i class="fa fa-chevron-left"></i></button>',
        nextArrow:
          '<button type="button" class="slick-next"><i class="fa fa-chevron-right"></i></button>',
        responsive: [
          {
            breakpoint: 1024,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            },
          },
        ],
      });
    }
  }

  // Fetch and display membership list
  if (seamlessJquery("#seamless-membership-list-container").length) {
    loadMemberships(1);
  }

  seamlessJquery("body").on(
    "click",
    ".seamless-membership-pagination .seamless-page-link",
    function (e) {
      e.preventDefault();
      var page = seamlessJquery(this).data("page");
      loadMemberships(page);
    },
  );

  function loadMemberships(page) {
    var container = seamlessJquery("#seamless-membership-list-container");
    showLoader(container);

    seamlessJquery.ajax({
      url: seamless_ajax.ajax_url,
      type: "GET",
      data: {
        action: "get_seamless_memberships",
        nonce: seamless_ajax.nonce,
        page: page,
      },
      success: function (response) {
        if (response.success) {
          container.html(response.data.html + response.data.pagination);
        } else {
          container.html("<p>Error loading memberships.</p>");
        }
      },
      error: function () {
        container.html("<p>Error loading memberships.</p>");
      },
      complete: function () {
        hideLoader(container);
      },
    });
  }

  // Fetch and display single membership details
  if (seamlessJquery("#membership_detail").length) {
    var membershipId =
      seamlessJquery("#membership_detail").data("membership-id");
    if (membershipId) {
      loadMembershipDetail(membershipId);
    }
  }

  function loadMembershipDetail(membershipId) {
    var container = seamlessJquery("#membership_detail");
    showLoader(container);

    seamlessJquery.ajax({
      url: seamless_ajax.ajax_url,
      type: "GET",
      data: {
        action: "get_seamless_membership",
        nonce: seamless_ajax.nonce,
        membership_id: membershipId,
      },
      success: function (response) {
        if (response.success) {
          container.html(response.data);
        } else {
          container.html("<p>Could not load membership details.</p>");
        }
      },
      error: function () {
        container.html("<p>Could not load membership details.</p>");
      },
      complete: function () {
        hideLoader(container);
      },
    });
  }

  // =========================================================================
  // ND Searchbar: Custom UI for .seamless-event-wrapper-without-dropdown
  // Supports multi-select category & tag filtering.
  // =========================================================================
  function initNDSearchbar() {
    var $container = seamlessJquery(".seamless-event-wrapper-without-dropdown");
    if (!$container.length) return;

    // ------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------
    var ndState = {
      categoryIds: [], // array of selected category IDs (strings)
      categoryLabels: [],
      tagIds: [], // array of selected tag IDs (strings)
      tagLabels: [],
    };
    // Expose state globally so filterEventsLocally can read it directly
    window.seamlessNDState = ndState;

    // ------------------------------------------------------------------
    // DOM refs (resolved inside the wrapper)
    // ------------------------------------------------------------------
    var $wrap = $container;
    var $searchInput = $wrap.find("#seamless-nd-search");
    var $hiddenSearch = $wrap.find(".seamless-search-input");
    var $hiddenYear = $wrap.find(".seamless-year-select");
    var $hiddenSort = $wrap.find(".seamless-sort-select");

    var $filtersBtn = $wrap.find("#seamless-nd-filters-btn");
    var $filtersPanel = $wrap.find("#seamless-nd-filters-panel");
    var $filterCount = $filtersBtn.find(".seamless-nd-filter-count");

    var $yearBtn = $wrap.find("#seamless-nd-year-btn");
    var $yearLabel = $yearBtn.find(".seamless-nd-year-label");
    var $yearMenu = $wrap.find("#seamless-nd-year-menu");

    var $sortBtn = $wrap.find("#seamless-nd-sort-btn");
    var $sortLabel = $sortBtn.find(".seamless-nd-sort-label");
    var $sortMenu = $wrap.find("#seamless-nd-sort-menu");

    var $resetBtn = $wrap.find("#seamless-nd-reset-btn");
    var $resetBadge = $resetBtn.find(".seamless-nd-reset-badge");

    var $catOptions = $wrap.find("#seamless-nd-category-options");
    var $tagOptions = $wrap.find("#seamless-nd-tag-options");

    var $chipsRow = $wrap.find("#seamless-nd-chips-row");
    var $mobileRow = $wrap.find("#seamless-nd-mobile-filters");

    // The hidden containers seamless.js uses for filtering
    var $catDropdowns = $wrap.find(".seamless-category-dropdowns");
    var $tagDropdowns = $wrap.find(".seamless-tag-dropdowns");

    // Create or get the single multi-select <select> we use for category sync
    var $catSync = $catDropdowns.find("#seamless-nd-cat-sync");
    if (!$catSync.length) {
      $catSync = seamlessJquery(
        '<select multiple id="seamless-nd-cat-sync" class="category-select" style="display:none;"></select>',
      );
      $catDropdowns.append($catSync);
    }
    var $tagSync = $tagDropdowns.find("#seamless-nd-tag-sync");
    if (!$tagSync.length) {
      $tagSync = seamlessJquery(
        '<select multiple id="seamless-nd-tag-sync" class="tag-select" style="display:none;"></select>',
      );
      $tagDropdowns.append($tagSync);
    }

    // ------------------------------------------------------------------
    // Filter-by-type: read from Elementor wrapper data attribute
    // Controls which filter groups (category/tag) are visible.
    // Values: 'none' | 'category' | 'tag' | 'all'
    // ------------------------------------------------------------------
    var $elementorWrapper = $wrap.closest(".seamless-elementor-wrapper");
    var filterByType =
      ($elementorWrapper.length
        ? $elementorWrapper.data("filter-by-type")
        : null) || "all";

    var $catGroup = $wrap.find("#seamless-nd-category-group");
    var $tagGroup = $wrap.find("#seamless-nd-tag-group");

    function applyFilterByType() {
      if (filterByType === "none") {
        // Hide the Filters button entirely
        $filtersBtn.hide();
        $filtersPanel.hide().removeClass("seamless-nd-panel-open");
      } else if (filterByType === "category") {
        $filtersBtn.show();
        $catGroup.show();
        $tagGroup.hide();
      } else if (filterByType === "tag") {
        $filtersBtn.show();
        $catGroup.hide();
        $tagGroup.show();
      } else {
        // 'all' or default
        $filtersBtn.show();
        $catGroup.show();
        $tagGroup.show();
      }
    }
    applyFilterByType();

    // open-dropdown tracker
    var openDD = null;

    // ------------------------------------------------------------------
    // Trigger filter
    // ------------------------------------------------------------------
    function ndTrigger() {
      if (typeof window.seamlessTriggerFilter === "function") {
        window.seamlessTriggerFilter();
      } else {
        $hiddenSort.trigger("change");
      }
    }

    // ------------------------------------------------------------------
    // Escaping
    // ------------------------------------------------------------------
    function esc(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    // ------------------------------------------------------------------
    // Search Input
    // ------------------------------------------------------------------
    var searchTimer;
    $searchInput.on("input", function () {
      clearTimeout(searchTimer);
      var val = $searchInput.val();
      $hiddenSearch.val(val);
      searchTimer = setTimeout(function () {
        $hiddenSearch.trigger("input").trigger("keyup");
      }, 0);
    });

    // ------------------------------------------------------------------
    // Year Dropdown — built from cachedData after it loads
    // ------------------------------------------------------------------
    function buildYearMenu() {
      if (!window.cachedData || !window.cachedData.events) return;
      var years = new Set();
      window.cachedData.events.forEach(function (ev) {
        var d = ev.start_date || ev.formatted_start_date;
        if (d) {
          var y = new Date(d).getFullYear();
          if (!isNaN(y)) years.add(y);
        }
      });
      var sorted = Array.from(years).sort(function (a, b) {
        return b - a;
      });
      var html =
        '<li role="option" class="seamless-nd-menu-selected" data-value="">All Years <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></li>';
      sorted.forEach(function (y) {
        html += '<li role="option" data-value="' + y + '">' + y + "</li>";
      });
      $yearMenu.html(html);
    }

    // Poll until cachedData is ready
    var yearPoll = setInterval(function () {
      if (
        window.cachedData &&
        window.cachedData.events &&
        window.cachedData.events.length > 0
      ) {
        clearInterval(yearPoll);
        buildYearMenu();
      }
    }, 300);

    $yearBtn.on("click", function (e) {
      e.stopPropagation();
      toggleDD("year");
    });

    $yearMenu.on("click", "li[data-value]", function () {
      var val =
        seamlessJquery(this).data("value") !== undefined
          ? String(seamlessJquery(this).data("value"))
          : "";
      selectYear(val);
      closeAllDD();
    });

    function selectYear(val) {
      $hiddenYear.val(val);
      $yearLabel.text(val ? val : "All Years");
      $yearBtn.toggleClass("seamless-nd-active-filter", !!val);
      // update checkmark
      $yearMenu.find("li").each(function () {
        var liVal =
          seamlessJquery(this).data("value") !== undefined
            ? String(seamlessJquery(this).data("value"))
            : "";
        var isSel = liVal === val;
        seamlessJquery(this).toggleClass("seamless-nd-menu-selected", isSel);
        seamlessJquery(this).find("svg").remove();
        if (isSel) {
          seamlessJquery(this).append(
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
          );
        }
      });
      updateBadges();
      $hiddenYear.trigger("change");
      ndTrigger();
    }

    // ------------------------------------------------------------------
    // Sort Dropdown
    // ------------------------------------------------------------------
    var SORT_LABELS = {
      all: "All",
      upcoming: "Upcoming",
      current: "Current",
      past: "Past",
    };

    $sortBtn.on("click", function (e) {
      e.stopPropagation();
      toggleDD("sort");
    });

    $sortMenu.on("click", "li[data-value]", function () {
      var val = String(seamlessJquery(this).data("value") || "all");
      selectSort(val);
      closeAllDD();
    });

    var SORT_CHECK_SVG =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    function selectSort(val) {
      $hiddenSort.val(val);
      $sortLabel.text(SORT_LABELS[val] || val);
      // Active-filter styling on the button (only when not 'all')
      $sortBtn.toggleClass("seamless-nd-active-filter", val !== "all");
      // Update menu items
      $sortMenu.find("li").each(function () {
        var liVal = String(seamlessJquery(this).data("value") || "all");
        var isSel = liVal === val;
        seamlessJquery(this).toggleClass("seamless-nd-menu-selected", isSel);
        seamlessJquery(this).find("svg").remove();
        if (isSel) {
          // Append checkmark AFTER the text (append, not prepend)
          seamlessJquery(this).append(SORT_CHECK_SVG);
        }
      });
      $hiddenSort.trigger("change");
      ndTrigger();
    }

    // ------------------------------------------------------------------
    // Filters Panel
    // ------------------------------------------------------------------
    $filtersBtn.on("click", function (e) {
      e.stopPropagation();
      toggleDD("filters");
    });

    // Build category options from cachedData
    function buildCategoryOptions() {
      if (
        !window.cachedData ||
        !window.cachedData.categories ||
        !window.cachedData.categories.length
      ) {
        // Try to get from existing .category-select options
        var opts = {};
        $catDropdowns
          .find(
            "select.category-select:not(#seamless-nd-cat-sync) option[value]",
          )
          .each(function () {
            var v = seamlessJquery(this).val();
            if (v) opts[v] = seamlessJquery(this).text();
          });
        if (Object.keys(opts).length === 0) {
          $catOptions.html(
            '<span class="seamless-nd-filter-placeholder">No categories available</span>',
          );
          return;
        }
        var html = "";
        seamlessJquery.each(opts, function (id, name) {
          html += buildOptionBtn(
            "category",
            id,
            name,
            ndState.categoryIds.indexOf(id) > -1,
          );
        });
        $catOptions.html(html);
        return;
      }
      var html = "";
      (function recurse(list) {
        list.forEach(function (cat) {
          var id = String(cat.id || "");
          if (!id) return;
          html += buildOptionBtn(
            "category",
            id,
            cat.label || cat.name,
            ndState.categoryIds.indexOf(id) > -1,
          );
          if (cat.children && cat.children.length) recurse(cat.children);
        });
      })(window.cachedData.categories);
      $catOptions.html(
        html ||
          '<span class="seamless-nd-filter-placeholder">No categories available</span>',
      );
    }

    // Build tag options from cachedData.events
    function buildTagOptions() {
      if (!window.cachedData || !window.cachedData.events) {
        $tagOptions.html(
          '<span class="seamless-nd-filter-placeholder">No tags available</span>',
        );
        return;
      }
      var tagMap = {};
      window.cachedData.events.forEach(function (ev) {
        if (ev.tags && Array.isArray(ev.tags)) {
          ev.tags.forEach(function (t) {
            var id = String(t.id || t.slug || "");
            if (id && !tagMap[id]) tagMap[id] = t.name || t.label || id;
          });
        }
      });
      var keys = Object.keys(tagMap);
      if (!keys.length) {
        $tagOptions.html(
          '<span class="seamless-nd-filter-placeholder">No tags available</span>',
        );
        return;
      }
      var html = "";
      keys.forEach(function (id) {
        html += buildOptionBtn(
          "tag",
          id,
          tagMap[id],
          ndState.tagIds.indexOf(id) > -1,
        );
      });
      $tagOptions.html(html);
    }

    function buildOptionBtn(type, id, label, active) {
      return (
        '<button type="button" class="seamless-nd-filter-option' +
        (active ? " seamless-nd-filter-option--active" : "") +
        '" data-type="' +
        type +
        '" data-id="' +
        esc(id) +
        '" data-label="' +
        esc(label) +
        '">' +
        esc(label) +
        "</button>"
      );
    }

    // Poll until cachedData ready for filters
    var filterPoll = setInterval(function () {
      if (window.cachedData && window.cachedData.events) {
        clearInterval(filterPoll);
        buildCategoryOptions();
        buildTagOptions();
        // also populate cat-sync <select> options so filterEventsLocally can compare ids
        rebuildCatSyncOptions();
        rebuildTagSyncOptions();
      }
    }, 300);

    // Also watch for categories populating via MutationObserver on .seamless-category-dropdowns
    if (typeof MutationObserver !== "undefined") {
      new MutationObserver(function () {
        buildCategoryOptions();
      }).observe($catDropdowns[0], { childList: true, subtree: true });
    }

    // Clicks on filter option buttons (category or tag) — multiselect
    $wrap.on("click", ".seamless-nd-filter-option", function () {
      var $btn = seamlessJquery(this);
      var type = $btn.data("type");
      var id = String($btn.data("id"));
      var label = String($btn.data("label"));

      if (type === "category") {
        var idx = ndState.categoryIds.indexOf(id);
        if (idx > -1) {
          ndState.categoryIds.splice(idx, 1);
          ndState.categoryLabels.splice(idx, 1);
        } else {
          ndState.categoryIds.push(id);
          ndState.categoryLabels.push(label);
        }
        $btn.toggleClass(
          "seamless-nd-filter-option--active",
          ndState.categoryIds.indexOf(id) > -1,
        );
        syncCatToJS();
      } else {
        var idx = ndState.tagIds.indexOf(id);
        if (idx > -1) {
          ndState.tagIds.splice(idx, 1);
          ndState.tagLabels.splice(idx, 1);
        } else {
          ndState.tagIds.push(id);
          ndState.tagLabels.push(label);
        }
        $btn.toggleClass(
          "seamless-nd-filter-option--active",
          ndState.tagIds.indexOf(id) > -1,
        );
        syncTagToJS();
      }

      updateChips();
      updateMobileFilters();
      updateBadges();
      ndTrigger();
    });

    // ------------------------------------------------------------------
    // Sync selected IDs into the hidden multi-select elements
    // ------------------------------------------------------------------
    function rebuildCatSyncOptions() {
      // Populate cat-sync <select> with all category options so we can select them
      var seen = {};
      var html = "";
      if (window.cachedData && window.cachedData.categories) {
        (function recurse(list) {
          list.forEach(function (cat) {
            var id = String(cat.id || "");
            if (id && !seen[id]) {
              seen[id] = true;
              html +=
                '<option value="' +
                esc(id) +
                '">' +
                esc(cat.label || cat.name) +
                "</option>";
            }
            if (cat.children && cat.children.length) recurse(cat.children);
          });
        })(window.cachedData.categories);
      } else {
        $catDropdowns
          .find(
            "select.category-select:not(#seamless-nd-cat-sync) option[value]",
          )
          .each(function () {
            var v = seamlessJquery(this).val();
            if (v && !seen[v]) {
              seen[v] = true;
              html +=
                '<option value="' +
                esc(v) +
                '">' +
                esc(seamlessJquery(this).text()) +
                "</option>";
            }
          });
      }
      $catSync.html(html);
    }

    function rebuildTagSyncOptions() {
      var html = "";
      if (window.cachedData && window.cachedData.events) {
        var seen = {};
        window.cachedData.events.forEach(function (ev) {
          if (ev.tags && Array.isArray(ev.tags)) {
            ev.tags.forEach(function (t) {
              var id = String(t.id || t.slug || "");
              if (id && !seen[id]) {
                seen[id] = true;
                html +=
                  '<option value="' +
                  esc(id) +
                  '">' +
                  esc(t.name || t.label || id) +
                  "</option>";
              }
            });
          }
        });
      }
      $tagSync.html(html);
    }

    function syncCatToJS() {
      rebuildCatSyncOptions();
      // set selected options
      $catSync.find("option").each(function () {
        seamlessJquery(this).prop(
          "selected",
          ndState.categoryIds.indexOf(seamlessJquery(this).val()) > -1,
        );
      });
    }

    function syncTagToJS() {
      rebuildTagSyncOptions();
      $tagSync.find("option").each(function () {
        seamlessJquery(this).prop(
          "selected",
          ndState.tagIds.indexOf(seamlessJquery(this).val()) > -1,
        );
      });
    }

    // ------------------------------------------------------------------
    // Chips (desktop) and Mobile filter buttons
    // ------------------------------------------------------------------
    function updateChips() {
      var html = "";
      ndState.categoryIds.forEach(function (id, i) {
        html += makeChip("category", id, ndState.categoryLabels[i] || id);
      });
      ndState.tagIds.forEach(function (id, i) {
        html += makeChip("tag", id, ndState.tagLabels[i] || id);
      });
      $chipsRow.html(html);
    }

    function updateMobileFilters() {
      var html = "";
      ndState.categoryIds.forEach(function (id, i) {
        html += makeMobileBtn("category", id, ndState.categoryLabels[i] || id);
      });
      ndState.tagIds.forEach(function (id, i) {
        html += makeMobileBtn("tag", id, ndState.tagLabels[i] || id);
      });
      $mobileRow.html(html);
      $mobileRow.css(
        "display",
        ndState.categoryIds.length || ndState.tagIds.length ? "flex" : "none",
      );
    }

    function makeChip(type, id, label) {
      return (
        '<span class="seamless-nd-chip" data-type="' +
        type +
        '" data-id="' +
        esc(id) +
        '">' +
        esc(label) +
        '<button type="button" class="seamless-nd-chip-remove" data-type="' +
        type +
        '" data-id="' +
        esc(id) +
        '" aria-label="Remove ' +
        esc(label) +
        ' filter">' +
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        "</button></span>"
      );
    }

    function makeMobileBtn(type, id, label) {
      return (
        '<button type="button" class="seamless-nd-mobile-filter-btn" data-type="' +
        type +
        '" data-id="' +
        esc(id) +
        '">' +
        esc(label) +
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        "</button>"
      );
    }

    // Chip remove / mobile btn remove
    $chipsRow.on("click", ".seamless-nd-chip-remove", function () {
      removeFilter(
        seamlessJquery(this).data("type"),
        String(seamlessJquery(this).data("id")),
      );
    });
    $mobileRow.on("click", ".seamless-nd-mobile-filter-btn", function () {
      removeFilter(
        seamlessJquery(this).data("type"),
        String(seamlessJquery(this).data("id")),
      );
    });

    function removeFilter(type, id) {
      if (type === "category") {
        var idx = ndState.categoryIds.indexOf(id);
        if (idx > -1) {
          ndState.categoryIds.splice(idx, 1);
          ndState.categoryLabels.splice(idx, 1);
        }
        syncCatToJS();
        // deactivate button in panel
        $catOptions
          .find('.seamless-nd-filter-option[data-id="' + id + '"]')
          .removeClass("seamless-nd-filter-option--active");
      } else {
        var idx = ndState.tagIds.indexOf(id);
        if (idx > -1) {
          ndState.tagIds.splice(idx, 1);
          ndState.tagLabels.splice(idx, 1);
        }
        syncTagToJS();
        $tagOptions
          .find('.seamless-nd-filter-option[data-id="' + id + '"]')
          .removeClass("seamless-nd-filter-option--active");
      }
      updateChips();
      updateMobileFilters();
      updateBadges();
      ndTrigger();
    }

    // ------------------------------------------------------------------
    // Badges
    // ------------------------------------------------------------------
    function updateBadges() {
      var count =
        ndState.categoryIds.length +
        ndState.tagIds.length +
        ($hiddenYear.val() ? 1 : 0);
      $filterCount
        .text(count)
        .css("display", count > 0 ? "inline-flex" : "none");
      $resetBadge
        .text(count)
        .css("display", count > 0 ? "inline-flex" : "none");
    }

    // ------------------------------------------------------------------
    // Reset (our button)
    // ------------------------------------------------------------------
    $resetBtn.on("click", function () {
      ndReset();
      // also trigger native reset button so seamless.js can reset view, sort, etc.
      $wrap.find(".seamless-reset-button").trigger("click");
    });

    // Listen for the integrated reset event fired by the native reset handler
    seamlessJquery(document).on("seamless:nd:reset", function () {
      ndReset();
    });

    // Listen for filter-by-type re-evaluation request from events-widget.js
    seamlessJquery(document).on("seamless:nd:filterByType", function () {
      applyFilterByType();
    });

    function ndReset() {
      // clear state
      ndState.categoryIds = [];
      ndState.categoryLabels = [];
      ndState.tagIds = [];
      ndState.tagLabels = [];
      // keep global in sync
      window.seamlessNDState = ndState;

      // clear sync selects
      $catSync.find("option").prop("selected", false);
      $tagSync.find("option").prop("selected", false);

      // clear UI
      $searchInput.val("");
      $hiddenSearch.val("");
      selectYear("");
      $catOptions
        .find(".seamless-nd-filter-option--active")
        .removeClass("seamless-nd-filter-option--active");
      $tagOptions
        .find(".seamless-nd-filter-option--active")
        .removeClass("seamless-nd-filter-option--active");

      updateChips();
      updateMobileFilters();
      updateBadges();
    }

    // ------------------------------------------------------------------
    // Dropdowns open/close
    // ------------------------------------------------------------------
    function toggleDD(name) {
      if (openDD === name) {
        closeAllDD();
        return;
      }
      closeAllDD();
      openDD = name;
      if (name === "filters") {
        $filtersPanel
          .addClass("seamless-nd-panel-open")
          .attr("aria-hidden", "false");
        $filtersBtn.attr("aria-expanded", "true");
        // rebuild options fresh each open in case cachedData arrived
        buildCategoryOptions();
        buildTagOptions();
      }
      if (name === "year") {
        $yearMenu.addClass("seamless-nd-menu-open");
        $yearBtn.attr("aria-expanded", "true");
      }
      if (name === "sort") {
        $sortMenu.addClass("seamless-nd-menu-open");
        $sortBtn.attr("aria-expanded", "true");
      }
    }

    function closeAllDD() {
      openDD = null;
      $filtersPanel
        .removeClass("seamless-nd-panel-open")
        .attr("aria-hidden", "true");
      $filtersBtn.attr("aria-expanded", "false");
      $yearMenu.removeClass("seamless-nd-menu-open");
      $yearBtn.attr("aria-expanded", "false");
      $sortMenu.removeClass("seamless-nd-menu-open");
      $sortBtn.attr("aria-expanded", "false");
    }

    seamlessJquery(document).on("click.ndSearchbar", function (e) {
      if (
        !seamlessJquery(e.target).closest(
          "#seamless-nd-filters-btn, #seamless-nd-filters-panel, #seamless-nd-year-wrap, #seamless-nd-sort-wrap",
        ).length
      ) {
        closeAllDD();
      }
    });

    seamlessJquery(document).on("keydown.ndSearchbar", function (e) {
      if (e.key === "Escape") closeAllDD();
    });

    // ------------------------------------------------------------------
    // Watch hidden sort input for external changes (seamless.js reset)
    // ------------------------------------------------------------------
    var SORT_LABELS_REF = {
      all: "All",
      upcoming: "Upcoming",
      current: "Current",
      past: "Past",
    };
    var lastSortVal = $hiddenSort.val();
    setInterval(function () {
      var cur = $hiddenSort.val();
      if (cur !== lastSortVal) {
        lastSortVal = cur;
        $sortLabel.text(SORT_LABELS_REF[cur] || cur);
        $sortBtn.toggleClass("seamless-nd-active-filter", cur !== "all");
        $sortMenu.find("li").each(function () {
          var liVal = String(seamlessJquery(this).data("value") || "all");
          var isSel = liVal === cur;
          seamlessJquery(this)
            .toggleClass("seamless-nd-menu-selected", isSel)
            .find("svg")
            .remove();
          if (isSel) {
            seamlessJquery(this).append(SORT_CHECK_SVG);
          }
        });
      }
    }, 400);

    // ------------------------------------------------------------------
    // Initial sort value: determined smartly once cachedData is available
    // Uses determineSmartDefaultSort (same logic as seamless.js reset handler):
    //   upcoming events present → 'upcoming'
    //   only current → 'current'
    //   only past    → 'past'
    // While loading, show 'Upcoming' as a placeholder label.
    // ------------------------------------------------------------------
    (function () {
      $sortLabel.text(SORT_LABELS["upcoming"]);
    })();

    var sortInitDone = false;
    var sortInitPoll = setInterval(function () {
      if (
        sortInitDone ||
        !window.cachedData ||
        !window.cachedData.events ||
        window.cachedData.events.length === 0
      )
        return;
      clearInterval(sortInitPoll);
      sortInitDone = true;
      var smart = determineSmartDefaultSort(window.cachedData.events);
      // Only apply if the user hasn't changed the sort themselves
      if (
        $hiddenSort.val() === "upcoming" ||
        $hiddenSort.val() === "" ||
        !$hiddenSort.val()
      ) {
        selectSort(smart);
      }
    }, 300);
  }

  // Call ND searchbar init after DOM ready
  initNDSearchbar();
});

window.SeamlessCalendar = SeamlessCalendar;

// Global reference for triggering filter from external sources (like Elementor widgets)
window.seamlessTriggerFilter = null;

/**
 * Expose filter function for external use (Elementor widget integration)
 * Allows programmatic category filtering from Elementor widgets
 *
 * @param {Array|string} categoryIds - Category ID(s) to filter by (optional - if not provided, uses current dropdown values)
 */
window.seamlessFilterByCategories = function (categoryIds) {
  const $wrappers = seamlessJquery(".seamless-event-wrapper");

  if (categoryIds !== undefined) {
    if (!Array.isArray(categoryIds)) {
      categoryIds = categoryIds ? [categoryIds] : [];
    }

    $wrappers.each(function () {
      const $wrapper = seamlessJquery(this);
      $wrapper
        .find(".seamless-category-dropdowns .category-select")
        .each(function (index) {
          if (categoryIds[index]) {
            seamlessJquery(this).val(categoryIds[index]);
          } else {
            seamlessJquery(this).val("");
          }
        });
    });
  }

  // Use the global trigger function if available
  if (typeof window.seamlessTriggerFilter === "function") {
    window.seamlessTriggerFilter();
  } else {
    // Fallback: trigger sort change
    $wrappers.find(".seamless-sort-select").trigger("change");
  }
};

/**
 * Extract unique categories from events for Elementor widget dropdowns
 *
 * @returns {Array} Array of unique category objects with id, name, and slug
 */
window.seamlessGetEventCategories = function () {
  var categories = [];
  var categoryMap = {};

  // Try to get categories from cached events
  seamlessJquery(
    ".seamless-event-list [data-event-id], .event-item, .event-item-modern, .event-card",
  ).each(function () {
    var $event = seamlessJquery(this);
    var eventCategories = $event.data("categories");

    if (eventCategories && Array.isArray(eventCategories)) {
      eventCategories.forEach(function (cat) {
        if (cat.id && !categoryMap[cat.id]) {
          categoryMap[cat.id] = {
            id: cat.id,
            name: cat.name || cat.label || "Unknown",
            slug: cat.slug || "",
          };
        }
      });
    }
  });

  // Convert map to array
  for (var id in categoryMap) {
    if (categoryMap.hasOwnProperty(id)) {
      categories.push(categoryMap[id]);
    }
  }

  // Sort by name
  categories.sort(function (a, b) {
    return (a.name || "").localeCompare(b.name || "");
  });

  return categories;
};

/**
 * Fetch categories from API and call callback with the results
 *
 * @param {Function} callback - Function to call with categories array
 */
window.seamlessFetchCategories = function (callback) {
  if (typeof seamless_ajax === "undefined" || !seamless_ajax.ajax_url) {
    if (callback) callback([]);
    return;
  }

  seamlessJquery.ajax({
    url: seamless_ajax.ajax_url,
    method: "GET",
    data: {
      action: "get_seamless_categories",
      nonce: seamless_ajax.nonce || "",
    },
    success: function (res) {
      if (res.success && res.data && res.data.categories) {
        // Flatten categories for dropdown use
        var flatCategories = [];

        res.data.categories.forEach(function (parentCategory) {
          // Add parent category
          flatCategories.push({
            id: parentCategory.id,
            name: parentCategory.label || parentCategory.name || "Unknown",
            slug: parentCategory.slug || "",
            isParent: true,
          });

          // Add children if any
          if (parentCategory.children && parentCategory.children.length > 0) {
            parentCategory.children.forEach(function (child) {
              flatCategories.push({
                id: child.id,
                name: child.label || child.name || "Unknown",
                slug: child.slug || "",
                isChild: true,
                parentId: parentCategory.id,
              });
            });
          }
        });

        if (callback) callback(flatCategories);
      } else {
        if (callback) callback([]);
      }
    },
    error: function () {
      if (callback) callback([]);
    },
  });
};

/**
 * Event to notify when categories are available
 */
window.seamlessCategoriesReady = false;
window.seamlessCategoriesData = [];

document.addEventListener("DOMContentLoaded", () => {
  // Calendar will be initialized when calendar view is selected
  // This ensures it works with the existing structure
});
