jQuery(document).ready(function ($) {
  // --- Events Controller ---
  const eventsTableBody = $("#seamless-events-table-body");
  const eventsPagination = $("#seamless-events-pagination");

  // Check if on events tab on load
  const isEventsTab =
    $('.nav-tab-active[data-tab="events"]').length > 0 ||
    new URLSearchParams(window.location.search).get("tab") === "events";
  const isMembershipTab =
    $('.nav-tab-active[data-tab="membership"]').length > 0 ||
    new URLSearchParams(window.location.search).get("tab") === "membership";
  const $settingsLoadingSurface = $('[data-seamless-page-loading="settings"]');

  let allEvents = [];
  let filteredEvents = [];
  let eventsPage = 1;
  const itemsPerPage = 15;

  function showSettingsPageLoading() {
    // Page chrome is already rendered server-side. Keep longer loading states scoped to API tables.
  }

  function hideSettingsPageLoading() {
    $settingsLoadingSurface.removeClass("is-page-loading");
  }

  function getSkeletonColumnCount($tbody) {
    const headerCount = $tbody.closest("table").find("thead th").length;
    return headerCount > 0 ? headerCount : 1;
  }

  function renderTableSkeleton($tbody, columns, rows = 6) {
    let html = "";

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      html += '<tr class="seamless-skeleton-row" aria-hidden="true">';
      for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        html += `<td><span class="seamless-skeleton-line seamless-skeleton-cell seamless-skeleton-cell-${
          (columnIndex % 4) + 1
        }"></span></td>`;
      }
      html += "</tr>";
    }

    $tbody.html(html);
  }

  function showTableSkeleton($tbody, columns) {
    const $area = $tbody.closest(".seamless-table-area");
    $area.addClass("is-loading");
    $area.find(".seamless-pagination-wrapper").empty().hide();
    renderTableSkeleton($tbody, columns || getSkeletonColumnCount($tbody));
  }

  function hideTableSkeleton($tbody) {
    $tbody.closest(".seamless-table-area").removeClass("is-loading");
  }

  // Helper to get tab from link
  function getTabFromLink(link) {
    if (!link) return null;
    const $link = $(link);
    if ($link.data("tab")) return $link.data("tab");

    const href = $link.attr("href");
    if (!href) return null;

    try {
      // Check for simple query
      const match = href.match(/[?&]tab=([^&]+)/);
      if (match) return match[1];

      // Full URL check
      const urlObj = new URL(href, window.location.origin);
      return urlObj.searchParams.get("tab");
    } catch (e) {
      return null;
    }
  }

  function renderEventsTable() {
    if (!eventsTableBody.length) return;

    eventsTableBody.empty();
    const start = (eventsPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredEvents.slice(start, end);

    if (pageItems.length === 0) {
      eventsTableBody.append(
        '<tr><td colspan="6" style="text-align:center;">No events found.</td></tr>'
      );
      renderEventsPagination();
      return;
    }

    pageItems.forEach((event, index) => {
      let startDate = "-";
      let endDate = "-";

      // Handle date variations
      if (event.event_date_range) {
        if (event.event_date_range.start)
          startDate = new Date(event.event_date_range.start).toLocaleString();
        if (event.event_date_range.end)
          endDate = new Date(event.event_date_range.end).toLocaleString();
      } else if (event.start_date || event.end_date) {
        if (event.start_date)
          startDate = new Date(event.start_date).toLocaleString();
        if (event.end_date) endDate = new Date(event.end_date).toLocaleString();
      }

      // formatted_* override
      if (event.formatted_start_date) startDate = event.formatted_start_date;
      if (event.formatted_end_date) endDate = event.formatted_end_date;

      // Type handling
      let typeLabel = "Event";
      let badgeClass = "seamless-status-badge rfc-compliant";

      if (event.event_type === "group_event") {
        typeLabel = "Group Event";
        badgeClass = "seamless-status-badge disabled";
      }

      const slug = event.slug || "";
      const shortcode = `[seamless_single_event slug="${slug}"]`;

      const row = `
                <tr>
                    <td>${start + index + 1}</td>
                    <td><strong>${event.title || "Untitled"}</strong></td>
                    <td>${startDate}</td>
                    <td>${endDate}</td>
                    <td><span class="${badgeClass}">${typeLabel}</span></td>
                    <td>
                        <div class="shortcode-container">
                            <code class="seamless-code-block">${shortcode}</code>
                            <button type="button" class="copy-shortcode-btn" data-shortcode='${shortcode}' title="Copy">
                                <span class="dashicons dashicons-admin-page"></span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
      eventsTableBody.append(row);
    });

    renderEventsPagination();
  }

  function renderEventsPagination() {
    if (!eventsPagination.length) return;

    eventsPagination.empty().hide();
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    if (totalPages <= 1) return;

    let html = "";
    if (eventsPage > 1) {
      html += `<a href="#" class="page-numbers prev" data-page="${
        eventsPage - 1
      }">« Prev</a>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= eventsPage - 2 && i <= eventsPage + 2)
      ) {
        const current = i === eventsPage ? "current" : "";
        html += `<a href="#" class="page-numbers ${current}" data-page="${i}">${i}</a>`;
      } else if (i === eventsPage - 3 || i === eventsPage + 3) {
        html += `<span class="page-numbers dots">...</span>`;
      }
    }
    if (eventsPage < totalPages) {
      html += `<a href="#" class="page-numbers next" data-page="${
        eventsPage + 1
      }">Next »</a>`;
    }
    eventsPagination.html(html).show();
  }

  async function loadEvents(force = false) {
    if (!eventsTableBody.length) {
      console.log("Seamless Admin: Events table not found.");
      hideSettingsPageLoading();
      return;
    }

    // Skip if already loaded unless forcing
    if (!force && eventsTableBody.data("loaded") === "true") {
      console.log("Seamless Admin: Events already loaded.");
      hideSettingsPageLoading();
      return;
    }

    console.log("Seamless Admin: Loading events...");

    showTableSkeleton(eventsTableBody, 6);

    try {
      if (!window.SeamlessAPI) {
        console.error("Seamless Admin: API Client not found.");
        eventsTableBody.html(
          '<tr><td colspan="6" style="text-align:center; color:red;">API Client not loaded. Refresh page.</td></tr>'
        );
        hideTableSkeleton(eventsTableBody);
        return;
      }

      const results = await window.SeamlessAPI.fetchAllEvents();
      console.log(
        "Seamless Admin: Fetched events:",
        results ? results.length : 0
      );

      // Sort by start date desc
      if (results && results.length > 0) {
        results.sort((a, b) => {
          const dateA = new Date(
            a.start_date || a.event_date_range?.start || 0
          );
          const dateB = new Date(
            b.start_date || b.event_date_range?.start || 0
          );
          return dateB - dateA;
        });
      }

      allEvents = results || [];
      filteredEvents = allEvents;
      eventsPage = 1;
      eventsTableBody.data("loaded", "true");
      renderEventsTable();
    } catch (error) {
      console.error("Seamless Admin: Error loading events", error);
      eventsTableBody.html(
        `<tr><td colspan="6" style="text-align:center; color:red;">Error loading events: ${
          error.message || "Unknown error"
        }</td></tr>`
      );
    } finally {
      hideTableSkeleton(eventsTableBody);
    }
  }

  // Events Search & Controls
  $("#seamless-events-search").on("input", function () {
    const term = $(this).val().toLowerCase();

    filteredEvents = allEvents.filter((e) =>
      (e.title || "").toLowerCase().includes(term)
    );
    eventsPage = 1;
    renderEventsTable();
  });

  $("#seamless-events-reset").on("click", function (event) {
    event.preventDefault();
    $("#seamless-events-search").val("").trigger("input");
  });

  // Events Pagination Click
  eventsPagination.on("click", "a.page-numbers", function (e) {
    e.preventDefault();
    const page = $(this).data("page");
    if (page) {
      eventsPage = parseInt(page);
      renderEventsTable();
    }
  });

  // --- Membership Controller ---
  const memTableBody = $("#seamless-membership-table-body");
  const memPagination = $("#seamless-membership-pagination");
  const shopTableBody = $("#seamless-shop-table-body");
  const shopPagination = $("#seamless-shop-pagination");
  let allPlans = [];
  let filteredPlans = [];
  let memPage = 1;
  let allProducts = [];
  let filteredProducts = [];
  let shopPage = 1;

  function renderMemTable() {
    if (!memTableBody.length) return;

    memTableBody.empty();
    const start = (memPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredPlans.slice(start, end);

    if (pageItems.length === 0) {
      memTableBody.append(
        '<tr><td colspan="8" style="text-align:center;">No membership plans found.</td></tr>'
      );
      renderMemPagination();
      return;
    }

    pageItems.forEach((plan, index) => {
      const price = parseFloat(plan.price || 0).toFixed(2);
      const isPlanActive = Boolean(plan.is_active);
      const rowStatusClass = isPlanActive
        ? "seamless-membership-row--active"
        : "seamless-membership-row--inactive";
      const statusBadgeClass = isPlanActive
        ? "connected"
        : "inactive";
      const statusLabel = isPlanActive ? "Active" : "Inactive";
      const status = `<span class="seamless-status-badge ${statusBadgeClass}">${statusLabel}</span>`;
      const planId = (plan.id || "").toString().trim();
      const shortcode = planId
        ? `[seamless_single_membership id="${planId}"]`
        : `[seamless_memberships]`;

      const row = `
                <tr class="seamless-membership-row ${rowStatusClass}">
                    <td>${start + index + 1}</td>
                    <td><strong>${plan.label || "Untitled"}</strong></td>
                    <td>${plan.sku || "-"}</td>
                    <td>$${price}</td>
                    <td>${plan.billing_cycle_display || "-"}</td>
                    <td>${plan.trial_days || "0"}</td>
                    <td>${status}</td>
                    <td>
                        <div class="shortcode-container">
                            <code class="seamless-code-block">${shortcode}</code>
                            <button type="button" class="copy-shortcode-btn" data-shortcode='${shortcode}' title="Copy">
                                <span class="dashicons dashicons-admin-page"></span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
      memTableBody.append(row);
    });

    renderMemPagination();
  }

  function renderMemPagination() {
    if (!memPagination.length) return;

    memPagination.empty().hide();
    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
    if (totalPages <= 1) return;

    let html = "";
    if (memPage > 1) {
      html += `<a href="#" class="page-numbers prev" data-page="${
        memPage - 1
      }">« Prev</a>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= memPage - 2 && i <= memPage + 2)
      ) {
        const current = i === memPage ? "current" : "";
        html += `<a href="#" class="page-numbers ${current}" data-page="${i}">${i}</a>`;
      } else if (i === memPage - 3 || i === memPage + 3) {
        html += `<span class="page-numbers dots">...</span>`;
      }
    }
    if (memPage < totalPages) {
      html += `<a href="#" class="page-numbers next" data-page="${
        memPage + 1
      }">Next »</a>`;
    }
    memPagination.html(html).show();
  }

  async function loadMemberships(force = false) {
    if (!memTableBody.length) {
      hideSettingsPageLoading();
      return;
    }

    if (!force && memTableBody.data("loaded") === "true") {
      console.log("Seamless Admin: Memberships already loaded.");
      hideSettingsPageLoading();
      return;
    }

    console.log("Seamless Admin: Loading memberships...");

    showTableSkeleton(memTableBody, 8);

    try {
      if (!window.SeamlessAPI) {
        console.error("Seamless Admin: API Client not found.");
        memTableBody.html(
          '<tr><td colspan="8" style="text-align:center; color:red;">API Client not loaded. Refresh page.</td></tr>'
        );
        hideTableSkeleton(memTableBody);
        return;
      }
      const response = await window.SeamlessAPI.getAllMembershipPlans();
      allPlans = response || [];
      filteredPlans = allPlans;
      memPage = 1;
      memTableBody.data("loaded", "true");
      renderMemTable();
    } catch (error) {
      console.error(error);
      memTableBody.html(
        `<tr><td colspan="8" style="text-align:center; color:red;">Error loading memberships: ${error.message}</td></tr>`
      );
    } finally {
      hideTableSkeleton(memTableBody);
      hideSettingsPageLoading();
    }
  }

  // Mem Search & Controls
  $("#seamless-membership-search").on("input", function () {
    const term = $(this).val().toLowerCase();

    filteredPlans = allPlans.filter((p) =>
      (p.label || "").toLowerCase().includes(term)
    );
    memPage = 1;
    renderMemTable();
  });

  $("#seamless-membership-reset").on("click", function () {
    $("#seamless-membership-search").val("").trigger("input");
  });

  // Mem Pagination Click
  memPagination.on("click", "a.page-numbers", function (e) {
    e.preventDefault();
    const page = $(this).data("page");
    if (page) {
      memPage = parseInt(page);
      renderMemTable();
    }
  });

  function getProductSlug(product) {
    return (
      product?.slug ||
      product?.handle ||
      product?.product_slug ||
      product?.uuid ||
      product?.id ||
      ""
    )
      .toString()
      .trim();
  }

  function getProductTitle(product) {
    return (
      product?.title ||
      product?.name ||
      product?.label ||
      "Untitled"
    )
      .toString()
      .trim();
  }

  function getProductPrice(product) {
    const numericPrice = Number(
      product?.price ??
        product?.sale_price ??
        product?.regular_price ??
        product?.amount,
    );

    if (Number.isFinite(numericPrice)) {
      return `$${numericPrice.toFixed(2)}`;
    }

    const formattedPrice =
      product?.formatted_price ||
      product?.price_html ||
      product?.display_price ||
      "";

    return formattedPrice ? formattedPrice.toString().trim() : "-";
  }

  function renderShopTable() {
    if (!shopTableBody.length) return;

    shopTableBody.empty();
    const start = (shopPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredProducts.slice(start, end);

    if (pageItems.length === 0) {
      shopTableBody.append(
        '<tr><td colspan="6" style="text-align:center;">No products found.</td></tr>'
      );
      renderShopPagination();
      return;
    }

    pageItems.forEach((product, index) => {
      const slug = getProductSlug(product);
      const title = getProductTitle(product);
      const sku = (product?.sku || product?.code || "-").toString().trim() || "-";
      const price = getProductPrice(product);
      const shortcode = slug
        ? `[seamless_single_product slug="${slug}"]`
        : "[seamless_shop_list]";

      const row = `
                <tr>
                    <td>${start + index + 1}</td>
                    <td><strong>${title}</strong></td>
                    <td>${slug || "-"}</td>
                    <td>${sku}</td>
                    <td>${price}</td>
                    <td>
                        <div class="shortcode-container">
                            <code class="seamless-code-block">${shortcode}</code>
                            <button type="button" class="copy-shortcode-btn" data-shortcode='${shortcode}' title="Copy">
                                <span class="dashicons dashicons-admin-page"></span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
      shopTableBody.append(row);
    });

    renderShopPagination();
  }

  function renderShopPagination() {
    if (!shopPagination.length) return;

    shopPagination.empty().hide();
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (totalPages <= 1) return;

    let html = "";
    if (shopPage > 1) {
      html += `<a href="#" class="page-numbers prev" data-page="${
        shopPage - 1
      }">Â« Prev</a>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= shopPage - 2 && i <= shopPage + 2)
      ) {
        const current = i === shopPage ? "current" : "";
        html += `<a href="#" class="page-numbers ${current}" data-page="${i}">${i}</a>`;
      } else if (i === shopPage - 3 || i === shopPage + 3) {
        html += `<span class="page-numbers dots">...</span>`;
      }
    }
    if (shopPage < totalPages) {
      html += `<a href="#" class="page-numbers next" data-page="${
        shopPage + 1
      }">Next Â»</a>`;
    }
    shopPagination.html(html).show();
  }

  async function loadShopProducts(force = false) {
    if (!shopTableBody.length) {
      hideSettingsPageLoading();
      return;
    }

    if (!force && shopTableBody.data("loaded") === "true") {
      hideSettingsPageLoading();
      return;
    }

    showTableSkeleton(shopTableBody, 6);

    try {
      if (!window.SeamlessAPI) {
        shopTableBody.html(
          '<tr><td colspan="6" style="text-align:center; color:red;">API Client not loaded. Refresh page.</td></tr>'
        );
        hideTableSkeleton(shopTableBody);
        return;
      }

      const response = await window.SeamlessAPI.getAllShopProducts();
      allProducts = (response || []).sort((a, b) =>
        getProductTitle(a).localeCompare(getProductTitle(b))
      );
      filteredProducts = allProducts;
      shopPage = 1;
      shopTableBody.data("loaded", "true");
      renderShopTable();
    } catch (error) {
      console.error(error);
      shopTableBody.html(
        `<tr><td colspan="6" style="text-align:center; color:red;">Error loading products: ${error.message}</td></tr>`
      );
    } finally {
      hideTableSkeleton(shopTableBody);
      hideSettingsPageLoading();
    }
  }

  $("#seamless-shop-search").on("input", function () {
    const term = $(this).val().toLowerCase();

    filteredProducts = allProducts.filter((product) => {
      const title = getProductTitle(product).toLowerCase();
      const slug = getProductSlug(product).toLowerCase();
      const sku = (product?.sku || product?.code || "").toString().toLowerCase();

      return title.includes(term) || slug.includes(term) || sku.includes(term);
    });
    shopPage = 1;
    renderShopTable();
  });

  $("#seamless-shop-reset").on("click", function () {
    $("#seamless-shop-search").val("").trigger("input");
  });

  shopPagination.on("click", "a.page-numbers", function (e) {
    e.preventDefault();
    const page = $(this).data("page");
    if (page) {
      shopPage = parseInt(page);
      renderShopTable();
    }
  });

  // --- Tab Handling ---

  // Function to handle switching tabs from click event or initial load
  function handleTabSwitch(tabName) {
    console.log("Seamless Admin: Switching to tab:", tabName);

    // Manual tab switching logic for single-page app feel
    // Hide all panels
    $(".seamless-tab-panel").removeClass("is-active").hide();

    // Show target panel
    const $targetPanel = $(`.seamless-tab-panel[data-tab="${tabName}"]`);
    $targetPanel.addClass("is-active").show();

    // Update nav-tab-active classes
    $(".nav-tab").removeClass("nav-tab-active");
    $(`.nav-tab[data-tab="${tabName}"]`).addClass("nav-tab-active");

    // Trigger data load
    if (tabName === "events") {
      loadEvents();
    } else if (tabName === "shop") {
      loadShopProducts();
    } else if (tabName === "membership") {
      loadMemberships();
    }
  }

  function syncSidebarActive(tabName) {
    if (!tabName) return;
    $(".seamless-sidebar-link").removeClass("is-active");
    $('.seamless-sidebar-link[data-seamless-tab="' + tabName + '"]').addClass(
      "is-active"
    );
  }

  function activateAdminView(viewName) {
    if (!$('[data-seamless-view="' + viewName + '"]').length) return;

    $("[data-seamless-view]").removeClass("is-active").hide();
    $('[data-seamless-view="' + viewName + '"]').addClass("is-active").show();

    if (viewName === "overview") {
      $(".seamless-sidebar-link").removeClass("is-active");
      $('[data-seamless-view-link="overview"]').addClass("is-active");
    }
  }

  function updateReturnTab(tabName) {
    $('form[action="options.php"]').each(function () {
      const $form = $(this);
      $form.find('input[name="_seamless_return_tab"]').remove();
      $form.append(
        '<input type="hidden" name="_seamless_return_tab" value="' +
          tabName +
          '">'
      );
      $form.find('input[name="_seamless_return_view"]').remove();
      $form.append(
        '<input type="hidden" name="_seamless_return_view" value="settings">'
      );
    });
  }

  function activateSettingsTab(tabName, pushUrl = true) {
    if (!tabName || !$(`.seamless-tab-panel[data-tab="${tabName}"]`).length) {
      return;
    }

    $(".seamless-tab-panel").removeClass("is-active").hide();
    $(`.seamless-tab-panel[data-tab="${tabName}"]`).addClass("is-active").show();
    activateAdminView("settings");
    syncSidebarActive(tabName);
    updateReturnTab(tabName);

    if (pushUrl) {
      const newUrl = new URL(window.location);
      newUrl.searchParams.set("page", "seamless");
      newUrl.searchParams.set("view", "settings");
      newUrl.searchParams.set("tab", tabName);
      newUrl.searchParams.delete("refetch");
      newUrl.searchParams.delete("show");
      newUrl.searchParams.delete("search");
      newUrl.searchParams.delete("s_events");
      newUrl.searchParams.delete("s_members");
      newUrl.searchParams.delete("paged");
      window.history.pushState({}, "", newUrl);
    }

  }

  // Initial Load: render all panels once, reveal the requested one, and start API-table loads immediately.
  const initialTab =
    new URLSearchParams(window.location.search).get("tab") || "authentication";

  if ($(".seamless-tab-panel").length) {
    const initialParams = new URLSearchParams(window.location.search);
    const initialView =
      initialParams.get("view") || (initialParams.get("tab") ? "settings" : "overview");
    if (initialView === "settings") {
      activateSettingsTab(initialTab, false);
    } else {
      activateAdminView("overview");
      $(".seamless-tab-panel").removeClass("is-active").hide();
      $(`.seamless-tab-panel[data-tab="${initialTab}"]`).addClass("is-active").show();
      updateReturnTab(initialTab);
    }
    setTimeout(hideSettingsPageLoading, 140);

    if (eventsTableBody.length) {
      loadEvents();
    }
    if (shopTableBody.length) {
      loadShopProducts();
    }
    if (memTableBody.length) {
      loadMemberships();
    }
  } else {
    hideSettingsPageLoading();
  }

  // Listen for tab clicks
  $(document).on(
    "click",
    ".nav-tab, .seamless-sidebar-link[data-seamless-tab], .seamless-feature-card[data-seamless-tab]",
    function (e) {
    e.preventDefault(); // Prevent page reload
    const tab = $(this).data("seamless-tab") || getTabFromLink(this);
    if (tab) {
      activateSettingsTab(tab);
    }
  });

  $(document).on("click", "[data-seamless-view-link='overview']", function (e) {
    e.preventDefault();
    activateAdminView("overview");
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("page", "seamless");
    newUrl.searchParams.set("view", "overview");
    newUrl.searchParams.delete("tab");
    window.history.pushState({}, "", newUrl);
  });

  // Copy shortcode handler
  $(document).on("click", ".copy-shortcode-btn", function () {
    const shortcode = $(this).data("shortcode");
    const $button = $(this);

    navigator.clipboard.writeText(shortcode).then(() => {
      const originalIcon = $button.html();
      $button.addClass("copied");
      $button.html('<span class="dashicons dashicons-yes"></span>');
      showCopyToast();
      setTimeout(() => {
        $button.html(originalIcon);
        $button.removeClass("copied");
      }, 1500);
    });
  });

  function showCopyToast() {
    $(".seamless-toast-copy").remove();

    const $toast = $(
      '<div class="seamless-toast seamless-toast-success seamless-toast-copy">Copied to clipboard</div>'
    );
    $("body").append($toast);

    setTimeout(() => {
      $toast.addClass("show");
    }, 10);

    setTimeout(() => {
      $toast.removeClass("show");
      setTimeout(() => {
        $toast.remove();
      }, 300);
    }, 2200);
  }
});
