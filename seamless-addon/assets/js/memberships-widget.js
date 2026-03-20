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
      $container.html(
        '<div class="seamless-loader"><div class="seamless-spinners"></div><p>Loading memberships...</p></div>',
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
      cardHtml +=
        '<div class="seamless-meta-badge"><i class="far fa-clock"></i> ' +
        badge_text +
        "</div>";
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
     * Initialize Membership Compare Widget
     */
    initMembershipCompare: function ($wrapper) {
      var self = this;
      var $container = $wrapper.find(".seamless-compare-table");

      if ($container.length === 0) {
        $container = $('<div class="seamless-compare-table"></div>');
        $wrapper.append($container);
      }

      $container.html(
        '<div class="seamless-loader"><div class="seamless-spinners"></div><p>Loading comparison...</p></div>',
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

      var tableHtml = "<table>";

      // Header
      tableHtml += "<thead><tr>";
      tableHtml += '<th class="seamless-compare-header">Compare Plans</th>';
      memberships.forEach(function (plan) {
        tableHtml += '<th class="seamless-compare-header">';
        tableHtml +=
          '<div class="seamless-compare-plan-name">' +
          (plan.label || "") +
          "</div>";
        tableHtml +=
          '<div class="seamless-compare-plan-price">$' +
          (plan.price || 0) +
          "</div>";
        tableHtml +=
          '<div class="seamless-compare-plan-renewal">' +
          (plan.billing_cycle_display || "") +
          "</div>";
        tableHtml += "</th>";
      });
      tableHtml += "</tr></thead>";

      // Body
      tableHtml += "<tbody>";
      if (allRules.length > 0) {
        allRules.forEach(function (ruleKey) {
          tableHtml += '<tr class="seamless-compare-row">';
          tableHtml += "<td>" + ruleKey + "</td>";
          memberships.forEach(function (plan) {
            var val =
              plan.content_rules && plan.content_rules[ruleKey]
                ? plan.content_rules[ruleKey]
                : "";
            tableHtml += "<td>" + val + "</td>";
          });
          tableHtml += "</tr>";
        });
      } else {
        tableHtml +=
          '<tr class="seamless-compare-row"><td colspan="' +
          (memberships.length + 1) +
          '" style="text-align:center; padding: 30px;">No comparison features available.</td></tr>';
      }
      tableHtml += "</tbody></table>";

      $container.html(tableHtml);
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
