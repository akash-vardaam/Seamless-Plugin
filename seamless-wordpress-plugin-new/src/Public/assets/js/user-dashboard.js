/**
 * User Dashboard Widget JavaScript
 * Handles sidebar navigation, membership tabs, and order pagination
 */

(function ($) {
  "use strict";

  class UserDashboardWidget {
    constructor($widget) {
      if ($widget.data("seamless-dashboard-initialized")) {
        return;
      }
      $widget.data("seamless-dashboard-initialized", true);

      this.$widget = $widget;
      this.widgetId = $widget.data("widget-id");
      this.$modal = $("#seamless-user-dashboard-modal-" + this.widgetId);
      this.$form = $("#seamless-user-dashboard-form-" + this.widgetId);
      this.init();
    }

    init() {
      this.bindNavigation();
      this.bindMembershipTabs();
      this.bindEditProfile();
      // bindModalClose is deprecated/empty
      this.bindFormSubmit();
      this.bindPagination();

      // Initialize modals with delegation
      this.initUpgradeModal();
      this.initCancelModal();
      this.initRequestRemovalModal();
      this.initCancelScheduledModal();
      this.initRenewModal();
      this.initOrganization();

      this.loadActiveView();
      this.loadDashboardData();
    }

    /**
     * Load all dashboard data in parallel
     */
    loadDashboardData() {
      // Check which tabs/sections are requested via the DOM presence of containers
      if (this.$widget.find("#seamless-dashboard-profile-container").length) {
        this.fetchSection("profile", "seamless-dashboard-profile-container");
      }
      if (
        this.$widget.find("#seamless-dashboard-memberships-container").length
      ) {
        this.fetchSection(
          "memberships",
          "seamless-dashboard-memberships-container",
        );
      }
      if (this.$widget.find("#seamless-dashboard-courses-container").length) {
        this.fetchSection("courses", "seamless-dashboard-courses-container");
      }
      if (this.$widget.find("#seamless-dashboard-orders-container").length) {
        this.fetchSection("orders", "seamless-dashboard-orders-container");
      }
      if (
        this.$widget.find("#seamless-dashboard-organization-container").length
      ) {
        this.fetchSection(
          "organization",
          "seamless-dashboard-organization-container",
        );
      }
    }

    /**
     * Fetch a specific section via AJAX
     */
    fetchSection(section, containerId) {
      const self = this;
      const $container = this.$widget.find("#" + containerId);

      // Prioritize Core nonce (seamless_ajax) because these actions are handled by SeamlessRender (Core)
      // Fallback to Addon data if Core is missing (rare case)
      let ajaxUrl, nonce;

      if (typeof seamless_ajax !== "undefined") {
        ajaxUrl = seamless_ajax.ajax_url;
        nonce = seamless_ajax.nonce;
      } else if (typeof seamlessAddonData !== "undefined") {
        ajaxUrl = seamlessAddonData.ajaxUrl;
        nonce = seamlessAddonData.nonce;
      } else {
        console.error("Seamless dashboard: No AJAX configuration found.");
        $container.html(
          '<div class="seamless-user-dashboard-error"><p>Configuration error.</p></div>',
        );
        return;
      }

      const requestData = {
        action: "seamless_get_dashboard_" + section,
        nonce: nonce,
        widget_id: this.widgetId,
      };

      // Pass orders_per_page for orders section
      if (
        section === "orders" &&
        typeof seamlessUserDashboard !== "undefined" &&
        seamlessUserDashboard.ordersPerPage
      ) {
        requestData.orders_per_page = seamlessUserDashboard.ordersPerPage;
      }

      $.ajax({
        url: ajaxUrl,
        type: "POST",
        data: requestData,
        success: function (response) {
          if (response.success && response.data.html) {
            $container.html(response.data.html);
            // Reset pagination for the loaded section and update all
            if (section === "orders") {
              self.orderPage = 1;
            } else if (section === "memberships") {
              self.activeMembershipPage = 1;
              self.expiredMembershipPage = 1;
            } else if (section === "courses") {
              self.enrolledCoursePage = 1;
              self.includedCoursePage = 1;
            }

            // Update pagination after a short delay to ensure DOM is ready
            setTimeout(function () {
              self.updateAllPagination();
            }, 100);
          } else {
            $container.html(
              '<div class="seamless-user-dashboard-error"><p>' +
                (response.data.message || "Failed to load content.") +
                "</p></div>",
            );
          }
        },
        error: function () {
          $container.html(
            '<div class="seamless-user-dashboard-error"><p>Network error. Please try again.</p></div>',
          );
        },
      });
    }

    /**
     * Load active view from session storage
     */
    loadActiveView() {
      const savedView = sessionStorage.getItem(
        "seamless-user-dashboard-active-view-" + this.widgetId,
      );
      if (savedView) {
        this.switchView(savedView);
      }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast: 'success', 'error', 'info'
     * @param {number} duration - Duration in milliseconds (default: 10000)
     */
    showToast(message, type = "success", duration = 6000) {
      // Remove any existing toasts
      $(".seamless-toast").remove();

      // Create toast element
      const $toast = $(`
        <div class="seamless-toast seamless-toast-${type}">
          <div class="seamless-toast-icon">
            ${
              type === "success"
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
                : type === "error"
                  ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
                  : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
            }
          </div>
          <div class="seamless-toast-message">${message}</div>
          <button class="seamless-toast-close" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      `);

      // Append to body
      $("body").append($toast);

      // Trigger animation
      setTimeout(() => $toast.addClass("seamless-toast-show"), 10);

      // Close button handler
      $toast.find(".seamless-toast-close").on("click", function () {
        $toast.removeClass("seamless-toast-show");
        setTimeout(() => $toast.remove(), 6000);
      });

      // Auto dismiss
      setTimeout(() => {
        $toast.removeClass("seamless-toast-show");
        setTimeout(() => $toast.remove(), 6000);
      }, duration);
    }

    /**
     * Handle sidebar navigation
     */
    bindNavigation() {
      const self = this;
      this.$widget.on(
        "click",
        ".seamless-user-dashboard-nav-item",
        function (e) {
          const $navItem = $(this);

          // Skip if it's the logout link
          if ($navItem.hasClass("seamless-user-dashboard-nav-logout")) {
            return;
          }

          e.preventDefault();
          const view = $navItem.data("view");
          self.switchView(view);
        },
      );
    }

    /**
     * Switch to a different view
     */
    switchView(view) {
      // Update navigation active state
      this.$widget
        .find(".seamless-user-dashboard-nav-item")
        .removeClass("active");
      this.$widget
        .find('.seamless-user-dashboard-nav-item[data-view="' + view + '"]')
        .addClass("active");

      // Update content view
      this.$widget.find(".seamless-user-dashboard-view").removeClass("active");
      this.$widget
        .find('.seamless-user-dashboard-view[data-view="' + view + '"]')
        .addClass("active");

      // Save to session storage
      sessionStorage.setItem(
        "seamless-user-dashboard-active-view-" + this.widgetId,
        view,
      );

      // Reset pagination when switching views
      const self = this;
      setTimeout(function () {
        self.updateAllPagination();
      }, 100);
    }

    /**
     * Handle tabs (Membership & Courses)
     */
    bindMembershipTabs() {
      const self = this;

      // Event Delegation for Tabs
      this.$widget.on("click", ".seamless-user-dashboard-tab", function () {
        const $tab = $(this);
        const $wrapper = $tab.closest(".seamless-user-dashboard-tabs-wrapper");
        const tabName = $tab.data("tab");

        // Update tab active state within this wrapper only
        $wrapper.find(".seamless-user-dashboard-tab").removeClass("active");
        $tab.addClass("active");

        // Update content within this wrapper only
        $wrapper
          .find(".seamless-user-dashboard-tab-content")
          .removeClass("active");
        $wrapper
          .find(
            '.seamless-user-dashboard-tab-content[data-tab-content="' +
              tabName +
              '"]',
          )
          .addClass("active");

        // Update pagination for the newly shown tab
        setTimeout(function () {
          self.updateAllPagination();
        }, 50);
      });
    }

    /**
     * Handle inline edit profile button click
     */
    bindEditProfile() {
      const self = this;

      // Edit button click
      this.$widget.on(
        "click",
        ".seamless-user-dashboard-btn-edit",
        function () {
          self.enterEditMode();
        },
      );

      // Cancel button click
      this.$widget.on(
        "click",
        ".seamless-user-dashboard-btn-cancel",
        function () {
          self.exitEditMode();
        },
      );

      // Phone number formatting while typing
      this.$widget.on(
        "input",
        "input[name='phone']",
        function (e) {
          let x = e.target.value.replace(/\D/g, "").match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
          e.target.value = !x[2] ? x[1] : "(" + x[1] + ") " + x[2] + (x[3] ? "-" + x[3] : "");
        }
      );

      // Cancel scheduled downgrade button click
      $(document).on(
        "click",
        ".seamless-user-dashboard-cancel-scheduled-btn",
        function () {
          self.handleCancelScheduledDowngrade($(this));
        },
      );

      // Three-dot menu toggle
      $(document).on(
        "click",
        ".seamless-user-dashboard-menu-button",
        function (e) {
          e.preventDefault();
          e.stopPropagation();

          const $button = $(this);
          const $container = $button.closest(
            ".seamless-user-dashboard-menu-container",
          );
          const wasActive = $container.hasClass("active");

          // Close all menus first
          $(".seamless-user-dashboard-menu-container").removeClass("active");

          if (!wasActive) {
            setTimeout(function () {
              $container.addClass("active");
            }, 10);
          }
        },
      );

      // Click outside to close menu
      $(document).on("click", function (e) {
        const $target = $(e.target);

        // Don't close if clicking the button or inside the menu
        if (
          $target.closest(".seamless-user-dashboard-menu-button").length ||
          $target.closest(".seamless-user-dashboard-menu-dropdown").length ||
          $target.closest("#seamless-upgrade-modal").length ||
          $target.closest("#seamless-cancel-modal").length
        ) {
          return;
        }

        // Close all menus
        $(".seamless-user-dashboard-menu-container").removeClass("active");
      });

      // Menu item click - don't auto-close, let modal handle it
      // The dropdown will close when clicking outside or when modal overlay is clicked
    }

    /**
     * Enter edit mode (show form, hide view)
     */
    enterEditMode() {
      // Hide view mode
      this.$widget.find(".seamless-user-dashboard-profile-view-mode").hide();

      // Show edit mode
      this.$widget.find(".seamless-user-dashboard-profile-edit-mode").show();

      // Hide edit button
      this.$widget.find(".seamless-user-dashboard-btn-edit").hide();
    }

    /**
     * Exit edit mode (show view, hide form)
     */
    exitEditMode() {
      // Show view mode
      this.$widget.find(".seamless-user-dashboard-profile-view-mode").show();

      // Hide edit mode
      this.$widget.find(".seamless-user-dashboard-profile-edit-mode").hide();

      // Show edit button
      this.$widget.find(".seamless-user-dashboard-btn-edit").show();

      // Clear any messages
      this.$widget
        .find(".seamless-user-dashboard-form-message")
        .removeClass("success error")
        .hide()
        .text("");
    }

    /**
     * Update profile view with new data (without page reload)
     */
    updateProfileView(data) {
      const fullName = (data.first_name || "") + " " + (data.last_name || "");
      this.$widget
        .find(".seamless-user-dashboard-profile-name")
        .text(fullName.trim());

      const emailValue = data.email || "—";
      this.$widget
        .find(".seamless-user-dashboard-profile-email")
        .text("Email: " + emailValue);

      const fieldMap = {
        first_name: "First Name",
        last_name: "Last Name",
        email: "Email Address",
        phone: "Phone Number",
        address_line_1: "Address Line 1",
        address_line_2: "Address Line 2",
        city: "City",
        state: "State",
        zip_code: "Zip Code",
        country: "Country",
      };

      const selectedCountryName =
        this.$widget
          .find('select[name="country"] option:selected')
          .text()
          .trim() || "";

      const selectedStateName =
        this.$widget
          .find('select[name="state"] option:selected')
          .text()
          .trim() || "";

      this.$widget
        .find(".seamless-user-dashboard-profile-field")
        .each(function () {
          const $field = $(this);
          const label = $field.find("label").text().trim();

          // Find matching data field
          for (const [key, fieldLabel] of Object.entries(fieldMap)) {
            if (label === fieldLabel) {
              let value = data[key] || "—";

              // Special handling for phone with type
              if (key === "phone" && data.phone && data.phone_type) {
                value = data.phone + " (" + data.phone_type + ")";
              }

              if (key === "country" && selectedCountryName) {
                value = selectedCountryName;
              }

              if (key === "state" && selectedStateName) {
                value = selectedStateName;
              }

              $field.find(".seamless-user-dashboard-profile-value").text(value);
              break;
            }
          }
        });
    }

    /**
     * Handle modal close (kept for backward compatibility, but not used)
     */
    bindModalClose() {
      // Modal functionality removed - using inline editing now
    }

    /**
     * Handle form submission
     */
    bindFormSubmit() {
      const self = this;
      this.$widget.on(
        "submit",
        ".seamless-user-dashboard-edit-profile-form",
        function (e) {
          e.preventDefault();
          self.$form = $(this); // Update reference to current form
          self.submitForm();
        },
      );
    }

    /**
     * Handle pagination for orders
     */
    bindPagination() {
      const self = this;

      // Track separate page states for different sections
      this.orderPage = 1;
      this.activeMembershipPage = 1;
      this.expiredMembershipPage = 1;
      this.enrolledCoursePage = 1;
      this.includedCoursePage = 1;

      // Previous button
      this.$widget.on(
        "click",
        ".seamless-user-dashboard-pagination-prev",
        function () {
          const $pagination = $(this).closest(
            ".seamless-user-dashboard-pagination",
          );
          const $container = $pagination.closest(
            ".seamless-user-dashboard-orders-container, .seamless-user-dashboard-memberships-container, .seamless-user-dashboard-courses-container",
          );

          if ($container.hasClass("seamless-user-dashboard-orders-container")) {
            if (self.orderPage > 1) {
              self.orderPage--;
              self.updatePagination(
                $container,
                self.orderPage,
                ".seamless-user-dashboard-order-row",
              );
            }
          } else if (
            $container.hasClass("seamless-user-dashboard-memberships-container")
          ) {
            const $tabContent = $container.closest(
              ".seamless-user-dashboard-tab-content",
            );
            const isActive = $tabContent.data("tab-content") === "active";
            if (isActive && self.activeMembershipPage > 1) {
              self.activeMembershipPage--;
              self.updatePagination(
                $container,
                self.activeMembershipPage,
                ".seamless-user-dashboard-membership-card",
              );
            } else if (!isActive && self.expiredMembershipPage > 1) {
              self.expiredMembershipPage--;
              self.updatePagination(
                $container,
                self.expiredMembershipPage,
                ".seamless-user-dashboard-membership-card",
              );
            }
          } else if (
            $container.hasClass("seamless-user-dashboard-courses-container")
          ) {
            const $tabContent = $container.closest(
              ".seamless-user-dashboard-tab-content",
            );
            const isEnrolled = $tabContent.data("tab-content") === "enrolled";
            if (isEnrolled && self.enrolledCoursePage > 1) {
              self.enrolledCoursePage--;
              self.updatePagination(
                $container,
                self.enrolledCoursePage,
                ".seamless-user-dashboard-course-card",
              );
            } else if (!isEnrolled && self.includedCoursePage > 1) {
              self.includedCoursePage--;
              self.updatePagination(
                $container,
                self.includedCoursePage,
                ".seamless-user-dashboard-course-card",
              );
            }
          }
        },
      );

      // Next button
      this.$widget.on(
        "click",
        ".seamless-user-dashboard-pagination-next",
        function () {
          const $pagination = $(this).closest(
            ".seamless-user-dashboard-pagination",
          );
          const $container = $pagination.closest(
            ".seamless-user-dashboard-orders-container, .seamless-user-dashboard-memberships-container, .seamless-user-dashboard-courses-container",
          );
          const totalPages = parseInt($container.data("total-pages")) || 1;

          if ($container.hasClass("seamless-user-dashboard-orders-container")) {
            if (self.orderPage < totalPages) {
              self.orderPage++;
              self.updatePagination(
                $container,
                self.orderPage,
                ".seamless-user-dashboard-order-row",
              );
            }
          } else if (
            $container.hasClass("seamless-user-dashboard-memberships-container")
          ) {
            const $tabContent = $container.closest(
              ".seamless-user-dashboard-tab-content",
            );
            const isActive = $tabContent.data("tab-content") === "active";
            if (isActive && self.activeMembershipPage < totalPages) {
              self.activeMembershipPage++;
              self.updatePagination(
                $container,
                self.activeMembershipPage,
                ".seamless-user-dashboard-membership-card",
              );
            } else if (!isActive && self.expiredMembershipPage < totalPages) {
              self.expiredMembershipPage++;
              self.updatePagination(
                $container,
                self.expiredMembershipPage,
                ".seamless-user-dashboard-membership-card",
              );
            }
          } else if (
            $container.hasClass("seamless-user-dashboard-courses-container")
          ) {
            const $tabContent = $container.closest(
              ".seamless-user-dashboard-tab-content",
            );
            const isEnrolled = $tabContent.data("tab-content") === "enrolled";
            if (isEnrolled && self.enrolledCoursePage < totalPages) {
              self.enrolledCoursePage++;
              self.updatePagination(
                $container,
                self.enrolledCoursePage,
                ".seamless-user-dashboard-course-card",
              );
            } else if (!isEnrolled && self.includedCoursePage < totalPages) {
              self.includedCoursePage++;
              self.updatePagination(
                $container,
                self.includedCoursePage,
                ".seamless-user-dashboard-course-card",
              );
            }
          }
        },
      );

      // Initial pagination attempt (will just return if no content yet)
      this.updateAllPagination();
    }

    /**
     * Update pagination display for a specific container
     */
    updatePagination($container, currentPage, itemSelector) {
      // Defensive checks
      if (!$container || $container.length === 0) {
        return;
      }

      const perPage = parseInt($container.data("per-page")) || 6;
      const totalPages = parseInt($container.data("total-pages")) || 1;
      const $items = $container.find(itemSelector);

      // If no items found, nothing to paginate
      if (!$items || $items.length === 0) {
        return;
      }

      // Calculate range
      const start = (currentPage - 1) * perPage;
      const end = start + perPage;

      // Show/hide items
      $items.each(function (index) {
        if (index >= start && index < end) {
          $(this).show();
        } else {
          $(this).hide();
        }
      });

      // Update pagination controls within this container
      const $pagination = $container.find(
        ".seamless-user-dashboard-pagination",
      );
      $pagination
        .find(".seamless-user-dashboard-current-page")
        .text(currentPage);
      $pagination.find(".seamless-user-dashboard-total-pages").text(totalPages);

      // Update button states
      $pagination
        .find(".seamless-user-dashboard-pagination-prev")
        .prop("disabled", currentPage === 1);
      $pagination
        .find(".seamless-user-dashboard-pagination-next")
        .prop("disabled", currentPage === totalPages);
    }

    /**
     * Update all pagination instances
     */
    updateAllPagination() {
      // Orders
      const $ordersContainer = this.$widget.find(
        ".seamless-user-dashboard-orders-container",
      );
      if ($ordersContainer.length) {
        this.updatePagination(
          $ordersContainer,
          this.orderPage,
          ".seamless-user-dashboard-order-row",
        );
      }

      // Active memberships
      const $activeMemberships = this.$widget.find(
        ".seamless-user-dashboard-tab-content[data-tab-content='active'] .seamless-user-dashboard-memberships-container",
      );
      if ($activeMemberships.length) {
        this.updatePagination(
          $activeMemberships,
          this.activeMembershipPage,
          ".seamless-user-dashboard-membership-card",
        );
      }

      // Expired memberships
      const $expiredMemberships = this.$widget.find(
        ".seamless-user-dashboard-tab-content[data-tab-content='expired'] .seamless-user-dashboard-memberships-container",
      );
      if ($expiredMemberships.length) {
        this.updatePagination(
          $expiredMemberships,
          this.expiredMembershipPage,
          ".seamless-user-dashboard-membership-card",
        );
      }

      // Enrolled courses
      const $enrolledCourses = this.$widget.find(
        ".seamless-user-dashboard-tab-content[data-tab-content='enrolled'] .seamless-user-dashboard-courses-container",
      );
      if ($enrolledCourses.length) {
        this.updatePagination(
          $enrolledCourses,
          this.enrolledCoursePage,
          ".seamless-user-dashboard-course-card",
        );
      }

      // Included courses
      const $includedCourses = this.$widget.find(
        ".seamless-user-dashboard-tab-content[data-tab-content='included'] .seamless-user-dashboard-courses-container",
      );
      if ($includedCourses.length) {
        this.updatePagination(
          $includedCourses,
          this.includedCoursePage,
          ".seamless-user-dashboard-course-card",
        );
      }
    }

    /**
     * Open modal
     */
    openModal() {
      this.$modal.fadeIn(300);
      $("body").css("overflow", "hidden");
    }

    /**
     * Close modal
     */
    closeModal() {
      this.$modal.fadeOut(300);
      $("body").css("overflow", "");
      this.clearMessage();
    }

    /**
     * Submit form via AJAX
     */
    submitForm() {
      const self = this;
      const formData = this.$form.serializeArray();
      const data = {};

      // Convert form data to object
      $.each(formData, function (i, field) {
        data[field.name] = field.value;
      });

      // Validate required fields
      if (!data.first_name || !data.last_name || !data.email) {
        this.showMessage(
          "error",
          "First name, last name, and email are required.",
        );
        return;
      }

      // Show loading state
      const $submitBtn = this.$form.find('button[type="submit"]');
      const storedOriginalText = $submitBtn.data("original-text");
      const originalText = storedOriginalText || $submitBtn.text();
      if (!storedOriginalText) {
        $submitBtn.data("original-text", originalText);
      }
      $submitBtn.prop("disabled", true).text("Saving...");
      this.clearMessage();

      // Make AJAX request
      $.ajax({
        url: seamlessAddonData.ajaxUrl,
        type: "POST",
        data: {
          action: "seamless_update_user_profile",
          nonce: seamlessAddonData.nonce,
          profile_data: data,
        },
        success: function (response) {
          if (response.success) {
            self.showMessage(
              "success",
              response.data.message || "Profile updated successfully!",
            );

            // Update view mode with new data instead of reloading page
            setTimeout(function () {
              self.updateProfileView(data);
              self.exitEditMode();
            }, 1000);
          } else {
            self.showMessage(
              "error",
              response.data || "Failed to update profile.",
            );
          }
        },
        error: function (xhr, status, error) {
          console.error("AJAX Error:", error);
          self.showMessage("error", "An error occurred. Please try again.");
        },
        complete: function () {
          // Always restore the button label/state, regardless of success/error
          $submitBtn.prop("disabled", false).text(originalText);
        },
      });
    }

    /**
     * Show message in form
     */
    showMessage(type, message) {
      const $messageDiv = this.$form.find(
        ".seamless-user-dashboard-form-message",
      );
      $messageDiv
        .removeClass(
          "seamless-user-dashboard-message-success seamless-user-dashboard-message-error",
        )
        .addClass("seamless-user-dashboard-message-" + type)
        .html(message)
        .slideDown(200);
    }

    /**
     * Clear message
     */
    clearMessage() {
      this.$form
        .find(".seamless-user-dashboard-form-message")
        .slideUp(200)
        .html("");
    }

    /**
     * Upgrade/Downgrade Modal Functionality
     */
    initUpgradeModal() {
      const self = this;
      // Use delegation for upgrade/downgrade buttons
      this.$widget.on(
        "click",
        ".seamless-user-dashboard-badge-upgrade, .seamless-user-dashboard-badge-downgrade",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          const membershipData = JSON.parse(
            $(this).attr("data-membership-data"),
          );
          const actionType = $(this).attr("data-action-type");
          self.openUpgradeModal(membershipData, actionType);
        },
      );

      // Close modal events - Delegation
      this.$widget.on(
        "click",
        "#seamless-upgrade-modal .seamless-user-dashboard-modal-close, #seamless-upgrade-modal .seamless-user-dashboard-modal-cancel",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeUpgradeModal();
        },
      );

      this.$widget.on(
        "click",
        "#seamless-upgrade-modal .seamless-user-dashboard-modal-overlay",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeUpgradeModal();
        },
      );

      // Confirm button - Delegation
      this.$widget.on(
        "click",
        "#seamless-upgrade-modal .seamless-user-dashboard-modal-upgrade",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.handleUpgradeConfirm();
        },
      );
    }

    openUpgradeModal(membershipData, actionType) {
      const $modal = $("#seamless-upgrade-modal");
      const $title = $modal.find(".seamless-user-dashboard-modal-title");
      const $confirmBtn = $modal.find(".seamless-user-dashboard-modal-upgrade");
      const $confirmText = $confirmBtn.find(
        ".seamless-user-dashboard-modal-upgrade-text",
      );

      // Store current membership data
      this.currentMembership = membershipData;
      this.actionType = actionType;

      // Set title and button text
      $title.text(
        actionType === "upgrade"
          ? "Upgrade Membership"
          : "Downgrade Membership",
      );
      $confirmText.text(
        actionType === "upgrade" ? "Upgrade Plan" : "Downgrade Plan",
      );

      // Get available plans from membership level
      const plans =
        actionType === "upgrade"
          ? membershipData.upgradable_to
          : membershipData.downgradable_to;

      // Render plans
      this.renderPlans(plans);

      // Show modal
      $modal.show();
      $("body").css("overflow", "hidden");

      // Select first plan by default
      if (plans && plans.length > 0) {
        this.selectPlan(plans[0]);
      }
    }

    closeUpgradeModal() {
      const $modal = $("#seamless-upgrade-modal");
      $modal.hide();
      $("body").css("overflow", "");
      this.currentMembership = null;
      this.selectedPlan = null;
      this.actionType = null;
    }

    renderPlans(plans) {
      const $plansList = $("#seamless-plans-list");
      $plansList.empty();
      const self = this;

      plans.forEach(function (plan) {
        const description = plan.description
          ? plan.description.replace(/<[^>]*>/g, "").substring(0, 100)
          : "";

        // Format period
        const period = plan.period || "year";
        const periodNumber = plan.period_number || 1;
        const periodText =
          periodNumber > 1 ? `${periodNumber} ${period}s` : period;

        // Check if group plan
        const isGroupPlan =
          plan.is_group_membership == 1 || plan.is_group_membership === true;
        const groupSeatsHtml = isGroupPlan
          ? `<div class="seamless-user-dashboard-plan-card-group-seats">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
               ${parseInt(plan.group_seats) || 0} seats
             </div>`
          : "";

        const $planCard = $("<div>")
          .addClass("seamless-user-dashboard-plan-card")
          .attr("data-plan-id", plan.id).html(`
            <div class="seamless-user-dashboard-plan-card-header">
              <h4 class="seamless-user-dashboard-plan-card-name">${self.escapeHtml(
                plan.label,
              )}</h4>
              <span class="seamless-user-dashboard-plan-card-price">$${parseFloat(
                plan.price,
              ).toFixed(
                2,
              )}<span class="plan-period">/${periodText}</span></span>
            </div>
            ${groupSeatsHtml}
          `);

        $planCard.on("click", function () {
          self.selectPlan(plan);
        });

        $plansList.append($planCard);
      });
    }

    selectPlan(plan) {
      // Update selected plan
      this.selectedPlan = plan;

      console.log("Plan selected:", plan.id, plan.label);

      // Update UI
      $(".seamless-user-dashboard-plan-card").removeClass("selected");
      $(
        '.seamless-user-dashboard-plan-card[data-plan-id="' + plan.id + '"]',
      ).addClass("selected");

      // Calculate and show proration
      this.calculateAndShowProration(plan);

      // Show plan perks
      this.showPlanPerks(plan);

      // Enable confirm button
      $(".seamless-user-dashboard-modal-upgrade").prop("disabled", false);
    }

    calculateAndShowProration(newPlan) {
      const currentPlan = this.currentMembership.plan;
      const startDate = new Date(this.currentMembership.start_date);
      const expiryDate = new Date(this.currentMembership.expiry_date);
      const today = new Date();

      // Calculate days
      const totalDays = Math.ceil(
        (expiryDate - startDate) / (1000 * 60 * 60 * 24),
      );
      const usedDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
      const remainingDays = totalDays - usedDays;

      // Calculate daily prices
      const oldDailyPrice = parseFloat(currentPlan.price) / totalDays;
      const newDailyPrice = parseFloat(newPlan.price) / totalDays;

      // Calculate proration
      const oldPlanCredit = oldDailyPrice * remainingDays;
      const newPlanCharge = newDailyPrice * remainingDays;

      // Add signup fee if required
      const signupFee =
        newPlan.requires_signup_fee && parseFloat(newPlan.signup_fee) > 0
          ? parseFloat(newPlan.signup_fee)
          : 0;

      const amountToPay = newPlanCharge - oldPlanCredit + signupFee;

      // Determine if this is a downgrade or upgrade
      const isDowngrade =
        parseFloat(newPlan.price) < parseFloat(currentPlan.price);
      const isUpgrade =
        parseFloat(newPlan.price) > parseFloat(currentPlan.price);

      // apply_proration_on_switch only applies to downgrades
      const prorateEnabled =
        isDowngrade &&
        (newPlan.apply_proration_on_switch == true ||
          newPlan.apply_proration_on_switch == 1);
      const isScheduledDowngrade = isDowngrade && !prorateEnabled;

      // Update UI based on transaction type
      const $prorationSection = $("#seamless-proration");
      const $scheduledSection = $("#seamless-scheduled-info");
      const $upgradeButton = $(".seamless-user-dashboard-modal-upgrade");
      const $buttonText = $upgradeButton.find(
        ".seamless-user-dashboard-modal-upgrade-text",
      );

      if (isScheduledDowngrade) {
        // Scheduled downgrade (proration disabled)
        $prorationSection.hide();
        $scheduledSection.show();

        // Format next billing date
        const expiryDate = new Date(this.currentMembership.expiry_date);
        const formattedDate = expiryDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Update scheduled message for downgrade
        $("#seamless-scheduled-message").html(
          `Your plan will be downgraded to <strong>${this.escapeHtml(
            newPlan.label,
          )}</strong> at your next billing cycle on <strong>${formattedDate}</strong>. You will continue to have access to your current plan benefits until then.`,
        );

        // Update button text
        $buttonText.text("Downgrade at Next Renewal");
      } else if (isUpgrade) {
        // Upgrade - always immediate with info message
        $prorationSection.show();
        $scheduledSection.show(); // Show info message for upgrades

        // Update proration details
        $prorationSection
          .find(".seamless-user-dashboard-proration-charge")
          .text("$" + newPlanCharge.toFixed(2));
        $prorationSection
          .find(".seamless-user-dashboard-proration-credit")
          .text("-$" + oldPlanCredit.toFixed(2));

        // Show signup fee if applicable
        if (signupFee > 0) {
          if (
            $prorationSection.find(".seamless-user-dashboard-proration-signup")
              .length === 0
          ) {
            $prorationSection.find(".seamless-user-dashboard-proration-total")
              .before(`
              <div class="seamless-user-dashboard-proration-item seamless-user-dashboard-proration-signup">
                <span>Signup Fee:</span>
                <span class="seamless-user-dashboard-proration-signup-amount">$${signupFee.toFixed(
                  2,
                )}</span>
              </div>
            `);
          } else {
            $prorationSection
              .find(".seamless-user-dashboard-proration-signup-amount")
              .text("$" + signupFee.toFixed(2));
          }
        } else {
          $prorationSection
            .find(".seamless-user-dashboard-proration-signup")
            .remove();
        }

        // Update total label and amount based on whether it's a refund or charge
        const $amountRow = $prorationSection
          .find(".seamless-user-dashboard-proration-amount")
          .parent();
        const $amountLabel = $amountRow.find("span:first");
        const $amountValue = $prorationSection.find(
          ".seamless-user-dashboard-proration-amount",
        );

        if (amountToPay < 0) {
          $amountLabel.text("Estimated Refund/Credit:");
          $amountValue.text("$" + Math.abs(amountToPay).toFixed(2));
        } else {
          $amountLabel.text("Amount to Pay:");
          $amountValue.text("$" + amountToPay.toFixed(2));
        }

        const remainingDaysRounded = Math.floor(remainingDays);
        $prorationSection
          .find(".seamless-user-dashboard-remaining-days")
          .text(remainingDaysRounded);

        // Show upgrade info message
        $("#seamless-scheduled-message").html(
          `All plan changes take effect immediately. You will be charged the prorated amount based on your current billing cycle.`,
        );

        $buttonText.text("Upgrade Plan");
      } else {
        // Immediate downgrade (proration enabled)
        $prorationSection.show();
        $scheduledSection.hide();

        // Update proration details - for downgrades, show credit first (positive) then charge (negative)
        $prorationSection
          .find(".seamless-user-dashboard-proration-credit")
          .text("$" + oldPlanCredit.toFixed(2));
        $prorationSection
          .find(".seamless-user-dashboard-proration-charge")
          .text("-$" + newPlanCharge.toFixed(2));

        // Show signup fee if applicable
        if (signupFee > 0) {
          if (
            $prorationSection.find(".seamless-user-dashboard-proration-signup")
              .length === 0
          ) {
            $prorationSection.find(".seamless-user-dashboard-proration-total")
              .before(`
              <div class="seamless-user-dashboard-proration-item seamless-user-dashboard-proration-signup">
                <span>Signup Fee:</span>
                <span class="seamless-user-dashboard-proration-signup-amount">$${signupFee.toFixed(
                  2,
                )}</span>
              </div>
            `);
          } else {
            $prorationSection
              .find(".seamless-user-dashboard-proration-signup-amount")
              .text("$" + signupFee.toFixed(2));
          }
        } else {
          $prorationSection
            .find(".seamless-user-dashboard-proration-signup")
            .remove();
        }

        // Update total label and amount based on whether it's a refund or charge
        const $amountRow2 = $prorationSection
          .find(".seamless-user-dashboard-proration-amount")
          .parent();
        const $amountLabel2 = $amountRow2.find("span:first");
        const $amountValue2 = $prorationSection.find(
          ".seamless-user-dashboard-proration-amount",
        );

        if (amountToPay < 0) {
          $amountLabel2.text("Estimated Refund/Credit:");
          $amountValue2.text("$" + Math.abs(amountToPay).toFixed(2));
        } else {
          $amountLabel2.text("Amount to Pay:");
          $amountValue2.text("$" + amountToPay.toFixed(2));
        }

        const remainingDaysRounded = Math.floor(remainingDays);
        $prorationSection
          .find(".seamless-user-dashboard-remaining-days")
          .text(remainingDaysRounded);

        $buttonText.text("Downgrade Current Membership");
      }

      // Store for later use
      this.prorationData = {
        oldPlanCredit: oldPlanCredit,
        newPlanCharge: newPlanCharge,
        signupFee: signupFee,
        amountToPay: amountToPay,
        remainingDays: remainingDays,
      };
    }

    showPlanPerks(plan) {
      const $perksContainer = $("#seamless-plan-perks");
      const $planName = $(".seamless-user-dashboard-selected-plan-name");
      const self = this;

      // Add "Offerings" subtitle after plan name
      $planName.html(`${plan.label} &mdash; Offerings`);

      const hasContentRules =
        plan.content_rules && Object.keys(plan.content_rules).length > 0;
      const hasTrial = plan.resets_trial_period && plan.trial_days > 0;
      const isGroupPlan =
        plan.is_group_membership == 1 || plan.is_group_membership === true;
      const $columns = $perksContainer.closest(
        ".seamless-user-dashboard-modal-columns",
      );

      if (!hasContentRules && !hasTrial && !isGroupPlan) {
        $columns.addClass("no-offerings");
        return;
      }

      $columns.removeClass("no-offerings");
      $perksContainer.empty();

      // Add trial period if resets_trial_period is true
      if (plan.resets_trial_period && plan.trial_days > 0) {
        const $trialPerk = $("<div>").addClass(
          "seamless-user-dashboard-perk-item seamless-user-dashboard-perk-highlight",
        ).html(`
            <div class="seamless-user-dashboard-perk-icon included">🎁</div>
            <div class="seamless-user-dashboard-perk-text">
              <p class="seamless-user-dashboard-perk-value">${plan.trial_days}-Day Free Trial</p>
            </div>
          `);
        $perksContainer.append($trialPerk);
      }

      $.each(plan.content_rules, function (key, value) {
        // Determine if included or excluded
        const isIncluded =
          value &&
          value.toLowerCase() !== "no" &&
          value.toLowerCase() !== "none";
        const iconClass = isIncluded ? "included" : "excluded";

        // SVG icons for checkmark and X
        const checkmarkSVG = `
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="#22c55e" stroke-width="2"/>
            <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;

        const xMarkSVG = `
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="transparent" stroke="#d1d5db" stroke-width="2"/>
            <path d="M9 9L15 15M15 9L9 15" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;

        const iconSVG = isIncluded ? checkmarkSVG : xMarkSVG;

        // Use value as the main display text for a cleaner look
        const itemClass = isIncluded
          ? "seamless-user-dashboard-perk-item"
          : "seamless-user-dashboard-perk-item excluded";

        const $perkItem = $("<div>").addClass(itemClass).html(`
            <div class="seamless-user-dashboard-perk-icon ${iconClass}">${iconSVG}</div>
            <div class="seamless-user-dashboard-perk-text">
              <p class="seamless-user-dashboard-perk-value">${self.escapeHtml(
                value,
              )}</p>
            </div>
          `);

        $perksContainer.append($perkItem);
      });

      // Add group seats section for group memberships
      if (isGroupPlan) {
        const groupSeats = parseInt(plan.group_seats) || 0;
        const adminSeats = parseInt(plan.group_admin_seats) || 0;
        const actionLabel =
          this.actionType === "downgrade" ? "downgrading" : "upgrading";

        const $groupSection = $(`
          <div class="seamless-user-dashboard-group-seats-section">
            <div class="seamless-user-dashboard-group-seats-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <strong>Group Seats</strong>
            </div>
            <div class="seamless-user-dashboard-group-seats-detail">
              <span class="seamless-user-dashboard-group-seats-label">Total Seats: </span>
              <span class="seamless-user-dashboard-group-seats-value">${groupSeats}</span>
            </div>
            <div class="seamless-user-dashboard-group-seats-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>You can add additional seats from the Organization tab after ${actionLabel}.</span>
            </div>
          </div>
        `);

        $perksContainer.append($groupSection);
      }
    }

    handleUpgradeConfirm() {
      if (!this.selectedPlan || !this.currentMembership) {
        return;
      }

      if (this.isProcessingUpgrade) {
        console.warn("Upgrade/Downgrade already in progress. Ignoring click.");
        return;
      }

      const self = this;

      // Check if current membership is cancelled
      if (this.currentMembership.status === "cancelled") {
        this.showToast(
          "You cannot upgrade or downgrade a cancelled membership. Please wait until it expires or purchase a new membership.",
          "error",
        );
        return;
      }

      // Check if user already has an active membership with the selected plan
      const allMemberships =
        window.seamlessUserDashboard?.memberships?.current || [];
      const alreadyHasPlan = allMemberships.some((membership) => {
        return (
          membership.plan?.id === this.selectedPlan.id &&
          (membership.status === "active" || membership.status === "cancelled")
        );
      });

      if (alreadyHasPlan) {
        this.showToast(
          `You already have an active ${this.selectedPlan.label}. You cannot upgrade/downgrade to a plan you already own.`,
          "error",
        );
        return;
      }

      const $confirmButton = this.$widget.find(
        "#seamless-upgrade-modal .seamless-user-dashboard-modal-upgrade",
      );
      const originalText = $confirmButton
        .find(".seamless-user-dashboard-modal-upgrade-text")
        .text();

      // Disable button and show loading state
      this.isProcessingUpgrade = true;
      $confirmButton.prop("disabled", true);
      $confirmButton
        .find(".seamless-user-dashboard-modal-upgrade-text")
        .text("Processing...");

      // Determine action and nonce based on upgrade or downgrade
      const isUpgrade = this.actionType === "upgrade";
      const action = isUpgrade
        ? "seamless_upgrade_membership"
        : "seamless_downgrade_membership";
      const nonce = isUpgrade
        ? seamlessUserDashboard.upgradeNonce
        : seamlessUserDashboard.downgradeNonce;

      // Prepare AJAX data
      // For group memberships, the API expects the membership instance ID
      // For individual memberships, the API expects the plan ID
      const isGroupMembership =
        this.currentMembership.plan?.is_group_membership == 1 ||
        this.currentMembership.plan?.is_group_membership === true;

      const membershipIdToSend = isGroupMembership
        ? this.currentMembership.id // Group: use membership instance ID
        : this.currentMembership.id; // Individual: use plan ID

      const ajaxData = {
        action: action,
        nonce: nonce,
        new_plan_id: this.selectedPlan.id,
        membership_id: membershipIdToSend,
        email: seamlessUserDashboard.userEmail,
      };

      console.log(
        `=== ${isUpgrade ? "UPGRADE" : "DOWNGRADE"} REQUEST DEBUG ===`,
      );
      console.log("Action Type:", this.actionType);
      console.log("Is Group Membership:", isGroupMembership);
      console.log("Membership Instance ID:", this.currentMembership.id);
      console.log("Plan ID:", this.currentMembership.plan?.id);
      console.log("membership_id sent:", membershipIdToSend);
      console.log("Selected Plan ID (new_plan_id):", this.selectedPlan.id);
      console.log("AJAX Data being sent:", ajaxData);

      // Make AJAX request
      $.ajax({
        url: seamlessUserDashboard.ajaxUrl,
        type: "POST",
        data: ajaxData,
        success: function (response) {
          console.log("Upgrade/Downgrade Response:", response);
          const isUpgrade = self.actionType === "upgrade";
          const isDowngrade = self.actionType === "downgrade";

          if (response.success && response.data && response.data.data) {
            // For upgrades, redirect to Stripe checkout
            if (isUpgrade) {
              const stripeUrl = response.data.data.stripe_checkout_url;

              if (stripeUrl) {
                window.location.href = stripeUrl;
              } else {
                self.showToast(
                  "Error: No checkout URL received. Please try again.",
                  "error",
                );
                $confirmButton.prop("disabled", false);
                $confirmButton
                  .find(".seamless-user-dashboard-modal-upgrade-text")
                  .text(originalText);
                self.isProcessingUpgrade = false;
              }
            }
            // For downgrades, show success message and reload
            else if (isDowngrade) {
              const responseData = response.data.data;
              const isScheduled =
                responseData.scheduled == 1 || responseData.scheduled === true;
              const effectiveOn = responseData.effective_on;

              // Close modal
              $("#seamless-upgrade-modal").hide();

              if (isScheduled && effectiveOn) {
                // Scheduled downgrade
                const effectiveDate = new Date(effectiveOn);
                const formattedDate = effectiveDate.toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                );
                self.showToast(
                  `Downgrade scheduled successfully! Your membership will be downgraded to ${self.selectedPlan.label} on ${formattedDate}.`,
                  "success",
                );
              } else {
                // Immediate downgrade
                const message =
                  response.data.message ||
                  "Membership downgraded successfully! Please check your email for refund details.";
                self.showToast(message, "success");
              }

              // Reload page after 2 seconds to show updated membership
              setTimeout(function () {
                window.location.reload();
              }, 2000);
            }
          } else {
            const errorMessage =
              response.data && response.data.message
                ? response.data.message
                : "An error occurred. Please try again.";
            self.showToast("Error: " + errorMessage, "error");
            $confirmButton.prop("disabled", false);
            $confirmButton
              .find(".seamless-user-dashboard-modal-upgrade-text")
              .text(originalText);
            self.isProcessingUpgrade = false;
          }
        },
        error: function (xhr, status, error) {
          console.error("Upgrade error:", error);
          self.showToast(
            "An error occurred while processing your upgrade. Please try again.",
            "error",
          );
          $confirmButton.prop("disabled", false);
          $confirmButton
            .find(".seamless-user-dashboard-modal-upgrade-text")
            .text(originalText);
          self.isProcessingUpgrade = false;
        },
      });
    }

    /**
     * Cancel Membership Modal Functionality
     */
    initCancelModal() {
      const self = this;

      this.$widget.on(
        "click",
        ".seamless-user-dashboard-badge-cancel",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          const membershipId = $(this).attr("data-membership-id");
          const planLabel = $(this).attr("data-plan-label");
          const planPrice = $(this).attr("data-plan-price");
          const membershipData = JSON.parse(
            $(this).attr("data-membership-data"),
          );
          self.openCancelModal(
            membershipId,
            planLabel,
            planPrice,
            membershipData,
          );
        },
      );

      // Close modal events - Delegation
      this.$widget.on(
        "click",
        "#seamless-cancel-modal .seamless-user-dashboard-modal-close, #seamless-cancel-modal .seamless-user-dashboard-modal-keep",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeCancelModal();
        },
      );

      this.$widget.on(
        "click",
        "#seamless-cancel-modal .seamless-user-dashboard-modal-overlay",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeCancelModal();
        },
      );

      // Confirm cancel button - Delegation
      this.$widget.on(
        "click",
        "#seamless-cancel-modal .seamless-user-dashboard-modal-confirm-cancel",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.handleCancelConfirm();
        },
      );
    }

    openCancelModal(membershipId, planLabel, planPrice, membershipData) {
      const $modal = $("#seamless-cancel-modal");

      // Store membership data
      this.cancelMembershipId = membershipId;
      this.cancelMembershipData = membershipData;

      // console.log("Cancel Modal Data:", membershipData);

      // Extract plan and remaining days from membership data
      const plan = membershipData.plan || {};
      const remainingDays = parseFloat(membershipData.remaining_days) || 0;

      // console.log("Cancel Modal Data:", {
      //   plan,
      //   remainingDays,
      //   prorate_on_refund: plan.prorate_on_refund,
      //   prorate_by_refund: plan.prorate_by_refund,
      //   period: plan.period,
      //   period_number: plan.period_number,
      // });

      // Update modal content
      $("#seamless-cancel-plan-name").text(planLabel);

      // Check if plan is refundable
      const isRefundable = plan.refundable == 1 || plan.refundable == true;
      const prorateOnRefund = plan.prorate_on_refund == 1;
      const prorateByRefund = plan.prorate_by_refund || "";
      const planPeriod = plan.period || "year";
      const periodNumber = parseInt(plan.period_number) || 1;
      const price = parseFloat(planPrice) || 0;

      const $refundSection = $("#seamless-cancel-refund-section");
      const $periodEndSection = $("#seamless-cancel-period-end-section");
      const $confirmButton = $(".seamless-user-dashboard-modal-confirm-cancel");
      const $buttonText = $confirmButton.find(
        ".seamless-user-dashboard-modal-confirm-cancel-text",
      );

      if (!isRefundable) {
        // Non-refundable: Cancel at period end
        $refundSection.hide();
        $periodEndSection.show();

        // Format expiry date
        const expiryDate = new Date(membershipData.expiry_date);
        const formattedDate = expiryDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        $("#seamless-cancel-period-end-message").html(
          `Your membership will be canceled at the end of your current billing cycle on <strong>${formattedDate}</strong>. You will continue to have access to all your current plan benefits until then.`,
        );

        $buttonText.text("Yes, Cancel Membership");
      } else {
        // Refundable: Show refund calculation
        $refundSection.show();
        $periodEndSection.hide();

        let refundAmount = price;
        let prorationMessage = "";

        if (prorateOnRefund && remainingDays > 0) {
          if (prorateByRefund === "day") {
            // Calculate actual days in the billing period
            const startDate = new Date(membershipData.start_date);
            const expiryDate = new Date(membershipData.expiry_date);
            const currentDate = new Date();

            const totalDays = Math.ceil(
              (expiryDate - startDate) / (1000 * 60 * 60 * 24),
            );

            // Calculate used days (from start to today, inclusive)
            const usedDays = Math.ceil(
              (currentDate - startDate) / (1000 * 60 * 60 * 24),
            );

            // Remaining days (rounded down for conservative refund)
            const remainingDaysRounded = Math.floor(remainingDays);

            const dailyRate = price / totalDays;
            refundAmount = dailyRate * remainingDaysRounded;

            prorationMessage = `Prorated refund calculated. Used ${usedDays} full day${
              usedDays !== 1 ? "s" : ""
            } (including today), ${remainingDaysRounded} day${
              remainingDaysRounded !== 1 ? "s" : ""
            } remaining.<br><br>You are eligible for a refund of <strong>$${refundAmount.toFixed(
              2,
            )}</strong> for the unused portion of your plan.`;
          } else if (prorateByRefund === "month") {
            // Calculate total months based on plan period
            let totalMonths = 12; // default for year
            if (planPeriod === "month") {
              totalMonths = periodNumber;
            } else if (planPeriod === "year") {
              totalMonths = 12 * periodNumber;
            }

            // Calculate remaining months (using actual days, not assuming 30)
            const remainingMonths = Math.floor(remainingDays / 30);
            const usedMonths = Math.max(0, totalMonths - remainingMonths);
            const monthlyRate = price / totalMonths;
            refundAmount = monthlyRate * remainingMonths;

            prorationMessage = `Prorated refund calculated. Used ${usedMonths} full month${
              usedMonths !== 1 ? "s" : ""
            } (including current), ${remainingMonths} month${
              remainingMonths !== 1 ? "s" : ""
            } remaining.<br><br>You are eligible for a refund of <strong>$${refundAmount.toFixed(
              2,
            )}</strong> for the unused portion of your plan.`;
          }
        } else {
          // Non-prorated refund
          prorationMessage =
            "Refund available as per plan policy. You are eligible for a refund for this plan.";
        }

        // Update refund UI (use .html() to render HTML tags)
        $("#seamless-cancel-proration-message").html(prorationMessage);

        $buttonText.text("Request Refund");
      }

      // Show modal
      $modal.css("display", "flex");
      $("body").css("overflow", "hidden");
    }

    closeCancelModal() {
      const $modal = $("#seamless-cancel-modal");
      $modal.css("display", "none");
      $("body").css("overflow", "");

      // Clear stored data
      this.cancelMembershipId = null;
      this.cancelMembershipData = null;
    }

    handleCancelConfirm() {
      if (!this.cancelMembershipId) {
        console.error("Cancel Membership Error: No membership ID");
        return;
      }

      const self = this;
      const $confirmButton = $("#seamless-cancel-modal").find(
        ".seamless-user-dashboard-modal-confirm-cancel",
      );
      const originalText = $confirmButton.text();

      console.log("Cancel Membership Request:", {
        membershipId: this.cancelMembershipId,
        email: seamlessUserDashboard.userEmail,
        ajaxUrl: seamlessUserDashboard.ajaxUrl,
        nonce: seamlessUserDashboard.cancelNonce,
      });

      // Disable button and show loading state
      $confirmButton.prop("disabled", true).text("Cancelling...");

      $.ajax({
        url: seamlessUserDashboard.ajaxUrl,
        type: "POST",
        data: {
          action: "seamless_cancel_membership",
          nonce: seamlessUserDashboard.cancelNonce,
          membership_id: this.cancelMembershipId,
          email: seamlessUserDashboard.userEmail,
        },
        success: function (response) {
          console.log("Cancel Membership Response:", response);

          if (response.success) {
            const plan = self.cancelMembershipData?.plan || {};
            const isRefundable =
              plan.refundable == 1 || plan.refundable == true;

            if (isRefundable) {
              self.showToast(
                "Refund request has been initiated. Your membership has been cancelled successfully. Please check your email for further instructions.",
                "success",
              );
            } else {
              self.showToast(
                "Your membership cancellation has been scheduled. You will retain access until the end of your billing cycle.",
                "success",
              );
            }

            self.closeCancelModal();
            // Reload after a short delay to show the toast
            setTimeout(() => window.location.reload(), 2000);
          } else {
            const errorMessage =
              response.data && response.data.message
                ? response.data.message
                : "An error occurred. Please try again.";
            console.error("Cancel Membership Error:", errorMessage, response);
            self.showToast("Error: " + errorMessage, "error");
            $confirmButton.prop("disabled", false).text(originalText);
          }
        },
        error: function (xhr, status, error) {
          console.error("Cancel AJAX Error:", {
            xhr,
            status,
            error,
            responseText: xhr.responseText,
          });
          self.showToast(
            "An error occurred while cancelling your membership. Please try again.",
            "error",
          );
          $confirmButton.prop("disabled", false).text(originalText);
        },
      });
    }

    /**
     * Request group removal modal functionality
     */
    initRequestRemovalModal() {
      const self = this;

      this.$widget.on(
        "click",
        ".seamless-user-dashboard-group-request-removal",
        function (e) {
          if (
            $(this).prop("disabled") ||
            $(this).attr("aria-disabled") === "true" ||
            $(this).attr("data-has-requested-removal") === "1"
          ) {
            e.preventDefault();
            e.stopPropagation();
            self.showToast(
              "You have already requested removal for this group membership.",
              "info",
            );
            return;
          }

          e.preventDefault();
          e.stopPropagation();
          const membershipId = $(this).attr("data-membership-id");
          const planLabel = $(this).attr("data-plan-label");
          self.openRequestRemovalModal(membershipId, planLabel);
        },
      );

      this.$widget.on(
        "click",
        "#seamless-request-removal-modal .seamless-user-dashboard-modal-overlay, #seamless-request-removal-modal .seamless-user-dashboard-modal-keep-request-removal",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeRequestRemovalModal();
        },
      );

      this.$widget.on(
        "click",
        "#seamless-request-removal-modal .seamless-user-dashboard-modal-confirm-request-removal",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.handleRequestRemovalConfirm();
        },
      );
    }

    openRequestRemovalModal(membershipId, planLabel) {
      this.requestRemovalMembershipId = membershipId;
      this.requestRemovalPlanLabel = planLabel || "this membership";

      $("#seamless-request-removal-modal").css("display", "flex");
      $("body").css("overflow", "hidden");
    }

    closeRequestRemovalModal() {
      $("#seamless-request-removal-modal").css("display", "none");
      $("body").css("overflow", "");
      this.requestRemovalMembershipId = null;
      this.requestRemovalPlanLabel = null;
    }

    handleRequestRemovalConfirm() {
      if (!this.requestRemovalMembershipId) {
        this.showToast("Error: Missing membership ID", "error");
        return;
      }

      const self = this;
      const $confirmButton = $(
        "#seamless-request-removal-modal .seamless-user-dashboard-modal-confirm-request-removal",
      );
      const $buttonText = $confirmButton.find(
        ".seamless-user-dashboard-modal-confirm-request-removal-text",
      );
      const originalText = $buttonText.text();

      $confirmButton.prop("disabled", true);
      $buttonText.text("Sending...");

      $.ajax({
        url: seamlessUserDashboard.ajaxUrl,
        type: "POST",
        data: {
          action: "seamless_request_group_removal",
          nonce: seamlessUserDashboard.requestGroupRemovalNonce,
          membership_id: this.requestRemovalMembershipId,
          email: seamlessUserDashboard.userEmail,
        },
        success: function (response) {
          if (response.success) {
            const message =
              response.data?.message ||
              "Your removal request has been sent to the group owner.";
            self.showToast(message, "success");
            self.closeRequestRemovalModal();
            setTimeout(() => window.location.reload(), 2000);
          } else {
            const errorMessage =
              response.data?.message ||
              "Failed to send your group removal request.";
            self.showToast(errorMessage, "error");
            $confirmButton.prop("disabled", false);
            $buttonText.text(originalText);
          }
        },
        error: function () {
          self.showToast(
            "An error occurred while requesting removal. Please try again.",
            "error",
          );
          $confirmButton.prop("disabled", false);
          $buttonText.text(originalText);
        },
      });
    }

    /**
     * Handle cancel scheduled downgrade button click
     */
    handleCancelScheduledDowngrade($button) {
      const membershipId = $button.data("membership-id");
      const orderId = $button.data("order-id");

      if (!membershipId) {
        this.showToast("Error: Missing membership ID", "error");
        return;
      }

      // Store data for later use
      this.scheduledChangeMembershipId = membershipId;
      this.scheduledChangeOrderId = orderId;

      // Open modal
      this.openCancelScheduledModal();
    }

    /**
     * Open cancel scheduled change modal
     */
    openCancelScheduledModal() {
      $("#seamless-cancel-scheduled-modal").css("display", "flex");
      $("body").css("overflow", "hidden");
    }

    /**
     * Close cancel scheduled change modal
     */
    closeCancelScheduledModal() {
      $("#seamless-cancel-scheduled-modal").css("display", "none");
      $("body").css("overflow", "");
    }

    /**
     * Initialize cancel scheduled change modal
     */
    initCancelScheduledModal() {
      const self = this;

      // Close button - Delegation
      this.$widget.on(
        "click",
        "#seamless-cancel-scheduled-modal .seamless-user-dashboard-modal-close",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeCancelScheduledModal();
        },
      );

      // Overlay click - Delegation
      this.$widget.on(
        "click",
        "#seamless-cancel-scheduled-modal .seamless-user-dashboard-modal-overlay",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeCancelScheduledModal();
        },
      );

      // Keep schedule button - Delegation
      this.$widget.on(
        "click",
        "#seamless-cancel-scheduled-modal .seamless-user-dashboard-modal-keep-scheduled",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeCancelScheduledModal();
        },
      );

      // Confirm cancel button - Delegation
      this.$widget.on(
        "click",
        "#seamless-cancel-scheduled-modal .seamless-user-dashboard-modal-confirm-cancel-scheduled",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.handleCancelScheduledConfirm();
        },
      );

      // Bind Renew Button Handler - Delegation
      this.$widget.on(
        "click",
        ".seamless-user-dashboard-renew-btn",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          const $btn = $(this);
          self.handleRenewMembership($btn);
        },
      );
    }

    /**
     * Handle membership renewal
     */
    handleRenewMembership($btn) {
      const self = this;
      const planId = $btn.data("plan-id");
      const planDataStr = $btn.data("plan-data");

      if (!planId) {
        this.showToast("Error: Missing plan ID", "error");
        return;
      }

      // Parse plan data from button attribute
      let plan;
      try {
        plan =
          typeof planDataStr === "string"
            ? JSON.parse(planDataStr)
            : planDataStr;
      } catch (e) {
        console.error("Error parsing plan data:", e);
        this.showToast("Error: Could not load plan details", "error");
        return;
      }

      if (plan) {
        self.openRenewModal(plan);
      } else {
        self.showToast("Error: Could not load plan details", "error");
      }
    }

    /**
     * Open renewal modal with plan details
     */
    openRenewModal(plan) {
      const $modal = $("#seamless-renew-modal");
      this.renewPlan = plan;

      // Update modal title and plan info
      $(".seamless-user-dashboard-renew-plan-name").text(
        plan.label || plan.name,
      );

      // Format price
      const price = parseFloat(plan.price) || 0;
      const signupFee = parseFloat(plan.sign_up_fee) || 0;
      const period = plan.period || "month";
      const periodNumber = plan.period_number || 1;
      const periodText =
        periodNumber > 1 ? `${periodNumber} ${period}s` : period;

      $(".seamless-user-dashboard-renew-plan-price").html(
        `$${price.toFixed(2)}/<span class="plan-period">${periodText}</span>`,
      );

      // Check for subsequent renewal price in pricing array
      let renewalPrice = price;
      let hasSubsequentPrice = false;

      if (
        plan.pricing &&
        Array.isArray(plan.pricing) &&
        plan.pricing.length > 0
      ) {
        // Check if pricing[0] is a number (subsequent price) or an object
        const pricingData = plan.pricing[0];
        if (typeof pricingData === "number") {
          renewalPrice = parseFloat(pricingData);
          hasSubsequentPrice = true;
        } else if (typeof pricingData === "object" && pricingData.price) {
          renewalPrice = parseFloat(pricingData.price);
          hasSubsequentPrice = true;
        }
      }

      // Calculate total with renewal price
      const total = renewalPrice + signupFee;

      // Update pricing breakdown
      $(".seamless-user-dashboard-renew-charge").text(
        `$${renewalPrice.toFixed(2)}`,
      );

      // Show/hide subsequent price icon
      if (hasSubsequentPrice) {
        $("#seamless-renew-subsequent-icon").show();
      } else {
        $("#seamless-renew-subsequent-icon").hide();
      }

      $(".seamless-user-dashboard-renew-signup-fee").text(
        `$${signupFee.toFixed(2)}`,
      );
      $(".seamless-user-dashboard-renew-total").text(`$${total.toFixed(2)}`);

      // Update right panel title with plan name and "Offerings" subtitle
      $("#seamless-renew-plan-title").html(
        `${plan.label || plan.name} - Offerings`,
      );

      // Show plan features
      this.showRenewPlanPerks(plan);

      // Show modal
      $modal.show();
      $("body").css("overflow", "hidden");
    }

    /**
     * Close renewal modal
     */
    closeRenewModal() {
      const $modal = $("#seamless-renew-modal");
      $modal.hide();
      $("body").css("overflow", "");
      this.renewPlan = null;
    }

    /**
     * Show plan perks in renewal modal
     */
    showRenewPlanPerks(plan) {
      const $perksContainer = $("#seamless-renew-plan-perks");
      const self = this;

      const hasContentRules =
        plan.content_rules && Object.keys(plan.content_rules).length > 0;
      const hasTrial = plan.resets_trial_period && plan.trial_days > 0;
      const $columns = $perksContainer.closest(
        ".seamless-user-dashboard-modal-columns",
      );

      if (!hasContentRules && !hasTrial) {
        $columns.addClass("no-offerings");
        return;
      }

      $columns.removeClass("no-offerings");
      $perksContainer.empty();

      // Add trial period if applicable
      if (plan.resets_trial_period && plan.trial_days > 0) {
        const $trialPerk = $("<div>").addClass(
          "seamless-user-dashboard-perk-item seamless-user-dashboard-perk-highlight",
        ).html(`
            <div class="seamless-user-dashboard-perk-icon included">🎁</div>
            <div class="seamless-user-dashboard-perk-text">
              <p class="seamless-user-dashboard-perk-value">${plan.trial_days}-Day Free Trial</p>
            </div>
          `);
        $perksContainer.append($trialPerk);
      }

      $.each(plan.content_rules, function (key, value) {
        const isIncluded =
          value &&
          value.toLowerCase() !== "no" &&
          value.toLowerCase() !== "none";
        const iconClass = isIncluded ? "included" : "excluded";

        const checkmarkSVG = `
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="#22c55e" stroke-width="2"/>
            <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;

        const xMarkSVG = `
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="transparent" stroke="#d1d5db" stroke-width="2"/>
            <path d="M9 9L15 15M15 9L9 15" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;

        const iconSVG = isIncluded ? checkmarkSVG : xMarkSVG;
        const itemClass = isIncluded
          ? "seamless-user-dashboard-perk-item"
          : "seamless-user-dashboard-perk-item excluded";

        const $perkItem = $("<div>").addClass(itemClass).html(`
            <div class="seamless-user-dashboard-perk-icon ${iconClass}">${iconSVG}</div>
            <div class="seamless-user-dashboard-perk-text">
              <p class="seamless-user-dashboard-perk-value">${self.escapeHtml(value)}</p>
            </div>
          `);

        $perksContainer.append($perkItem);
      });
    }

    /**
     * Initialize renewal modal
     */
    initRenewModal() {
      const self = this;

      // Close button
      this.$widget.on(
        "click",
        "#seamless-renew-modal .seamless-user-dashboard-modal-close, #seamless-renew-modal .seamless-user-dashboard-modal-cancel",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeRenewModal();
        },
      );

      // Overlay click
      this.$widget.on(
        "click",
        "#seamless-renew-modal .seamless-user-dashboard-modal-overlay",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeRenewModal();
        },
      );

      // Confirm renew button
      this.$widget.on(
        "click",
        "#seamless-renew-modal .seamless-user-dashboard-modal-renew",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.handleRenewConfirm();
        },
      );
    }

    /**
     * Handle renewal confirmation
     */
    handleRenewConfirm() {
      if (!this.renewPlan) {
        this.showToast("Error: No plan selected", "error");
        return;
      }

      const self = this;
      const $confirmButton = $(
        "#seamless-renew-modal .seamless-user-dashboard-modal-renew",
      );
      const originalText = $confirmButton
        .find(".seamless-user-dashboard-modal-renew-text")
        .text();

      // Disable button and show loading state
      $confirmButton.prop("disabled", true);
      $confirmButton
        .find(".seamless-user-dashboard-modal-renew-text")
        .text("Processing...");

      $.ajax({
        url: seamlessUserDashboard.ajaxUrl,
        type: "POST",
        data: {
          action: "seamless_renew_membership",
          nonce: seamlessUserDashboard.renewNonce,
          plan_id: this.renewPlan.id,
          email: seamlessUserDashboard.userEmail,
        },
        success: function (response) {
          if (response.success && response.data) {
            // Check for Stripe checkout URL
            const stripeUrl =
              response.data.data?.stripe_checkout_url ||
              response.data.stripe_checkout_url ||
              response.data.data?.checkout_url ||
              response.data.checkout_url;

            if (stripeUrl) {
              window.location.href = stripeUrl;
            } else if (response.data.data?.url) {
              window.location.href = response.data.data.url;
            } else {
              self.showToast("Renewal initiated! Redirecting...", "success");
              self.closeRenewModal();
              setTimeout(() => window.location.reload(), 2000);
            }
          } else {
            const errorMsg =
              response.data && response.data.message
                ? response.data.message
                : "Renewal failed. Please try again.";
            self.showToast(errorMsg, "error");
            $confirmButton.prop("disabled", false);
            $confirmButton
              .find(".seamless-user-dashboard-modal-renew-text")
              .text(originalText);
          }
        },
        error: function (xhr, status, error) {
          console.error("Renewal Error:", error);
          self.showToast("An error occurred. Please try again.", "error");
          $confirmButton.prop("disabled", false);
          $confirmButton
            .find(".seamless-user-dashboard-modal-renew-text")
            .text(originalText);
        },
      });
    }

    /**
     * Handle confirm cancel scheduled change
     */
    handleCancelScheduledConfirm() {
      const self = this;
      const membershipId = this.scheduledChangeMembershipId;

      if (!membershipId) {
        this.showToast("Error: Missing membership ID", "error");
        return;
      }

      const $confirmButton = $(
        ".seamless-user-dashboard-modal-confirm-cancel-scheduled",
      );
      const originalText = $confirmButton
        .find(".seamless-user-dashboard-modal-confirm-cancel-scheduled-text")
        .text();

      // Disable button and show loading state
      $confirmButton.prop("disabled", true);
      $confirmButton
        .find(".seamless-user-dashboard-modal-confirm-cancel-scheduled-text")
        .text("Cancelling...");

      // Make AJAX request
      $.ajax({
        url: seamlessUserDashboard.ajaxUrl,
        type: "POST",
        data: {
          action: "seamless_cancel_scheduled_change",
          nonce: seamlessUserDashboard.cancelScheduledNonce,
          membership_id: membershipId,
          email: seamlessUserDashboard.userEmail,
        },
        success: function (response) {
          if (response.success) {
            const message =
              response.data?.message ||
              "Scheduled downgrade cancelled successfully!";
            self.showToast(message, "success");
            self.closeCancelScheduledModal();
            // Reload after a short delay to show the toast
            setTimeout(() => window.location.reload(), 2000);
          } else {
            const errorMessage =
              response.data && response.data.message
                ? response.data.message
                : "An error occurred. Please try again.";
            self.showToast("Error: " + errorMessage, "error");
            $confirmButton.prop("disabled", false);
            $confirmButton
              .find(
                ".seamless-user-dashboard-modal-confirm-cancel-scheduled-text",
              )
              .text(originalText);
          }
        },
        error: function (xhr, status, error) {
          console.error("Cancel Scheduled Downgrade Error:", error);
          self.showToast(
            "An error occurred while cancelling the scheduled downgrade. Please try again.",
            "error",
          );
          $confirmButton.prop("disabled", false);
          $confirmButton
            .find(
              ".seamless-user-dashboard-modal-confirm-cancel-scheduled-text",
            )
            .text(originalText);
        },
      });
    }

    escapeHtml(text) {
      return $("<div>").text(text).html();
    }

    /**
     * Initialize Organization Tab interactions
     */
    initOrganization() {
      const self = this;

      // Accordion toggle
      this.$widget.on("click", "[data-accordion-toggle]", function (e) {
        e.preventDefault();
        const $header = $(this);
        const $plan = $header.closest(".seamless-user-dashboard-org-plan");
        const $body = $plan.find(".seamless-user-dashboard-org-plan-body");
        const $chevron = $header.find(".seamless-user-dashboard-org-chevron");

        $body.slideToggle(250);
        $chevron.toggleClass("open");
      });

      // Resend invite
      this.$widget.on(
        "click",
        ".seamless-user-dashboard-org-resend-btn",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          const $btn = $(this);
          const membershipId = $btn.data("membership-id");
          const memberId = $btn.data("member-id");
          const originalHtml = $btn.html();

          if ($btn.prop("disabled")) return;
          $btn.prop("disabled", true);

          if ($btn.hasClass("seamless-org-resend-btn-text")) {
            $btn.html("<span>Sending...</span>");
          }

          let ajaxUrl;
          if (typeof seamless_ajax !== "undefined") {
            ajaxUrl = seamless_ajax.ajax_url;
          } else if (typeof seamlessAddonData !== "undefined") {
            ajaxUrl = seamlessAddonData.ajaxUrl;
          }

          $.ajax({
            url: ajaxUrl,
            type: "POST",
            data: {
              action: "seamless_resend_group_invite",
              nonce: seamlessUserDashboard.resendInviteNonce,
              membership_id: membershipId,
              member_id: memberId,
            },
            success: function (response) {
              if (response.success) {
                self.showToast(
                  response.data.message || "Invite resent successfully!",
                  "success",
                );
              } else {
                self.showToast(
                  response.data.message || "Failed to resend invite.",
                  "error",
                );
              }
              $btn.prop("disabled", false);
              $btn.html(originalHtml);
            },
            error: function () {
              self.showToast("Network error. Please try again.", "error");
              $btn.prop("disabled", false);
              $btn.html(originalHtml);
            },
          });
        },
      );

      // Remove member
      this.$widget.on(
        "click",
        ".seamless-user-dashboard-org-remove-btn",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          const $btn = $(this);
          const membershipId = $btn.data("membership-id");
          const memberId = $btn.data("member-id");

          if (!confirm("Are you sure you want to remove this member?")) return;
          if ($btn.prop("disabled")) return;
          $btn.prop("disabled", true);

          let ajaxUrl;
          if (typeof seamless_ajax !== "undefined") {
            ajaxUrl = seamless_ajax.ajax_url;
          } else if (typeof seamlessAddonData !== "undefined") {
            ajaxUrl = seamlessAddonData.ajaxUrl;
          }

          $.ajax({
            url: ajaxUrl,
            type: "POST",
            data: {
              action: "seamless_remove_group_member",
              nonce: seamlessUserDashboard.removeGroupMemberNonce,
              membership_id: membershipId,
              member_id: memberId,
            },
            success: function (response) {
              if (response.success) {
                self.showToast(
                  response.data.message || "Member removed successfully!",
                  "success",
                );
                // Remove the member row from DOM
                $btn
                  .closest(".seamless-user-dashboard-org-member-row")
                  .fadeOut(300, function () {
                    $(this).remove();
                  });
                // Reload org section
                setTimeout(function () {
                  self.fetchSection(
                    "organization",
                    "seamless-dashboard-organization-container",
                  );
                }, 1000);
              } else {
                self.showToast(
                  response.data.message || "Failed to remove member.",
                  "error",
                );
                $btn.prop("disabled", false);
              }
            },
            error: function () {
              self.showToast("Network error. Please try again.", "error");
              $btn.prop("disabled", false);
            },
          });
        },
      );

      // Open add member modal
      this.$widget.on(
        "click",
        ".seamless-user-dashboard-org-add-member-btn",
        function (e) {
          e.preventDefault();
          const $btn = $(this);
          const membershipId = $btn.data("membership-id");
          const remainingSeats =
            parseInt($btn.data("remaining-seats"), 10) || 0;
          const additionalEnabled =
            parseInt($btn.data("additional-enabled"), 10) === 1;
          const prorated = parseInt($btn.data("prorated"), 10) === 1;
          const perSeatPrice = parseFloat($btn.data("per-seat-price")) || 0;

          const $modal = $("#seamless-org-add-member-modal");
          $modal
            .find(".seamless-user-dashboard-org-add-confirm")
            .data("membership-id", membershipId);

          // Handle additional pricing display
          const $pricingBox = $modal.find("#seamless-org-pricing-box");
          if (additionalEnabled) {
            $pricingBox.show();

            const memberships =
              window.seamlessUserDashboard?.memberships?.current || [];
            const membership = memberships.find((m) => m.id === membershipId);
            const remainingDays = membership
              ? parseFloat(membership.remaining_days) || 0
              : 0;
            const remainingDaysRounded = Math.floor(remainingDays);

            let finalPrice = perSeatPrice;
            const $proratedPill = $modal.find(
              "#seamless-org-pricing-prorated-pill",
            );

            if (prorated && remainingDaysRounded > 0) {
              const totalDays = 31; // Common proration base logic
              finalPrice = (perSeatPrice / totalDays) * remainingDaysRounded;

              $proratedPill.show();
              $modal
                .find("#seamless-org-pricing-days-remaining")
                .text(remainingDaysRounded);
            } else {
              $proratedPill.hide();
            }

            $modal
              .find("#seamless-org-pricing-amount")
              .text("$" + finalPrice.toFixed(2));
            $modal
              .find("#seamless-org-pricing-base-price")
              .html(
                "Base price: " +
                  "<span class='base-price'>$" +
                  perSeatPrice.toFixed(2) +
                  "</span><span class='base-seat'>/seat</span>",
              );
            $modal
              .find("#seamless-org-pricing-remaining-seats")
              .text(remainingSeats + " seats remaining at no extra charge");
          } else {
            $pricingBox.hide();
          }

          // Reset CSV file input
          $modal.find("#seamless-org-import-csv").val("");
          $modal.find(".seamless-org-import-filename").text("No file chosen");

          // Reset form: initial rows = min(1, remainingSeats). If remaining = 0 but additional enabled, still show 1 row.
          const effectiveMax =
            remainingSeats > 0
              ? remainingSeats
              : additionalEnabled
                ? Infinity
                : 0;
          $modal
            .find(".seamless-user-dashboard-org-add-form")
            .html(self.getAddMemberRowHtml(0));

          // Store seat limits, pricing and admin info on the modal for reference
          $modal.data("remaining-seats", remainingSeats);
          $modal.data("additional-enabled", additionalEnabled ? 1 : 0);
          $modal.data("per-seat-price", perSeatPrice);
          $modal.data("prorated", prorated ? 1 : 0);
          $modal.data("group-seats", parseInt($btn.data("group-seats"), 10) || 0);
          $modal.data("member-count", parseInt($btn.data("member-count"), 10) || 0);
          $modal.data("group-admin-seats", parseInt($btn.data("group-admin-seats"), 10) || 0);
          $modal.data("current-admin-count", parseInt($btn.data("current-admin-count"), 10) || 0);

          // Show/hide Add Another Row button and limit notice based on remaining seats
          self._updateAddAnotherRowState(
            $modal,
            remainingSeats,
            additionalEnabled,
          );

          $modal.css("display", "flex");
          $("body").css("overflow", "hidden");
        },
      );

      // Close add member modal
      $(document).on(
        "click",
        ".seamless-user-dashboard-org-add-cancel, #seamless-org-add-member-modal .seamless-user-dashboard-modal-close, #seamless-org-add-member-modal .seamless-user-dashboard-modal-overlay",
        function (e) {
          e.preventDefault();
          $("#seamless-org-add-member-modal").hide();
          $("body").css("overflow", "");
        },
      );

      // Add another member row (limited to remaining seats)
      $(document).on(
        "click",
        ".seamless-user-dashboard-org-add-another-btn",
        function (e) {
          e.preventDefault();
          const $modal = $("#seamless-org-add-member-modal");
          const remainingSeats =
            parseInt($modal.data("remaining-seats"), 10) || 0;
          const additionalEnabled =
            parseInt($modal.data("additional-enabled"), 10) === 1;
          const $form = $(
            "#seamless-org-add-member-modal .seamless-user-dashboard-org-add-form",
          );
          const currentRows = $form.find(
            ".seamless-user-dashboard-org-add-row",
          ).length;

          // If additional seats not enabled and at limit — do nothing (button should already be hidden)
          if (!additionalEnabled && currentRows >= remainingSeats) {
            return;
          }

          const newIndex = currentRows;
          $form.append(self.getAddMemberRowHtml(newIndex));

          // Update button state after adding row
          self._updateAddAnotherRowState(
            $modal,
            remainingSeats,
            additionalEnabled,
          );
        },
      );

      // Download CSV Template
      $(document).on(
        "click",
        "#seamless-org-download-template-btn",
        function (e) {
          e.preventDefault();
          const csvContent =
            "data:text/csv;charset=utf-8,Email,First Name,Last Name,Role\njohn.doe@example.com,John,Doe,member\njane.smith@example.com,Jane,Smith,admin";
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "organization-members-template.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        },
      );

      // Handle CSV File Selection
      $(document).on("change", "#seamless-org-import-csv", function (e) {
        const file = e.target.files[0];
        if (!file) {
          $(".seamless-org-import-filename").text("No file chosen");
          return;
        }

        $(".seamless-org-import-filename").text(file.name);

        const reader = new FileReader();
        reader.onload = function (e) {
          const contents = e.target.result;
          const rows = contents.split(/[\r\n]+/);

          if (rows.length > 1) {
            const $form = $(
              "#seamless-org-add-member-modal .seamless-user-dashboard-org-add-form",
            );
            let hasAdded = false;

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i].trim();
              if (!row) continue;

              // Basic CSV split by comma (ignoring quoted commas for simplicity)
              const cols = row.split(",");
              if (cols.length >= 3) {
                if (!hasAdded) {
                  $form.empty();
                  hasAdded = true;
                }
                const newIndex = $form.find(
                  ".seamless-user-dashboard-org-add-row",
                ).length;
                const rowHtml = self.getAddMemberRowHtml(newIndex);
                const $newRow = $(rowHtml);

                $newRow
                  .find('input[name="member_email[]"]')
                  .val(cols[0].trim());
                $newRow
                  .find('input[name="member_first_name[]"]')
                  .val(cols[1].trim());
                $newRow
                  .find('input[name="member_last_name[]"]')
                  .val(cols[2].trim());

                if (cols[3] && cols[3].trim().toLowerCase() === "admin") {
                  $newRow.find('select[name="member_role[]"]').val("admin");
                } else {
                  $newRow.find('select[name="member_role[]"]').val("member");
                }

                $form.append($newRow);
              }
            }
          }
        };
        reader.readAsText(file);
      });

      // Confirm add members
      $(document).on(
        "click",
        ".seamless-user-dashboard-org-add-confirm",
        function (e) {
          e.preventDefault();
          const $btn = $(this);
          const membershipId = $btn.data("membership-id");
          if ($btn.prop("disabled")) return;

          // Collect member data
          const members = [];
          const $rows = $(
            "#seamless-org-add-member-modal .seamless-user-dashboard-org-add-row",
          );
          let isValid = true;

          $rows.each(function () {
            const email = $(this)
              .find('input[name="member_email[]"]')
              .val()
              .trim();
            const firstName = $(this)
              .find('input[name="member_first_name[]"]')
              .val()
              .trim();
            const lastName = $(this)
              .find('input[name="member_last_name[]"]')
              .val()
              .trim();
            const role = $(this).find('select[name="member_role[]"]').val();

            if (!email || !firstName || !lastName) {
              isValid = false;
              return false;
            }

            members.push({
              email: email,
              first_name: firstName,
              last_name: lastName,
              role: role,
            });
          });

          if (!isValid || members.length === 0) {
            self.showToast("Please fill in all required fields.", "error");
            return;
          }

          // --- Admin seat validation ---
          const $addModal = $("#seamless-org-add-member-modal");
          const groupAdminSeats = parseInt($addModal.data("group-admin-seats"), 10) || 0;
          const currentAdminCount = parseInt($addModal.data("current-admin-count"), 10) || 0;
          console.log("currentAdminCount", currentAdminCount);
          if (groupAdminSeats > 0) {
            const newAdmins = members.filter((m) => m.role === "admin").length;
            if (newAdmins > 0 && currentAdminCount + newAdmins > groupAdminSeats) {
              self.showToast(
                "Could not add admin(s). This plan includes only " + groupAdminSeats + " admin seat(s) and you already have " + currentAdminCount + ".",
                "error"
              );
              return;
            }
          }

          // Check if invited members exceed remaining seats
          const remainingSeats = parseInt($addModal.data("remaining-seats"), 10) || 0;
          const additionalEnabled = parseInt($addModal.data("additional-enabled"), 10) === 1;

          if (additionalEnabled && members.length > remainingSeats) {
            // Show Warning Modal
            const $warningModal = $("#seamless-org-seat-warning-modal");
            const additionalCount = members.length - remainingSeats;
            const perSeatPrice = parseFloat($addModal.data("per-seat-price")) || 0;
            const prorated = parseInt($addModal.data("prorated"), 10) === 1;
            const groupSeats = parseInt($addModal.data("group-seats"), 10) || 0;
            // new total = current accepted + newly invited
            const newTotalMembers = (parseInt($addModal.data("member-count"), 10) || 0) + members.length;

            const memberships = window.seamlessUserDashboard?.memberships?.current || [];
            const membership = memberships.find((m) => m.id === membershipId);
            const remainingDays = membership ? parseFloat(membership.remaining_days) || 0 : 0;
            const remainingDaysRounded = Math.floor(remainingDays);

            let pricePerSeat = perSeatPrice;
            if (prorated && remainingDaysRounded > 0) {
              const totalDays = 31;
              pricePerSeat = (perSeatPrice / totalDays) * remainingDaysRounded;
            }

            const totalAdditionalCost = pricePerSeat * additionalCount;

            // Fix message: show only additional count, show capacity as newTotal/groupSeats
            $warningModal.find("#warning-invited-count").text(additionalCount);
            $warningModal.find("#warning-total-members").text(newTotalMembers);
            $warningModal.find("#warning-group-seats").text(groupSeats);
            $warningModal.find("#warning-total-cost").text("$" + totalAdditionalCost.toFixed(2));
            $warningModal.find("#warning-additional-count").text(additionalCount);
            $warningModal.find("#warning-additional-cost").text("$" + totalAdditionalCost.toFixed(2));

            // Store data for proceed
            $warningModal.data("membershipId", membershipId);
            $warningModal.data("members", members);
            $warningModal.data("remainingSeats", remainingSeats);

            $("#seamless-org-add-member-modal").hide();
            $warningModal.css("display", "flex");
            return;
          }

          $btn.prop("disabled", true);
          $btn
            .find(".seamless-user-dashboard-org-add-confirm-text")
            .text("Sending...");

          let ajaxUrl;
          if (typeof seamless_ajax !== "undefined") {
            ajaxUrl = seamless_ajax.ajax_url;
          } else if (typeof seamlessAddonData !== "undefined") {
            ajaxUrl = seamlessAddonData.ajaxUrl;
          }

          $.ajax({
            url: ajaxUrl,
            type: "POST",
            data: {
              action: "seamless_add_group_members",
              nonce: seamlessUserDashboard.addGroupMembersNonce,
              membership_id: membershipId,
              members: JSON.stringify(members),
            },
            success: function (response) {
              if (response.success) {
                const data = response.data?.data || response.data || {};

                // Check if Stripe payment is required
                if (data.requires_payment && data.stripe_checkout_url) {
                  $("#seamless-org-add-member-modal").hide();
                  $("body").css("overflow", "");
                  window.location.href = data.stripe_checkout_url;
                  return;
                }

                self.showToast(
                  response.data.message || "Members added successfully!",
                  "success",
                );
                $("#seamless-org-add-member-modal").hide();
                $("body").css("overflow", "");
                // Reload org section
                self.fetchSection(
                  "organization",
                  "seamless-dashboard-organization-container",
                );
              } else {
                self.showToast(
                  response.data.message || "Failed to add members.",
                  "error",
                );
              }
              $btn.prop("disabled", false);
              $btn
                .find(".seamless-user-dashboard-org-add-confirm-text")
                .text("Send Invites");
            },
            error: function () {
              self.showToast("Network error. Please try again.", "error");
              $btn.prop("disabled", false);
              $btn
                .find(".seamless-user-dashboard-org-add-confirm-text")
                .text("Send Invites");
            },
          });
        },
      );

      // Warning modal handlers
      $(document).on(
        "click",
        "#seamless-org-seat-warning-modal .seamless-user-dashboard-modal-close, .seamless-org-warning-cancel",
        function (e) {
          e.preventDefault();
          $("#seamless-org-seat-warning-modal").hide();
          $("#seamless-org-add-member-modal").show();
        },
      );

      $(document).on(
        "click",
        ".seamless-org-warning-proceed",
        function (e) {
          e.preventDefault();
          const $btn = $(this);
          if ($btn.prop("disabled")) return;

          const $warningModal = $("#seamless-org-seat-warning-modal");
          const membershipId = $warningModal.data("membershipId");
          const members = $warningModal.data("members");
          const remainingSeats = $warningModal.data("remainingSeats");

          $btn.prop("disabled", true).text("Processing...");

          const ajaxUrl = typeof seamless_ajax !== "undefined" ? seamless_ajax.ajax_url : (typeof seamlessAddonData !== "undefined" ? seamlessAddonData.ajaxUrl : "");

          const freeMembers = members.slice(0, remainingSeats);
          const paidMembers = members.slice(remainingSeats);

          // Step 1: Add free members
          if (freeMembers.length > 0) {
            $.ajax({
              url: ajaxUrl,
              type: "POST",
              data: {
                action: "seamless_add_group_members",
                nonce: seamlessUserDashboard.addGroupMembersNonce,
                membership_id: membershipId,
                members: JSON.stringify(freeMembers),
              },
              success: function (response) {
                if (response.success) {
                  // Step 2: Add paid members (triggers redirect)
                  self._triggerPaidMemberAdd(ajaxUrl, membershipId, paidMembers, $btn);
                } else {
                  self.showToast(response.data?.message || "Failed to add initial members.", "error");
                  $btn.prop("disabled", false).text("PROCEED TO PAYMENT");
                }
              },
              error: function () {
                self.showToast("Network error. Please try again.", "error");
                $btn.prop("disabled", false).text("PROCEED TO PAYMENT");
              },
            });
          } else {
            // No free members, just add paid members
            self._triggerPaidMemberAdd(ajaxUrl, membershipId, paidMembers, $btn);
          }
        },
      );

      // Role change: show save button when new role is selected
      $(document).on(
        "change",
        ".seamless-user-dashboard-org-role-change-select",
        function () {
          const $wrap = $(this).closest(
            ".seamless-user-dashboard-org-role-change-wrap",
          );
          const originalRole = $wrap.data("current-role");
          const $saveBtn = $wrap.find(
            ".seamless-user-dashboard-org-role-save-btn",
          );
          if ($(this).val() !== originalRole) {
            $saveBtn.show();
          } else {
            $saveBtn.hide();
          }
        },
      );

      // Role change: save button click
      $(document).on(
        "click",
        ".seamless-user-dashboard-org-role-save-btn",
        function (e) {
          e.preventDefault();
          const $btn = $(this);
          if ($btn.prop("disabled")) return;
          const membershipId = $btn.data("membership-id");
          const memberId = $btn.data("member-id");
          const $wrap = $btn.closest(
            ".seamless-user-dashboard-org-role-change-wrap",
          );
          const $select = $wrap.find(
            ".seamless-user-dashboard-org-role-change-select",
          );
          const newRole = $select.val();

          // Admin seat validation on role change
          if (newRole === "admin") {
            // Read limits from the closest plan container
            const $planRow = $btn.closest(".seamless-user-dashboard-org-plan");
            const $addBtn = $planRow.find(".seamless-user-dashboard-org-add-member-btn");
            const groupAdminSeats = parseInt($addBtn.data("group-admin-seats"), 10) || 0;
            const currentAdminCount = parseInt($addBtn.data("current-admin-count"), 10) || 0;
            // originalRole was member, so adding 1 admin
            if (groupAdminSeats > 0 && currentAdminCount >= groupAdminSeats) {
              self.showToast(
                "Could not change role to Admin. This plan includes only " + groupAdminSeats + " admin seat(s) and all are occupied.",
                "error"
              );
              // Reset select
              $wrap.find(".seamless-user-dashboard-org-role-change-select").val(originalRole);
              $saveBtn.hide();
              $btn.prop("disabled", false);
              return;
            }
          }

          $btn.prop("disabled", true);

          $.ajax({
            url: seamlessUserDashboard.ajaxUrl,
            type: "POST",
            data: {
              action: "seamless_change_member_role",
              nonce: seamlessUserDashboard.changeRoleNonce,
              membership_id: membershipId,
              member_id: memberId,
              role: newRole,
            },
            success: function (response) {
              if (response.success) {
                self.showToast(
                  response.data?.message || "Role updated successfully!",
                  "success",
                );
                setTimeout(() => window.location.reload(), 2000);
                $wrap.data("current-role", newRole);
                $btn.hide().prop("disabled", false);
                
                // Update role badge in the UI immediately without reload
                const $memberRow = $btn.closest(".seamless-user-dashboard-org-member-row");
                const $nameSpan = $memberRow.find(".seamless-user-dashboard-org-member-name");
                $nameSpan.find(".seamless-user-dashboard-org-role-badge").remove();
                
                if (newRole === "admin") {
                  $nameSpan.append(' <span class="seamless-user-dashboard-org-role-badge seamless-org-role-admin">Admin</span>');
                } else if (newRole === "owner") {
                  $nameSpan.append(' <span class="seamless-user-dashboard-org-role-badge seamless-org-role-owner">Owner</span>');
                }
              } else {
                self.showToast(
                  response.data?.message || "Failed to update role.",
                  "error",
                );
                $select.val($wrap.data("current-role"));
                $btn.hide().prop("disabled", false);
              }
            },
            error: function () {
              self.showToast("Network error. Please try again.", "error");
              $select.val($wrap.data("current-role"));
              $btn.hide().prop("disabled", false);
            },
          });
        },
      );
    }

    /**
     * Toggle add-another-row button based on seat availability
     */
    _updateAddAnotherRowState($modal, remainingSeats, additionalEnabled) {
      const $addAnotherBtn = $modal.find(
        ".seamless-user-dashboard-org-add-another-btn",
      );
      let $limitMsg = $modal.find(".seamless-org-seat-limit-msg");

      if (!additionalEnabled) {
        // Count current rows
        const currentRows = $modal.find(
          ".seamless-user-dashboard-org-add-row",
        ).length;

        if (currentRows >= remainingSeats) {
          $addAnotherBtn.hide();
          if (!$limitMsg.length) {
            $limitMsg = $(
              `<div class="seamless-org-seat-limit-msg">\n                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>\n                Seat limit reached (${remainingSeats} seat${remainingSeats !== 1 ? "s" : ""} available)\n              </div>`,
            );
            $addAnotherBtn.after($limitMsg);
          }
        } else {
          $addAnotherBtn.show();
          $limitMsg.remove();
        }
      } else {
        // Additional seats enabled — always show the button
        $addAnotherBtn.show();
        $limitMsg.remove();
      }
    }

    /**
     * Helper to trigger paid member addition and redirect
     */
    _triggerPaidMemberAdd(ajaxUrl, membershipId, members, $btn) {
      const self = this;
      $.ajax({
        url: ajaxUrl,
        type: "POST",
        data: {
          action: "seamless_add_group_members",
          nonce: seamlessUserDashboard.addGroupMembersNonce,
          membership_id: membershipId,
          members: JSON.stringify(members),
        },
        success: function (response) {
          const data = response.data?.data || response.data || {};
          if (data.requires_payment && data.stripe_checkout_url) {
            window.location.href = data.stripe_checkout_url;
          } else {
            self.showToast("Members added successfully!", "success");
            $("#seamless-org-seat-warning-modal").hide();
            $("body").css("overflow", "");
            self.fetchSection(
              "organization",
              "seamless-dashboard-organization-container",
            );
          }
        },
        error: function () {
          self.showToast("Network error during payment processing.", "error");
          $btn.prop("disabled", false).text("PROCEED TO PAYMENT");
        },
      });
    }

    /**
     * Get HTML for a new add member row
     */
    getAddMemberRowHtml(index) {
      return `
        <div class="seamless-user-dashboard-org-add-row" data-row-index="${index}">
          <div class="seamless-user-dashboard-org-add-field">
            <label>First Name <span class="required">*</span></label>
            <input type="text" name="member_first_name[]" placeholder="e.g. John" required>
          </div>
          <div class="seamless-user-dashboard-org-add-field">
            <label>Last Name <span class="required">*</span></label>
            <input type="text" name="member_last_name[]" placeholder="e.g. Doe" required>
          </div>
          <div class="seamless-user-dashboard-org-add-field">
            <label>Email <span class="required">*</span></label>
            <input type="email" name="member_email[]" placeholder="e.g. john@company.com" required>
          </div>
          <div class="seamless-user-dashboard-org-add-field seamless-user-dashboard-org-add-field-role">
            <label>Role</label>
            <div class="seamless-user-dashboard-org-role-wrap">
              <select name="member_role[]">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button type="button" class="seamless-user-dashboard-org-remove-row-btn" aria-label="Remove Row" title="Remove Member">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Initialize all user dashboard widgets
   */
  function initUserDashboardWidgets() {
    $(".seamless-user-dashboard").each(function () {
      const widget = new UserDashboardWidget($(this));
    });

    // Handle dynamically removing rows
    $(document).on(
      "click",
      ".seamless-user-dashboard-org-remove-row-btn",
      function (e) {
        e.preventDefault();
        // Ensure we don't remove if it's the only one
        const $row = $(this).closest(".seamless-user-dashboard-org-add-row");
        const $form = $row.closest(".seamless-user-dashboard-org-add-form");
        if ($form.find(".seamless-user-dashboard-org-add-row").length > 1) {
          $row.remove();
        }
      },
    );
  }

  // Initialize on document ready
  $(document).ready(function () {
    initUserDashboardWidgets();
  });

  // Re-initialize after Elementor preview refresh
  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/seamless-user-dashboard.default",
      function ($scope) {
        const widget = new UserDashboardWidget(
          $scope.find(".seamless-user-dashboard"),
        );
      },
    );
  });
})(jQuery);
