/**
 * Seamless Memberships Widget
 *
 * Handles client-side fetching and rendering for Memberships List and Compare Plans widgets.
 */
(function ($) {
  "use strict";

  var SeamlessMembershipsWidget = {
    init: function () {
      var self = this;

      // Wait for SeamlessAPI to be ready
      if (typeof window.SeamlessAPI === "undefined") {
        setTimeout(function () {
          self.init();
        }, 500);
        return;
      }

      // Initialize Memberships List
      $(".seamless-memberships-list-wrapper").each(function () {
        self.initMembershipsList($(this));
      });

      // Initialize Membership Compare
      $(".seamless-membership-compare-wrapper").each(function () {
        self.initMembershipCompare($(this));
      });
    },

    /**
     * Initialize Memberships List Widget
     */
    initMembershipsList: function ($wrapper) {
      var self = this;
      var columns = $wrapper.data("columns") || 3;
      var $container = $wrapper.find(".seamless-membership-grid");

      if ($container.length === 0) {
        // If container doesn't exist (loading state), create it
        $container = $('<div class="seamless-membership-grid"></div>');
        $wrapper.append($container);
      }

      // REMOVED: grid-template-columns is handled by Elementor CSS for responsiveness
      // $container.css('grid-template-columns', 'repeat(' + columns + ', 1fr)');

      // Show loading state
      var lid = Math.random().toString(36).substr(2, 6);
      $container.html(
        '<div class="seamless-loader"><div class="seamless-plugin-loader"><svg xmlns="http://www.w3.org/2000/svg" class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true"><defs><linearGradient id="swg1-' +
          lid +
          '" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"/><stop offset=".2" stop-color="#2ac9e4"/><stop offset=".4" stop-color="#6383ed"/><stop offset=".6" stop-color="#904bf5"/><stop offset=".8" stop-color="#b022fa"/><stop offset=".9" stop-color="#c40afd"/><stop offset="1" stop-color="#cc01ff"/></linearGradient><linearGradient id="swg2-' +
          lid +
          '" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"/><stop offset=".2" stop-color="#2ac9e4"/><stop offset=".4" stop-color="#6383ed"/><stop offset=".6" stop-color="#904bf5"/><stop offset=".8" stop-color="#b022fa"/><stop offset=".9" stop-color="#c40afd"/><stop offset="1" stop-color="#cc01ff"/></linearGradient><linearGradient id="swg3-' +
          lid +
          '" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"/><stop offset=".2" stop-color="#2ac9e4"/><stop offset=".4" stop-color="#6383ed"/><stop offset=".6" stop-color="#904bf5"/><stop offset=".8" stop-color="#b022fa"/><stop offset=".9" stop-color="#c40afd"/><stop offset="1" stop-color="#cc01ff"/></linearGradient></defs><g class="sl-ring-outer"><path fill="url(#swg2-' +
          lid +
          ')" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z"/></g><g class="sl-ring-mid"><path fill="url(#swg3-' +
          lid +
          ')" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z"/></g><g class="sl-ring-inner"><path fill="url(#swg1-' +
          lid +
          ')" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z"/></g></svg></div><p>Loading memberships...</p></div>',
      );

      // Fetch memberships with full details
      window.SeamlessAPI.getAllMembershipPlans()
        .then(function (memberships) {
          self.renderMembershipsList($container, memberships);
        })
        .catch(function (error) {
          console.error("Seamless Memberships: Error fetching plans", error);
          $container.html(
            '<div class="seamless-error">Failed to load memberships. Please try again later.</div>',
          );
        });
    },

    /**
     * Render Memberships List
     */
    renderMembershipsList: function ($container, memberships) {
      if (!memberships || memberships.length === 0) {
        $container.html(
          '<div class="seamless-no-memberships">No memberships found.</div>',
        );
        return;
      }

      var html = "";
      // Prioritize the domain from the initialized SeamlessAPI
      var domain = "";
      if (window.SeamlessAPI && window.SeamlessAPI.apiDomain) {
        domain = window.SeamlessAPI.apiDomain;
      } else if (window.SeamlessSettings && window.SeamlessSettings.root) {
        domain = window.SeamlessSettings.root.replace(/\/api\/?$/, ""); // strip /api
      } else if (window.seamless_client_domain) {
        domain = window.seamless_client_domain;
      }

      memberships.forEach(
        function (plan) {
          html += this.buildMembershipCard(plan, domain);
        }.bind(this),
      );

      $container.html(html);
    },

    /**
     * Build HTML for a single membership card
     */
    buildMembershipCard: function (plan, domain) {
      var label = plan.label || (plan.plan ? plan.plan.label : "") || "";

      // Check for price in root or serialized data
      var price = plan.price;
      if (price === undefined && plan.serialized_plan_data) {
        price = plan.serialized_plan_data.price;
      }
      price = price || 0;

      var description = plan.description || "";
      var signup_fee = plan.signup_fee || 0;

      // Fix: Check trial_days in root OR serialized_plan_data
      var trial_days = plan.trial_days;
      if (trial_days === undefined && plan.serialized_plan_data) {
        trial_days = plan.serialized_plan_data.trial_days;
      }
      trial_days = trial_days || 0;

      var period_display = plan.billing_cycle_display || "";
      var membership_id = plan.id || "";

      var is_lifetime =
        plan.lifetime_access ||
        (period_display &&
          period_display.toLowerCase().indexOf("lifetime") !== -1);
      var badge_text = is_lifetime ? "Lifetime access" : "Subscription plan";

      var renew_text = "";
      if (!is_lifetime) {
        if (period_display.toLowerCase().indexOf("month") !== -1) {
          renew_text = "Renew after month";
        } else if (period_display.toLowerCase().indexOf("year") !== -1) {
          renew_text = "Renew after year";
        } else {
          renew_text = period_display;
        }
      } else {
        renew_text = "One-time payment";
      }

      var features = [];
      if (trial_days > 0) features.push(trial_days + " day free trial");
      if (signup_fee > 0)
        features.push("Signup fee $" + parseFloat(signup_fee).toFixed(2));

      if (plan.pricing && plan.pricing.length > 0) {
        var first_renewal = plan.pricing[0];
        if (first_renewal.price && first_renewal.price != price) {
          features.push(
            "Renews at $" + first_renewal.price + " after initial term",
          );
        } else if (!is_lifetime && first_renewal.price) {
          features.push(
            "Renews at $" + first_renewal.price + " after initial term",
          );
        }
      }

      // Clean description (strip HTML)
      var clean_desc = $("<div/>").html(description).text();
      //   if (clean_desc.length > 100)
      //     clean_desc = clean_desc.substring(0, 100) + "...";

      var membership_url = domain + "/memberships/" + membership_id;
      var seats = this.getGroupSeats(plan);
      var hasSeatsBadge = seats > 0;
      // Best Value logic - placeholder
      var is_best_value = false;

      var cardHtml = '<div class="seamless-membership-card">';
      if (is_best_value) {
        cardHtml += '<div class="seamless-best-value">Best Value</div>';
      }

      cardHtml += '<div class="seamless-card-header">';
      cardHtml += '<div class="seamless-card-title">' + label + "</div>";
      cardHtml +=
        '<div class="seamless-card-price-bubble">$' + price + "</div>";
      cardHtml += "</div>";

      cardHtml += '<div class="seamless-card-meta">';
      cardHtml += '<div class="seamless-card-meta-badges">';
      cardHtml +=
        '<div class="seamless-meta-badge"><i class="far fa-clock"></i> ' +
        this.escapeHtml(badge_text) +
        "</div>";
      if (hasSeatsBadge) {
        cardHtml +=
          '<div class="seamless-meta-badge seamless-meta-badge-seats"><i class="fas fa-users"></i> ' +
          this.escapeHtml(seats + " " + (seats === 1 ? "seat" : "seats")) +
          "</div>";
      }
      cardHtml += "</div>";
      cardHtml += '<div class="seamless-renewal-text">' + renew_text + "</div>";
      cardHtml += "</div>";

      cardHtml +=
        '<div class="seamless-card-description">' + clean_desc + "</div>";

      cardHtml += '<ul class="seamless-features-list">';
      features.forEach(function (feature) {
        cardHtml +=
          '<li class="seamless-feature-item"><span class="seamless-feature-icon">✓</span> ' +
          feature +
          "</li>";
      });
      cardHtml += "</ul>";

      cardHtml +=
        '<a href="' +
        membership_url +
        '" class="seamless-card-button">Get Started <i class="fas fa-chevron-right"></i></a>';
      cardHtml += "</div>";

      return cardHtml;
    },

    /**
     * Escape HTML entities in dynamic strings before rendering.
     */
    escapeHtml: function (value) {
      return $("<div/>").text(value || "").html();
    },

    /**
     * Read a value from the plan object or nested plan data.
     */
    getPlanValue: function (plan, key) {
      if (plan && plan[key] !== undefined && plan[key] !== null) {
        return plan[key];
      }

      if (plan && plan.plan && plan.plan[key] !== undefined && plan.plan[key] !== null) {
        return plan.plan[key];
      }

      if (
        plan &&
        plan.serialized_plan_data &&
        plan.serialized_plan_data[key] !== undefined &&
        plan.serialized_plan_data[key] !== null
      ) {
        return plan.serialized_plan_data[key];
      }

      return null;
    },

    /**
     * Extract group seat count for group memberships.
     */
    getGroupSeats: function (plan) {
      var isGroupMembership = this.getPlanValue(plan, "is_group_membership");
      var seats = this.getPlanValue(plan, "group_seats");

      if (
        isGroupMembership !== true &&
        isGroupMembership !== 1 &&
        isGroupMembership !== "1" &&
        seats !== 0 &&
        !seats
      ) {
        return 0;
      }

      var parsedSeats = parseInt(seats, 10);
      return isNaN(parsedSeats) || parsedSeats < 1 ? 0 : parsedSeats;
    },

    /**
     * Initialize Membership Compare Widget
     */
    initMembershipCompare: function ($wrapper) {
      var self = this;
      var $container = $wrapper.find(".seamless-compare-table");

      if ($container.length === 0) {
        $container = $('<div class="seamless-compare-table"></div>');
        $wrapper.append($container);
      }

      var lid = Math.random().toString(36).substr(2, 6);
      $container.html(
        '<div class="seamless-loader"><div class="seamless-plugin-loader"><svg xmlns="http://www.w3.org/2000/svg" class="sync-wheel-svg" viewBox="62 64 282 282" aria-hidden="true"><defs><linearGradient id="swg1-' +
          lid +
          '" x1="135.2" y1="221.8" x2="271.3" y2="221.8" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"/><stop offset=".2" stop-color="#2ac9e4"/><stop offset=".4" stop-color="#6383ed"/><stop offset=".6" stop-color="#904bf5"/><stop offset=".8" stop-color="#b022fa"/><stop offset=".9" stop-color="#c40afd"/><stop offset="1" stop-color="#cc01ff"/></linearGradient><linearGradient id="swg2-' +
          lid +
          '" x1="62.7" y1="214.6" x2="343.9" y2="214.6" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"/><stop offset=".2" stop-color="#2ac9e4"/><stop offset=".4" stop-color="#6383ed"/><stop offset=".6" stop-color="#904bf5"/><stop offset=".8" stop-color="#b022fa"/><stop offset=".9" stop-color="#c40afd"/><stop offset="1" stop-color="#cc01ff"/></linearGradient><linearGradient id="swg3-' +
          lid +
          '" x1="99.4" y1="214.7" x2="314.3" y2="214.7" gradientTransform="translate(0 420) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0fd"/><stop offset=".2" stop-color="#2ac9e4"/><stop offset=".4" stop-color="#6383ed"/><stop offset=".6" stop-color="#904bf5"/><stop offset=".8" stop-color="#b022fa"/><stop offset=".9" stop-color="#c40afd"/><stop offset="1" stop-color="#cc01ff"/></linearGradient></defs><g class="sl-ring-outer"><path fill="url(#swg2-' +
          lid +
          ')" d="M203,64.7c-77.5.2-140.5,63.4-140.3,140.9,0,34.4,12.6,65.9,33.2,90.3-1.6,3.2-2.6,6.8-2.6,10.6,0,12.6,10.3,22.9,23,22.9s9.6-1.6,13.3-4.3c21.5,13.3,46.9,21,74,20.9,77.5-.2,140.5-63.4,140.3-140.9-.2-77.5-63.4-140.5-140.9-140.3h0ZM116.3,316c-5.2,0-9.5-4.2-9.5-9.5s4.2-9.5,9.5-9.5,9.5,4.2,9.5,9.5-4.2,9.5-9.5,9.5ZM203.6,332.5c-24.1,0-46.6-6.6-65.8-18.2.9-2.5,1.4-5.1,1.4-7.9,0-12.6-10.3-22.9-23-22.9s-7.7,1-10.9,2.8c-18.2-21.9-29.1-50-29.2-80.7-.2-70.1,56.8-127.3,126.9-127.5s127.3,56.8,127.5,126.9-56.8,127.3-126.9,127.5Z"/></g><g class="sl-ring-mid"><path fill="url(#swg3-' +
          lid +
          ')" d="M305.1,226.9c1.5-7,2.3-14.2,2.3-21.6,0-57.4-46.7-104-104-104s-104,46.7-104,104,46.7,104,104,104,64.3-16.4,83.3-41.7c1.5.3,3.1.5,4.7.5,12.6,0,22.9-10.3,22.9-22.9s-3.6-14.1-9.2-18.3h0ZM203.3,296c-50,0-90.6-40.7-90.6-90.6s40.7-90.6,90.6-90.6,90.6,40.7,90.6,90.6-.6,11.5-1.6,17h-1c-12.6,0-22.9,10.3-22.9,22.9s2.4,11.7,6.4,15.8c-16.6,21.2-42.4,34.9-71.4,34.9h0ZM291.4,254.7c-5.2,0-9.5-4.3-9.5-9.5s4.3-9.5,9.5-9.5,9.5,4.3,9.5,9.5-4.3,9.5-9.5,9.5Z"/></g><g class="sl-ring-inner"><path fill="url(#swg1-' +
          lid +
          ')" d="M225.6,141.1c-2.2-10.4-11.5-18.2-22.5-18.1-11,0-20.2,7.9-22.4,18.3-26.5,9.4-45.5,34.7-45.5,64.3s30.7,68,68.2,67.9c37.5,0,68-30.7,67.9-68.2,0-29.7-19.2-54.9-45.8-64.1h0ZM203.2,136.3c5.2,0,9.5,4.2,9.5,9.5s-4.2,9.5-9.5,9.5-9.5-4.2-9.5-9.5,4.2-9.5,9.5-9.5ZM203.5,260c-30.1,0-54.7-24.4-54.8-54.5,0-22.7,13.8-42.2,33.5-50.5,3.5,8.1,11.7,13.8,21.1,13.8s17.5-5.7,21-13.9c19.7,8.2,33.7,27.7,33.7,50.3s-24.4,54.7-54.5,54.8Z"/></g></svg></div><p>Loading comparison...</p></div>',
      );

      window.SeamlessAPI.getAllMembershipPlans()
        .then(function (memberships) {
          self.renderMembershipCompare($container, memberships);
        })
        .catch(function (error) {
          console.error(
            "Seamless Memberships: Error fetching plans for compare",
            error,
          );
          $container.html(
            '<div class="seamless-error" style="padding: 20px; text-align: center; color: red;">Failed to load comparison.</div>',
          );
        });
    },

    /**
     * Render Comparison Table
     */
    renderMembershipCompare: function ($container, memberships) {
      if (!memberships || memberships.length === 0) {
        $container.html(
          '<div class="seamless-no-memberships" style="padding: 20px; text-align: center;">No memberships found.</div>',
        );
        return;
      }

      var $wrapper = $container.closest(".seamless-membership-compare-wrapper");
      var compareTitle = $wrapper.data("compare-title") || "Compare Plans";
      var compareNote =
        $wrapper.data("compare-note") ||
        "See what's included before you decide.";
      var offeringLabel = $wrapper.data("offering-label") || "Offering";
      // var tableMinWidth = Math.max(680, (memberships.length + 1) * 180);

      // Collect all rules
      var allRules = [];
      memberships.forEach(function (plan) {
        if (plan.content_rules) {
          Object.keys(plan.content_rules).forEach(function (key) {
            if (allRules.indexOf(key) === -1) {
              allRules.push(key);
            }
          });
        }
      });

      var tableHtml = '<div class="seamless-compare-section">';
      tableHtml += '<div class="seamless-compare-section-header">';
      if (compareTitle) {
        tableHtml +=
          '<h2 class="seamless-compare-title">' +
          this.escapeHtml(compareTitle) +
          "</h2>";
      }
      if (compareNote) {
        tableHtml +=
          '<div class="seamless-compare-note">' +
          this.escapeHtml(compareNote) +
          "</div>";
      }
      tableHtml += "</div>";
      tableHtml += '<div class="seamless-compare-table-shell">';
      tableHtml += "<table>";

      // Header
      tableHtml += "<thead><tr>";
      tableHtml +=
        '<th class="seamless-compare-header">' +
        this.escapeHtml(offeringLabel) +
        "</th>";
      memberships.forEach(
        function (plan) {
          var planName = plan.label || "";
          var planPriceLine = this.getComparePlanPriceLine(plan);

          tableHtml += '<th class="seamless-compare-header">';
          tableHtml +=
            '<div class="seamless-compare-plan-name">' +
            this.escapeHtml(planName) +
            "</div>";
          tableHtml +=
            '<div class="seamless-compare-plan-price">' +
            this.escapeHtml(planPriceLine) +
            "</div>";
          tableHtml += "</th>";
        }.bind(this),
      );

      tableHtml += "</tr></thead>";

      // Body
      tableHtml += "<tbody>";
      if (allRules.length > 0) {
        allRules.forEach(
          function (ruleKey) {
            tableHtml += '<tr class="seamless-compare-row">';
            tableHtml +=
              '<td class="seamless-compare-feature-title">' +
              this.escapeHtml(ruleKey) +
              "</td>";
            memberships.forEach(
              function (plan) {
                var rawValue =
                  plan.content_rules && plan.content_rules[ruleKey] !== undefined
                    ? plan.content_rules[ruleKey]
                    : "";
                var displayValue = this.formatCompareValue(rawValue);
                var cellClass = this.isEmptyCompareValue(rawValue)
                  ? " seamless-compare-cell-empty"
                  : "";

                tableHtml +=
                  '<td class="seamless-compare-cell' +
                  cellClass +
                  '">' +
                  displayValue +
                  "</td>";
              }.bind(this),
            );
            tableHtml += "</tr>";
          }.bind(this),
        );
      } else {
        tableHtml +=
          '<tr class="seamless-compare-row"><td colspan="' +
          (memberships.length + 1) +
          '" class="seamless-compare-empty-state">No comparison features available.</td></tr>';
      }
      tableHtml += "</tbody></table></div></div>";

      $container.html(tableHtml);
    },

    getComparePlanPriceLine: function (plan) {
      var price = plan.price;
      if (price === undefined && plan.serialized_plan_data) {
        price = plan.serialized_plan_data.price;
      }

      price = price || 0;
      var period = plan.billing_cycle_display || "";

      if (!period) {
        return "$" + price;
      }

      if (period.toLowerCase().indexOf("month") !== -1) {
        return "$" + price + " / month";
      }

      if (period.toLowerCase().indexOf("year") !== -1) {
        return "$" + price + " / year";
      }

      if (period.toLowerCase().indexOf("lifetime") !== -1) {
        return "$" + price + " / lifetime";
      }

      return "$" + price + " " + period;
    },

    formatCompareValue: function (value) {
      if (value === true || value === "true" || value === 1 || value === "1") {
        return "Included";
      }

      if (
        value === false ||
        value === "false" ||
        value === 0 ||
        value === "0" ||
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return '<span class="seamless-compare-cell-empty">—</span>';
      }

      return this.escapeHtml(String(value));
    },

    isEmptyCompareValue: function (value) {
      return (
        value === false ||
        value === "false" ||
        value === 0 ||
        value === "0" ||
        value === null ||
        value === undefined ||
        value === ""
      );
    },
  };

  // Initialize on ready
  $(document).ready(function () {
    SeamlessMembershipsWidget.init();
  });

  // Re-init on Elementor frontend actions (if needed, e.g. popup or load)
  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/seamless-memberships-list.default",
      function ($scope) {
        SeamlessMembershipsWidget.initMembershipsList(
          $scope.find(".seamless-memberships-list-wrapper"),
        );
      },
    );
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/seamless-membership-compare.default",
      function ($scope) {
        SeamlessMembershipsWidget.initMembershipCompare(
          $scope.find(".seamless-membership-compare-wrapper"),
        );
      },
    );
  });
})(jQuery);
