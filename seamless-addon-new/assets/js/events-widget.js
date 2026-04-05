/**
 * Seamless Addon - Events Widget JavaScript
 */

(function ($) {
  "use strict";

  /**
   * Events Widget Handler
   */
  var SeamlessEventsWidget = {
    /**
     * Initialize
     */
    init: function () {
      this.bindEvents();
    },

    /**
     * Bind events
     */
    bindEvents: function () {
      // Pagination click handlers
      $(document).on("click", ".seamless-pagination a", this.handlePagination);

      // Filter change handlers
      $(document).on("change", ".seamless-filter-select", this.handleFilter);

      // Handle view toggle visibility based on default view setting
      this.handleViewToggleVisibility();

      // Handle events per page limiting
      this.handleEventsPerPage();

      // Handle search bar visibility
      this.handleSearchBarVisibility();

      // Handle filter by dropdown
      this.handleFilterBy();

      // Handle reset button to preserve current view
      this.handleResetButton();

      // Override default sort to "all" for Elementor widget
      this.overrideDefaultSort();

      // Handle pagination type
      this.handlePaginationType();

      // Fix Issue 1: Reset Load More state when view toggles
      // Because seamless.js resets to Page 1 on view switch
      var self = this;
      $(document).on("click", ".view-toggle", function () {
        $(".seamless-load-more-btn").data("current-page", 1);
        // slight delay to let seamless.js render new view
        setTimeout(function () {
          self.updateLoadMoreVisibility();
        }, 100);
      });

      // Listen for filter/search changes and AJAX completions
      // Reset Load More button when filters change
      $(document).on(
        "change",
        "#sort_by, #category_filter, #tag_filter, select[name='sort'], select[name='category'], select[name='tag']",
        function () {
          $(".seamless-load-more-btn").data("current-page", 1);
          setTimeout(function () {
            self.updateLoadMoreVisibility();
          }, 100);
        },
      );

      // Listen for search input changes (with debounce)
      var searchTimeout;
      $(document).on(
        "input keyup",
        "#event_search, input[name='search'], .event-search-input",
        function () {
          $(".seamless-load-more-btn").data("current-page", 1);
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(function () {
            self.updateLoadMoreVisibility();
          }, 100);
        },
      );

      // Listen for Reset button click
      $(document).on(
        "click",
        ".reset-btn, #reset_filters, button[type='reset']",
        function () {
          $(".seamless-load-more-btn").data("current-page", 1);
          setTimeout(function () {
            self.updateLoadMoreVisibility();
          }, 100);
        },
      );

      // Listen for any AJAX completion related to events
      $(document).ajaxComplete(function (event, xhr, settings) {
        var url = settings.url || "";
        var data = settings.data || "";
        var isEventsCall =
          (typeof url === "string" &&
            url.indexOf("get_seamless_events") !== -1) ||
          (typeof data === "string" &&
            data.indexOf("action=get_seamless_events") !== -1);

        if (isEventsCall) {
          // Reset current page on filter changes
          $(".seamless-load-more-btn").data("current-page", 1);
          setTimeout(function () {
            self.updateLoadMoreVisibility();
          }, 300);
        }
      });
    },

    /**
     * Handle pagination click
     */
    handlePagination: function (e) {
      e.preventDefault();

      var $link = $(this);
      var $widget = $link.closest(".seamless-events-list").parent();
      var page = $link.data("page");

      // Add loading indicator
      $widget.addClass("seamless-loading");

      // Scroll to widget
      $("html, body").animate(
        {
          scrollTop: $widget.offset().top - 100,
        },
        300,
      );
    },

    /**
     * Handle filter change
     */
    handleFilter: function (e) {
      var $select = $(this);
      var $widget = $select.closest(".seamless-widget");

      // Add loading indicator
      $widget.addClass("seamless-loading");
    },

    /**
     * Handle view toggle visibility based on default view setting
     */
    handleViewToggleVisibility: function () {
      var self = this;

      // Function to check and update visibility
      var updateVisibility = function () {
        $(".seamless-elementor-wrapper").each(function () {
          var $wrapper = $(this);
          var defaultView = $wrapper.data("default-view") || "all";
          var $viewToggleContainer = $wrapper.find(
            ".view-toggle-button-container",
          );

          if ($viewToggleContainer.length === 0) {
            // Try to find it in the parent eventWrapper
            var $eventWrapper = $wrapper.find("#eventWrapper");
            if ($eventWrapper.length > 0) {
              $viewToggleContainer = $eventWrapper.find(
                ".view-toggle-button-container",
              );
            }
          }

          if ($viewToggleContainer.length > 0) {
            if (defaultView === "all") {
              // Show the view toggle buttons
              $viewToggleContainer.show();
            } else {
              // Trigger the specific view first, then hide
              var $button = $viewToggleContainer.find(
                '.view-toggle[data-view="' + defaultView + '"]',
              );
              if ($button.length > 0) {
                $button.click();
              }

              // Hide the view toggle section after a short delay
              setTimeout(function () {
                $viewToggleContainer.hide();
              }, 150);
            }
          }
        });
      };

      // Initial check
      setTimeout(updateVisibility, 100);

      // Watch for DOM changes (e.g., after AJAX calls)
      if (typeof MutationObserver !== "undefined") {
        var observer = new MutationObserver(function (mutations) {
          var shouldUpdate = false;

          mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length > 0) {
              $(mutation.addedNodes).each(function () {
                var $node = $(this);
                if (
                  $node.hasClass("view-toggle-button-container") ||
                  $node.find(".view-toggle-button-container").length > 0 ||
                  $node.hasClass("seamless-elementor-wrapper") ||
                  $node.find(".seamless-elementor-wrapper").length > 0
                ) {
                  shouldUpdate = true;
                  return false;
                }
              });
            }
          });

          if (shouldUpdate) {
            setTimeout(updateVisibility, 50);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }

      // Also listen for AJAX completion
      $(document).ajaxComplete(function () {
        setTimeout(updateVisibility, 100);
      });
    },

    /**
     * Helper function to get events per page setting
     * Tries multiple methods to find the correct value
     */
    getEventsPerPage: function () {
      var eventsPerPage = null;

      // Method 1: Try to get from wrapper data attribute
      $(".seamless-elementor-wrapper").each(function () {
        var perPage = parseInt($(this).data("events-per-page"));
        if (perPage && perPage > 0) {
          eventsPerPage = perPage;
          return false; // break
        }
      });

      // Method 2: Try to get from wrapper attribute directly
      if (!eventsPerPage) {
        var $wrapper = $(".seamless-elementor-wrapper").first();
        if ($wrapper.length) {
          var attrValue = $wrapper.attr("data-events-per-page");
          if (attrValue) {
            eventsPerPage = parseInt(attrValue);
          }
        }
      }

      // Default fallback
      return eventsPerPage || 6;
    },

    /**
     * Handle events per page limiting for list and grid views
     */
    handleEventsPerPage: function () {
      var self = this;

      // Intercept AJAX responses BEFORE rendering to prevent flash
      this.interceptAjaxResponse();

      // Fallback function to limit events if interception didn't work
      var limitEvents = function () {
        $(".seamless-elementor-wrapper").each(function () {
          var $wrapper = $(this);
          var eventsPerPage = parseInt($wrapper.data("events-per-page")) || 6;

          // Find the event wrapper
          var $eventWrapper = $wrapper.find("#eventWrapper");
          if ($eventWrapper.length === 0) {
            return;
          }

          // Get current view - check if calendar view is active
          var $calendarView = $eventWrapper.find("#calendar_view");
          var isCalendarView =
            $calendarView.length > 0 && !$calendarView.hasClass("hidden");

          // Don't limit calendar view
          if (isCalendarView) {
            return;
          }

          // Check if list or grid view is active
          var $eventList = $eventWrapper.find(".seamless-event-list");
          if ($eventList.length === 0) {
            return;
          }

          // Find all event items - list view uses .event-item and .event-item-modern, grid uses .event-card
          var $eventItems = $eventList.find(
            ".event-item, .event-item-modern, .event-card",
          );

          // If still no items found, try direct children
          if ($eventItems.length === 0) {
            $eventItems = $eventList.children(
              ".event-item, .event-item-modern, .event-card, .seamless-item",
            );
          }

          // Also check for grid container
          if ($eventItems.length === 0) {
            var $eventGrid = $eventList.find(".event-grid");
            if ($eventGrid.length > 0) {
              $eventItems = $eventGrid.find(".event-card");
            }
          }

          // Limit events based on per page setting
          if ($eventItems.length > 0) {
            var visibleCount = 0;
            $eventItems.each(function (index) {
              if (visibleCount < eventsPerPage) {
                $(this).show();
                visibleCount++;
              } else {
                $(this).hide();
              }
            });
          }
        });
      };

      // Fallback limit check (in case interception didn't catch it)
      setTimeout(limitEvents, 100);

      // Also listen for view changes
      $(document).on("click", ".view-toggle", function () {
        setTimeout(limitEvents, 100);
      });
    },

    /**
     * Intercept AJAX response to modify HTML before rendering
     */
    interceptAjaxResponse: function () {
      var self = this;

      // Intercept AJAX responses using ajaxSuccess
      $(document).ajaxSuccess(function (event, xhr, settings) {
        // Check if this is the get_seamless_events call
        var url = settings.url || "";
        var data = settings.data || "";
        var isEventsCall =
          (typeof url === "string" &&
            url.indexOf("get_seamless_events") !== -1) ||
          (typeof data === "string" &&
            data.indexOf("action=get_seamless_events") !== -1);

        if (isEventsCall) {
          try {
            var response = JSON.parse(xhr.responseText);
            if (
              response &&
              response.success &&
              response.data &&
              response.data.html
            ) {
              // Get events per page setting from wrapper
              var eventsPerPage = self.getEventsPerPage();

              // Parse the HTML
              var $tempDiv = $("<div>").html(response.data.html);

              // Check if calendar view - don't limit calendar
              var $calendarView = $tempDiv.find("#calendar_view");
              var isCalendarView =
                $calendarView.length > 0 && !$calendarView.hasClass("hidden");

              // Only limit if not calendar view
              if (!isCalendarView) {
                // Find event items - try multiple selectors
                var $eventItems = $tempDiv.find(
                  ".event-item, .event-item-modern, .event-card",
                );

                // If no items found, check for grid container
                if ($eventItems.length === 0) {
                  var $eventGrid = $tempDiv.find(".event-grid");
                  if ($eventGrid.length > 0) {
                    $eventItems = $eventGrid.find(".event-card");
                  }
                }

                // Also check direct children of seamless-event-list
                if ($eventItems.length === 0) {
                  var $eventList = $tempDiv.find(".seamless-event-list");
                  if ($eventList.length > 0) {
                    $eventItems = $eventList.children(
                      ".event-item, .event-item-modern, .event-card",
                    );
                  }
                }

                // Remove events beyond the limit BEFORE rendering
                if ($eventItems.length > eventsPerPage) {
                  $eventItems.each(function (index) {
                    if (index >= eventsPerPage) {
                      $(this).remove();
                    }
                  });

                  // Update response HTML
                  response.data.html = $tempDiv.html();

                  // Modify the xhr responseText to use modified HTML
                  // This prevents the flash by ensuring modified HTML is used
                  try {
                    xhr.responseText = JSON.stringify(response);
                  } catch (e) {
                    // If we can't modify responseText, use MutationObserver as fallback
                    self.setupImmediateHiding(eventsPerPage);
                  }
                }
              }
            }
          } catch (e) {
            // If parsing fails, use MutationObserver fallback
            self.setupImmediateHiding(self.getEventsPerPage());
          }
        }
      });

      // Also setup immediate hiding as backup
      this.setupImmediateHiding();
    },

    /**
     * Setup MutationObserver to hide events immediately as they're added
     */
    setupImmediateHiding: function (eventsPerPage) {
      var self = this;

      if (typeof MutationObserver === "undefined") {
        return;
      }

      // Use requestAnimationFrame for immediate DOM manipulation
      var processNode = function (node) {
        if (self.disableImmediateHiding) return;
        if (node.nodeType !== 1) return; // Not an element node

        var $node = $(node);
        var isEventItem =
          $node.hasClass("event-item") ||
          $node.hasClass("event-item-modern") ||
          $node.hasClass("event-card");

        if (
          isEventItem ||
          $node.find(".event-item, .event-item-modern, .event-card").length > 0
        ) {
          // Use requestAnimationFrame to process immediately before paint
          requestAnimationFrame(function () {
            // Find the wrapper to get events_per_page
            var $wrapper = $node.closest(".seamless-elementor-wrapper");
            if ($wrapper.length === 0) {
              $wrapper = $(".seamless-elementor-wrapper").first();
            }

            if ($wrapper.length > 0) {
              var perPage =
                eventsPerPage ||
                parseInt($wrapper.data("events-per-page")) ||
                6;

              // Check if we're using Load More pagination
              var paginationType = $wrapper.data("pagination-type");
              var effectiveLimit = perPage;

              if (paginationType === "load_more") {
                // For Load More, calculate accumulated limit based on current page
                var $loadMoreBtn = $wrapper.find(".seamless-load-more-btn");
                if ($loadMoreBtn.length > 0) {
                  var currentPage =
                    parseInt($loadMoreBtn.data("current-page")) || 1;
                  // Allow perPage * currentPage items (e.g., page 2 = 12 items, page 3 = 18 items)
                  effectiveLimit = perPage * currentPage;
                }
              }

              // Check if calendar view - don't limit
              var $eventWrapper = $wrapper.find("#eventWrapper");
              if ($eventWrapper.length > 0) {
                var $calendarView = $eventWrapper.find("#calendar_view");
                var isCalendarView =
                  $calendarView.length > 0 && !$calendarView.hasClass("hidden");
                if (isCalendarView) {
                  return; // Don't limit calendar
                }
              }

              // Find container - could be .seamless-event-list or .event-grid
              var $container = $node.closest(
                ".seamless-event-list, .event-grid",
              );
              if ($container.length === 0) {
                $container = $node.parent();
              }

              // Find all event items in the container
              var $allItems = $container.find(
                ".event-item, .event-item-modern, .event-card",
              );

              // If no items found, check if node itself is container
              if (
                $allItems.length === 0 &&
                ($container.hasClass("event-grid") ||
                  $container.hasClass("seamless-event-list"))
              ) {
                $allItems = $container.children(
                  ".event-item, .event-item-modern, .event-card",
                );
              }

              // Hide items beyond the effective limit
              if ($allItems.length > effectiveLimit) {
                $allItems.each(function (index) {
                  if (index >= effectiveLimit) {
                    // Use inline style for immediate effect
                    this.style.display = "none";
                  } else {
                    // Ensure visible items are shown
                    if (this.style.display === "none") {
                      this.style.display = "";
                    }
                  }
                });
              }
            }
          });
        }
      };

      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(processNode);
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    },

    /**
     * Handle search bar visibility based on show_search_bar setting
     */
    handleSearchBarVisibility: function () {
      var self = this;

      // Function to check and update search bar visibility
      var updateSearchBarVisibility = function () {
        $(".seamless-elementor-wrapper").each(function () {
          var $wrapper = $(this);
          var showSearch = $wrapper.data("show-search");

          // Convert string to boolean
          var shouldShow = showSearch === "true" || showSearch === true;

          // Find the search bar container
          var $eventWrapper = $wrapper.find("#eventWrapper");
          if ($eventWrapper.length === 0) {
            return;
          }

          // Hide/show the entire hero-section (contains filter-form and search bar)
          var $heroSection = $eventWrapper.find(".hero-section");
          var $filterForm = $eventWrapper.find(".filter-form");
          var $filterControls = $eventWrapper.find(".filter-controls");
          var $searchBar = $eventWrapper.find(".event-search-filter");
          // ND searchbar section (new without-dropdown template)
          var $ndSearchbar = $eventWrapper.find(
            ".seamless-nd-searchbar-section",
          );

          if ($ndSearchbar.length > 0) {
            // ND template – just show/hide the whole searchbar section
            if (shouldShow) {
              $ndSearchbar.show();
            } else {
              $ndSearchbar.hide();
            }
          } else if ($heroSection.length > 0) {
            if (shouldShow) {
              $heroSection.show();
            } else {
              $heroSection.hide();
            }
          } else if ($filterForm.length > 0) {
            if (shouldShow) {
              $filterForm.show();
            } else {
              $filterForm.hide();
            }
          } else if ($filterControls.length > 0) {
            if (shouldShow) {
              $filterControls.show();
            } else {
              $filterControls.hide();
            }
          } else if ($searchBar.length > 0) {
            if (shouldShow) {
              $searchBar.show();
            } else {
              $searchBar.hide();
            }
          }
        });
      };

      // Initial check
      setTimeout(updateSearchBarVisibility, 100);

      // Watch for DOM changes (e.g., after AJAX calls)
      if (typeof MutationObserver !== "undefined") {
        var observer = new MutationObserver(function (mutations) {
          var shouldUpdate = false;

          mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length > 0) {
              $(mutation.addedNodes).each(function () {
                var $node = $(this);
                if (
                  $node.hasClass("hero-section") ||
                  $node.hasClass("filter-form") ||
                  $node.hasClass("filter-controls") ||
                  $node.hasClass("event-search-filter") ||
                  $node.find(
                    ".hero-section, .filter-form, .filter-controls, .event-search-filter",
                  ).length > 0 ||
                  $node.hasClass("seamless-elementor-wrapper") ||
                  $node.find(".seamless-elementor-wrapper").length > 0
                ) {
                  shouldUpdate = true;
                  return false;
                }
              });
            }
          });

          if (shouldUpdate) {
            setTimeout(updateSearchBarVisibility, 50);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }

      // Also listen for AJAX completion
      $(document).ajaxComplete(function () {
        setTimeout(updateSearchBarVisibility, 100);
      });
    },

    /**
     * Handle Filter By dropdown visibility and functionality
     */
    handleFilterBy: function () {
      var self = this;

      // Function to create/update filter by dropdown
      var updateFilterBy = function () {
        $(".seamless-elementor-wrapper").each(function () {
          var $wrapper = $(this);
          var showSearch = $wrapper.data("show-search");
          var filterByType = $wrapper.data("filter-by-type") || "none";

          var $eventWrapper = $wrapper.find("#eventWrapper");
          if ($eventWrapper.length === 0) return;

          // ---------------------------------------------------------------
          // ND Template path: the without-dropdown template already has its
          // own filter panel managed by initNDSearchbar() in seamless.js.
          // We just fire a custom event so it can re-apply filter-by-type,
          // then skip the old <select> injection entirely.
          // ---------------------------------------------------------------
          if (
            $eventWrapper.hasClass("seamless-event-wrapper-without-dropdown")
          ) {
            // Clean up any old selects that may linger from a previous template
            $eventWrapper
              .find(
                "#seamless-filter-by-category, #seamless-filter-by-tag, #seamless-filter-by-select",
              )
              .remove();
            // Notify seamless.js to re-evaluate filter-by-type visibility
            $(document).trigger("seamless:nd:filterByType", [$wrapper]);
            return;
          }

          // ---------------------------------------------------------------
          // Legacy template path (tpl-event-wrapper.php with .hero-section)
          // ---------------------------------------------------------------

          // Only show if search bar is enabled and filter type is not "none"
          var shouldShow =
            (showSearch === "true" || showSearch === true) &&
            filterByType !== "none";

          if (!shouldShow) {
            // Remove existing filter selects if any
            $wrapper
              .find(
                "#eventWrapper #seamless-filter-by-select, #eventWrapper #seamless-filter-by-category, #eventWrapper #seamless-filter-by-tag",
              )
              .remove();
            return;
          }

          var $searchFilter = $eventWrapper.find(".event-search-filter");
          if ($searchFilter.length === 0) return;

          // Remove existing filter selects if any
          $searchFilter
            .find(
              "#seamless-filter-by-category, #seamless-filter-by-tag, #seamless-filter-by-select",
            )
            .remove();

          // Get insertion point
          var $searchInput = $searchFilter.find(".search-input");
          var $sortSelect = $searchFilter.find("#sort_by");
          var $insertPoint =
            $sortSelect.length > 0
              ? $sortSelect
              : $searchInput.length > 0
                ? $searchInput
                : null;

          // Create filter selects based on filter type
          if (filterByType === "all") {
            var $categorySelect = $("<select>", {
              class:
                "sort-select seamless-filter-by-select seamless-filter-by-category",
              id: "seamless-filter-by-category",
            });
            $categorySelect.append(
              $("<option>", { value: "", text: "Category" }),
            );

            var $tagSelect = $("<select>", {
              class:
                "sort-select seamless-filter-by-select seamless-filter-by-tag",
              id: "seamless-filter-by-tag",
            });
            $tagSelect.append($("<option>", { value: "", text: "Tag" }));

            if ($insertPoint && $insertPoint.length > 0) {
              $insertPoint.before($categorySelect);
              $insertPoint.before($tagSelect);
            } else {
              $searchFilter.append($categorySelect);
              $searchFilter.append($tagSelect);
            }
            self.populateCategoryDropdown($categorySelect, $wrapper);
          } else if (filterByType === "category") {
            var $categorySelect = $("<select>", {
              class:
                "sort-select seamless-filter-by-select seamless-filter-by-category",
              id: "seamless-filter-by-category",
            });
            $categorySelect.append(
              $("<option>", { value: "", text: "Category" }),
            );

            if ($insertPoint && $insertPoint.length > 0) {
              $insertPoint.before($categorySelect);
            } else {
              $searchFilter.append($categorySelect);
            }
            self.populateCategoryDropdown($categorySelect, $wrapper);
          } else if (filterByType === "tag") {
            var $tagSelect = $("<select>", {
              class:
                "sort-select seamless-filter-by-select seamless-filter-by-tag",
              id: "seamless-filter-by-tag",
            });
            $tagSelect.append($("<option>", { value: "", text: "Tag" }));

            if ($insertPoint && $insertPoint.length > 0) {
              $insertPoint.before($tagSelect);
            } else {
              $searchFilter.append($tagSelect);
            }
          }
        });
      };

      // Initial setup
      setTimeout(updateFilterBy, 200);

      // Watch for DOM changes
      if (typeof MutationObserver !== "undefined") {
        var observer = new MutationObserver(function (mutations) {
          var shouldUpdate = false;

          mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length > 0) {
              $(mutation.addedNodes).each(function () {
                var $node = $(this);
                if (
                  $node.hasClass("event-search-filter") ||
                  $node.hasClass("hero-section") ||
                  $node.find(".event-search-filter, .hero-section").length >
                    0 ||
                  $node.hasClass("seamless-elementor-wrapper") ||
                  $node.find(".seamless-elementor-wrapper").length > 0
                ) {
                  shouldUpdate = true;
                  return false;
                }
              });
            }
          });

          if (shouldUpdate) {
            setTimeout(updateFilterBy, 100);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }

      // Listen for AJAX completion to repopulate categories after events load
      $(document).ajaxComplete(function () {
        setTimeout(updateFilterBy, 150);
        // Try to populate dropdowns again after events are loaded
        setTimeout(function () {
          self.populateAllCategoryDropdowns();
        }, 500);
      });
    },

    /**
     * Handle reset button to preserve current view
     * Note: The seamless.js reset handler has been updated to respect
     * the Elementor widget's default_view setting, so we just let it handle everything.
     */
    handleResetButton: function () {
      // The seamless.js reset handler now properly respects the Elementor widget's
      // data-default-view attribute. For all Elementor widgets, we let the
      // seamless plugin handle the reset to avoid conflicts and visibility issues.

      $(document).on("click", "#reset_btn, .reset-button", function (e) {
        var $button = $(this);
        var $wrapper = $button.closest(".seamless-elementor-wrapper");

        // If this is an Elementor widget, let the seamless plugin's handler manage it
        // This prevents visibility conflicts and the AJAX double-loading issue
        if ($wrapper.length > 0) {
          // Just let the event bubble to seamless.js
          return;
        }

        // For non-widget contexts, we could add custom logic here if needed
        // Currently we just let seamless.js handle everything
      });
    },

    /**
     * Populate a category dropdown with categories from events
     *
     * @param {jQuery} $dropdown - The dropdown element to populate
     * @param {jQuery} $wrapper - The wrapper element containing events
     */
    /**
     * Populate a category dropdown with categories from events
     *
     * @param {jQuery} $dropdown - The dropdown element to populate
     * @param {jQuery} $wrapper - The wrapper element containing events
     */
    populateCategoryDropdown: function ($dropdown, $wrapper) {
      var self = this;

      // Try to use the new SeamlessAPI first
      if (
        window.SeamlessAPI &&
        typeof window.SeamlessAPI.getCategories === "function"
      ) {
        window.SeamlessAPI.getCategories()
          .then(function (response) {
            var categories = response.data || [];
            if (categories && categories.length > 0) {
              self.addCategoriesToDropdown($dropdown, categories);
            } else {
              self.extractCategoriesFromEvents($dropdown, $wrapper);
            }
          })
          .catch(function (err) {
            console.error("[Seamless Widget] Error fetching categories:", err);
            self.extractCategoriesFromEvents($dropdown, $wrapper);
          });
      }
      // Fallback to old global function
      else if (typeof window.seamlessFetchCategories === "function") {
        window.seamlessFetchCategories(function (categories) {
          if (categories && categories.length > 0) {
            self.addCategoriesToDropdown($dropdown, categories);
          } else {
            self.extractCategoriesFromEvents($dropdown, $wrapper);
          }
        });
      } else {
        // Fallback: extract categories from events in DOM
        self.extractCategoriesFromEvents($dropdown, $wrapper);
      }
    },

    /**
     * Extract categories from events in the DOM and add to dropdown
     *
     * @param {jQuery} $dropdown - The dropdown element to populate
     * @param {jQuery} $wrapper - The wrapper element containing events
     */
    extractCategoriesFromEvents: function ($dropdown, $wrapper) {
      var categories = [];
      var categoryMap = {};

      // Try to get categories from event elements
      var $eventWrapper = $wrapper.find("#eventWrapper");
      if ($eventWrapper.length === 0) {
        $eventWrapper = $("#eventWrapper");
      }

      // Look for event items with category data
      $eventWrapper
        .find(".event-item, .event-item-modern, .event-card")
        .each(function () {
          var $event = $(this);
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

      this.addCategoriesToDropdown($dropdown, categories);
    },

    /**
     * Add categories as options to a dropdown (including children)
     *
     * @param {jQuery} $dropdown - The dropdown element
     * @param {Array} categories - Array of category objects
     */
    addCategoriesToDropdown: function ($dropdown, categories) {
      if (!$dropdown || $dropdown.length === 0) {
        return;
      }

      // Get current value to restore after population
      var currentValue = $dropdown.val();

      // Remove all options except the first one (placeholder)
      $dropdown.find("option:not(:first)").remove();

      // Helper function to process categories recursively
      var processCategories = function (list, level) {
        list.forEach(function (cat) {
          var prefix = "";
          if (level > 0) {
            // Add indentation based on depth
            prefix = "\u00A0".repeat(level * 4) + "— ";
          }

          var optionText = prefix + (cat.name || cat.label || "Unknown");

          $dropdown.append(
            $("<option>", {
              value: cat.id,
              text: optionText,
            }),
          );

          // Process children if any exist
          if (
            cat.children &&
            Array.isArray(cat.children) &&
            cat.children.length > 0
          ) {
            processCategories(cat.children, level + 1);
          }
        });
      };

      // Start processing at level 0
      processCategories(categories, 0);

      // Restore previous value if it still exists
      if (
        currentValue &&
        $dropdown.find('option[value="' + currentValue + '"]').length > 0
      ) {
        $dropdown.val(currentValue);
      }

      // Bind change event to filter events
      $dropdown
        .off("change.seamlessFilter")
        .on("change.seamlessFilter", function () {
          // Use the global trigger function for immediate filtering
          if (typeof window.seamlessTriggerFilter === "function") {
            window.seamlessTriggerFilter();
          } else if (typeof window.seamlessFilterByCategories === "function") {
            window.seamlessFilterByCategories();
          } else {
            // Fallback: trigger sort dropdown change
            $("#sort_by").trigger("change");
          }
        });
    },

    /**
     * Populate all category dropdowns on the page
     */
    populateAllCategoryDropdowns: function () {
      var self = this;

      $(".seamless-elementor-wrapper").each(function () {
        var $wrapper = $(this);
        var $categoryDropdown = $wrapper.find("#seamless-filter-by-category");

        if (
          $categoryDropdown.length > 0 &&
          $categoryDropdown.find("option").length <= 1
        ) {
          self.populateCategoryDropdown($categoryDropdown, $wrapper);
        }
      });
    },

    /**
     * Handle pagination type based on widget settings
     */
    handlePaginationType: function () {
      var self = this;

      // Initial setup
      $(".seamless-elementor-wrapper").each(function () {
        var $wrapper = $(this);
        self.setupPaginationForWrapper($wrapper);

        // Setup an observer on the wrapper to catch any content changes (initial load, filters, etc)
        // This is robust against the entire #eventWrapper being replaced
        var observer = new MutationObserver(function (mutations) {
          var shouldUpdate = false;
          mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length > 0) {
              shouldUpdate = true;
            }
          });

          if (shouldUpdate) {
            // Debounce the update
            if (self._paginationTimeout) clearTimeout(self._paginationTimeout);
            self._paginationTimeout = setTimeout(function () {
              self.setupPaginationForWrapper($wrapper);
              self.updateLoadMoreVisibility();
            }, 100);
          }
        });

        observer.observe($wrapper[0], {
          childList: true,
          subtree: true,
        });
      });

      self.updateLoadMoreVisibility();

      // Also react when the user changes view (list / grid / calendar)
      $(document).on("click", ".view-toggle", function () {
        setTimeout(function () {
          self.updateLoadMoreVisibility();
        }, 200);
      });

      // Hook into AJAX complete as a backup
      $(document).ajaxComplete(function () {
        setTimeout(function () {
          $(".seamless-elementor-wrapper").each(function () {
            self.setupPaginationForWrapper($(this));
          });
          self.updateLoadMoreVisibility();
        }, 200);
      });
    },

    /**
     * Setup pagination for a specific wrapper
     */
    setupPaginationForWrapper: function ($wrapper) {
      var self = this;
      var paginationType = $wrapper.data("pagination-type") || "numbers";
      var $eventWrapper = $wrapper.find("#eventWrapper");
      var $existingPagination = $eventWrapper.find("#pagination");

      if (paginationType === "none") {
        // Hide all pagination
        $existingPagination.hide();
        $wrapper.find(".seamless-pagination-wrapper").remove();
        return;
      }

      if (paginationType === "load_more") {
        // Hide native pagination and create load more button
        $existingPagination.hide();
        self.createLoadMoreButton($wrapper);
      } else if (paginationType === "numbers") {
        // Show native pagination, enhance it
        $existingPagination.show();
        self.enhanceNumbersPagination($wrapper);
      }
    },

    /**
     * Enhance numbers pagination with custom styling
     */
    enhanceNumbersPagination: function ($wrapper) {
      var showPrevNext =
        $wrapper.data("show-prev-next") === "true" ||
        $wrapper.data("show-prev-next") === true;
      var prevText = $wrapper.data("prev-text") || "« Previous";
      var nextText = $wrapper.data("next-text") || "Next »";
      var $eventWrapper = $wrapper.find("#eventWrapper");
      var $pagination = $eventWrapper.find("#pagination");

      if ($pagination.length === 0) return;

      // Wrap pagination if not already wrapped
      if (!$pagination.closest(".seamless-pagination-wrapper").length) {
        $pagination.wrap(
          '<div class="seamless-pagination-wrapper seamless-pagination-numbers"></div>',
        );
      }

      // Update prev/next button text ONLY if specific classes exist
      if (showPrevNext) {
        // Look for dedicated prev/next classes first
        var $prevLink = $pagination.find(".seamless-prev");
        var $nextLink = $pagination.find(".seamless-next");

        if ($prevLink.length > 0) {
          $prevLink.text(prevText);
        } else {
          // Fallback: Check if first child is NOT a number
          var $first = $pagination.find(".seamless-page-link:first-child");
          var firstText = $first.text().trim();
          // Simple heuristic: if it's not a number, it might be Prev
          if ($first.length > 0 && isNaN(parseInt(firstText))) {
            $first.text(prevText);
          }
        }

        if ($nextLink.length > 0) {
          $nextLink.text(nextText);
        } else {
          // Fallback: Check if last child is NOT a number
          var $last = $pagination.find(".seamless-page-link:last-child");
          var lastText = $last.text().trim();
          if ($last.length > 0 && isNaN(parseInt(lastText))) {
            $last.text(nextText);
          }
        }
      }
    },

    /**
     * Create load more button
     */
    createLoadMoreButton: function ($wrapper) {
      var self = this;
      var loadMoreText = $wrapper.data("load-more-text") || "Load More";
      var alignment = $wrapper.data("load-more-alignment") || "center";
      var showSpinner =
        $wrapper.data("show-spinner") === "true" ||
        $wrapper.data("show-spinner") === true;
      var $eventWrapper = $wrapper.find("#eventWrapper");

      console.log("createLoadMoreButton called");
      console.log("$eventWrapper found:", $eventWrapper.length);

      // Check if we already have a load more button
      var $existingLoadMore = $wrapper.find(".seamless-load-more-wrapper");
      if ($existingLoadMore.length > 0) {
        console.log("Load more button already exists, updating");
        // Update the button if needed
        self.updateLoadMoreButton($wrapper);
        return;
      }

      // Get pagination info from existing pagination
      var $pagination = $eventWrapper.find("#pagination");
      console.log("$pagination found:", $pagination.length);
      console.log("$pagination HTML:", $pagination.html());

      var totalPages = 1;
      var currentPage = 1;

      // Try to get total pages from pagination links - check multiple possible selectors
      var $pageLinks = $pagination.find(".seamless-page-link[data-page]");
      console.log("$pageLinks found:", $pageLinks.length);

      // If no page links found with data-page, try alternative selectors
      if ($pageLinks.length === 0) {
        $pageLinks = $pagination.find("button[data-page], a[data-page]");
        console.log("Alternative $pageLinks found:", $pageLinks.length);
      }

      if ($pageLinks.length > 0) {
        $pageLinks.each(function () {
          var page =
            parseInt($(this).data("page")) ||
            parseInt($(this).attr("data-page"));
          console.log("Page link found with page:", page);
          if (page > totalPages) totalPages = page;
        });
        // Get current page - use seamless-active class
        var $activePage = $pagination.find(
          ".seamless-page-link.seamless-active, .seamless-active[data-page]",
        );
        if ($activePage.length > 0) {
          currentPage =
            parseInt($activePage.data("page")) ||
            parseInt($activePage.attr("data-page")) ||
            1;
        }
      }

      console.log("totalPages:", totalPages, "currentPage:", currentPage);

      // Don't show load more if only one page
      if (totalPages <= 1) {
        console.log("Only one page, not showing load more button");
        return;
      }

      console.log("Creating load more button");

      // Create the load more wrapper and button
      var alignmentClass = "text-" + alignment;

      // Get custom spinner icon from data attribute
      var spinnerIconHtml = "";
      if (showSpinner) {
        var spinnerIconData = $wrapper.data("spinner-icon");
        if (spinnerIconData) {
          try {
            spinnerIconHtml = atob(spinnerIconData); // Decode base64
          } catch (e) {
            console.warn("Failed to decode spinner icon:", e);
          }
        }

        // Fallback to default Font Awesome spinner if no custom icon
        if (!spinnerIconHtml) {
          spinnerIconHtml =
            '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
        }
      }

      var spinnerHtml = showSpinner
        ? '<span class="seamless-spinner" style="display: none;">' +
          spinnerIconHtml +
          "</span>"
        : "";

      var $loadMoreWrapper = $(
        '<div class="seamless-pagination-wrapper seamless-load-more-wrapper ' +
          alignmentClass +
          '" style="text-align: ' +
          alignment +
          ';"></div>',
      );
      var $loadMoreBtn = $(
        '<button type="button" class="seamless-load-more-btn elementor-button elementor-size-md" data-current-page="' +
          currentPage +
          '" data-total-pages="' +
          totalPages +
          '">' +
          spinnerHtml +
          '<span class="btn-text">' +
          loadMoreText +
          "</span></button>",
      );

      $loadMoreWrapper.append($loadMoreBtn);

      // Insert after event list/grid
      var $eventList = $eventWrapper.find(".seamless-event-list, .event_grid");
      console.log("$eventList found:", $eventList.length);

      if ($eventList.length > 0) {
        $eventList.after($loadMoreWrapper);
        console.log("Load more button inserted after event list");
      } else {
        $eventWrapper.append($loadMoreWrapper);
        console.log("Load more button appended to eventWrapper");
      }

      // Bind click event
      $loadMoreBtn.off("click.loadMore").on("click.loadMore", function () {
        self.handleLoadMore($wrapper, $(this));
      });
    },

    /**
     * Update load more button state
     */
    updateLoadMoreButton: function ($wrapper) {
      var self = this;
      var $eventWrapper = $wrapper.find("#eventWrapper");
      var $pagination = $eventWrapper.find("#pagination");
      var $loadMoreBtn = $wrapper.find(".seamless-load-more-btn");

      if ($loadMoreBtn.length === 0) return;

      // Get current pagination state
      var totalPages = 1;
      var currentPage = 1;

      var $pageLinks = $pagination.find(".seamless-page-link[data-page]");
      if ($pageLinks.length > 0) {
        $pageLinks.each(function () {
          var page = parseInt($(this).data("page"));
          if (page > totalPages) totalPages = page;
        });

        var $activePage = $pagination.find(
          ".seamless-page-link.seamless-active",
        );
        if ($activePage.length > 0) {
          currentPage = parseInt($activePage.data("page")) || 1;
        }
      }

      $loadMoreBtn.data("current-page", currentPage);
      $loadMoreBtn.data("total-pages", totalPages);

      // Hide if no more pages
      if (currentPage >= totalPages) {
        $loadMoreBtn.parent().hide();
      } else {
        $loadMoreBtn.parent().show();
      }
    },

    /**
     * Handle load more button click
     */
    /**
     * Handle load more button click
     */
    /**
     * Handle load more button click
     */
    handleLoadMore: function ($wrapper, $btn) {
      var self = this;
      var loadingText = $wrapper.data("load-more-loading-text") || "Loading...";
      var originalText = $wrapper.data("load-more-text") || "Load More";
      var showSpinner =
        $wrapper.data("show-spinner") === "true" ||
        $wrapper.data("show-spinner") === true;

      var currentPage = parseInt($btn.data("current-page")) || 1;
      var totalPages = parseInt($btn.data("total-pages")) || 1;
      var nextPage = currentPage + 1;

      if (nextPage > totalPages) {
        $btn.parent().hide();
        return;
      }

      // Show loading state
      $btn.prop("disabled", true);
      $btn.find(".btn-text").text(loadingText);
      if (showSpinner) {
        $btn.find(".seamless-spinner").show();
      }

      // Find and click the next page link in hidden pagination
      var $eventWrapper = $wrapper.find("#eventWrapper");
      var $pagination = $eventWrapper.find("#pagination");
      var $nextPageLink = $pagination.find(
        '.seamless-page-link[data-page="' + nextPage + '"]',
      );

      if ($nextPageLink.length > 0) {
        // Store current events before loading - clone the actual DOM elements
        var $eventList = $eventWrapper.find(
          ".seamless-event-list, .event_grid",
        );
        var $currentEvents;

        // Check if we are in grid or list view and clone existing items
        var $existingGrid = $eventList.find(".event-grid");
        if ($existingGrid.length > 0) {
          // Grid view - clone all event cards
          $currentEvents = $existingGrid.find(".event-card").clone(true);
        } else {
          // List view - clone all event items
          $currentEvents = $eventList
            .find(".event-item, .event-item-modern")
            .clone(true);
        }

        // Temporarily disable the immediate hiding observer
        self.disableImmediateHiding = true;

        // Trigger the page link click
        $nextPageLink.trigger("click");

        // After content loads, append new events instead of replacing
        setTimeout(function () {
          // Re-enable immediate hiding for future operations
          self.disableImmediateHiding = false;

          // Reset button state
          $btn.prop("disabled", false);
          $btn.find(".btn-text").text(originalText);
          $btn.find(".seamless-spinner").hide();

          // Update button data
          $btn.data("current-page", nextPage);

          // Append newly loaded events AFTER existing ones
          var $updatedEventList = $eventWrapper.find(
            ".seamless-event-list, .event_grid",
          );

          if (
            $updatedEventList.length &&
            $currentEvents &&
            $currentEvents.length > 0
          ) {
            // Check if we are dealing with a grid view
            var $gridContainer = $updatedEventList.find(".event-grid");

            if ($gridContainer.length > 0) {
              // Grid view - prepend old events to the grid container
              $gridContainer.prepend($currentEvents);
            } else {
              // List view - prepend old events to the list container
              $updatedEventList.prepend($currentEvents);
            }

            // Force show all items
            $updatedEventList.find("img.event-image").each(function () {
              if ($(this).attr("src")) {
                $(this).css("display", "block");
                $(this).prev(".loader").hide();
              }
            });

            // Remove any inline display:none that was added by the hiding logic
            $updatedEventList
              .find(".event-item, .event-card, .event-item-modern")
              .each(function () {
                if (this.style.display === "none") {
                  this.style.display = "";
                }
              });
          }

          // Check if we're on the last page
          if (nextPage >= totalPages) {
            $btn.parent().hide();
          }

          // Re-setup pagination after load
          self.setupPaginationForWrapper($wrapper);

          // Ensure visibility matches current view
          self.updateLoadMoreVisibility();
        }, 300);
      } else {
        // No more pages
        $btn.prop("disabled", false);
        $btn.find(".btn-text").text(originalText);
        $btn.find(".seamless-spinner").hide();
        $btn.parent().hide();
      }
    },
    /**
     * Update visibility of load more button based on current state
     */
    updateLoadMoreVisibility: function () {
      $(".seamless-elementor-wrapper").each(function () {
        var $wrapper = $(this);

        if ($wrapper.data("pagination-type") !== "load_more") {
          return;
        }

        var $eventWrapper = $wrapper.find("#eventWrapper");

        // FIX ISSUE 3: Robust check for Calendar View visibility
        var $calendarView = $eventWrapper.length
          ? $eventWrapper.find("#calendar_view")
          : $("#calendar_view");

        var isCalendarView = false;
        if ($calendarView.length > 0) {
          if (
            $calendarView.is(":visible") &&
            !$calendarView.hasClass("hidden") &&
            $calendarView.css("display") !== "none"
          ) {
            isCalendarView = true;
          }
        }

        if ($("#current_view").val() === "calendar") {
          isCalendarView = true;
        }

        var $loadMoreWrapper = $wrapper.find(".seamless-load-more-wrapper");
        if ($loadMoreWrapper.length === 0) {
          return;
        }

        if (isCalendarView) {
          $loadMoreWrapper.hide();
        } else {
          // Check for "No events found" message first
          var $eventList = $eventWrapper.find(
            ".seamless-event-list, .event_grid",
          );
          var noEventsFound = false;

          // Check if the event list contains "No events found" text
          if ($eventList.length > 0) {
            var listText = $eventList.text().toLowerCase();
            if (
              listText.indexOf("no events found") !== -1 ||
              listText.indexOf("no events") !== -1 ||
              listText.indexOf("no results") !== -1
            ) {
              noEventsFound = true;
            }
          }

          // Also check if there's a specific no-events element
          if (
            $eventWrapper.find(".no-events, .no-results, .event-not-found")
              .length > 0
          ) {
            noEventsFound = true;
          }

          if (noEventsFound) {
            $loadMoreWrapper.hide();
            return;
          }

          // Check if there are more pages by looking at the generated pagination
          var $pagination = $eventWrapper.find("#pagination");
          var hasNext = $pagination.find(".seamless-next").length > 0;
          var hasPagination = $pagination.children().length > 0;

          // Also check if we have enough events to show the load more button
          var eventsPerPage =
            parseInt($wrapper.data("events-per-page")) ||
            this.getEventsPerPage();
          var currentEventCount = 0;

          // Count visible events
          var $gridContainer = $eventList.find(".event-grid");
          if ($gridContainer.length > 0) {
            currentEventCount = $gridContainer.find(".event-card").length;
          } else {
            currentEventCount = $eventList.find(
              ".event-item, .event-item-modern",
            ).length;
          }

          // Simplified check: Just show if there is pagination and a next link
          // This allows it to work even if "events per page" is 1 and we have 1 event displayed
          if (hasPagination && hasNext) {
            $loadMoreWrapper.show();
          } else {
            $loadMoreWrapper.hide();
          }
        }
      });
    },

    /**
     * Override default sort to always use "all" for Elementor widget
     * Note: The main logic is now in seamless.js which checks for .seamless-elementor-wrapper
     * This method just ensures the value stays correct if needed
     */
    overrideDefaultSort: function () {
      // The seamless.js file now handles the Elementor widget context check
      // and sets the sort to "all" automatically during initialization.
      // This method is kept as a safety net but is mostly redundant now.

      // Just ensure the sort value is "all" after a short delay as a fallback
      setTimeout(function () {
        $(".seamless-elementor-wrapper").each(function () {
          var $wrapper = $(this);
          var $eventWrapper = $wrapper.find("#eventWrapper");

          if ($eventWrapper.length > 0) {
            var $sortSelect = $eventWrapper.find("#sort_by");
            if ($sortSelect.length > 0 && $sortSelect.val() !== "all") {
              $sortSelect.val("all");
            }
          }
        });
      }, 100);
    },
  };

  /**
   * Initialize on document ready
   */
  $(document).ready(function () {
    SeamlessEventsWidget.init();
  });
})(jQuery);
