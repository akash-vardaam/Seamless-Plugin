jQuery(document).ready(function ($) {
  let cachedEvents = null;
  let rowIndex = $(".seamless-addon-template-row").length;

  // Function to populate event select with cached events
  function populateEventSelect($select) {
    if (!cachedEvents) return;

    const savedVal = $select.attr("data-saved") || $select.val();

    // Remove loading placeholder
    $select.find(".loading-placeholder").remove();

    // Clear existing options except the first one (Select event)
    $select.find("option:not(:first)").remove();

    cachedEvents.forEach(function (event) {
      if (event.slug && event.title) {
        const isSelected = savedVal === event.slug ? "selected" : "";
        $select.append(
          `<option value="${event.slug}" ${isSelected}>${event.title}</option>`,
        );
      }
    });

    $select.prop("disabled", false);
  }

  // Load events from API
  const eventSelects = $(
    '.seamless-addon-event-templates-table select[name*="[event_slug]"]',
  );

  if (eventSelects.length > 0 && window.SeamlessAPI) {
    // Show loading state
    eventSelects.each(function () {
      const select = $(this);
      if (!select.find('option[value=""]').length) {
        // Keep saved value if any
        const savedVal = select.val();
        select.attr("data-saved", savedVal);
      }
      select.prop("disabled", true);
      // Append loading option if empty
      if (select.find("option").length <= 1) {
        // 1 because of "Select event" default
        select.append(
          '<option value="" class="loading-placeholder">Loading events...</option>',
        );
      }
    });

    window.SeamlessAPI.fetchAllEvents()
      .then(function (events) {
        // Sort events by title
        events.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        cachedEvents = events;

        eventSelects.each(function () {
          populateEventSelect($(this));
        });
      })
      .catch(function (err) {
        console.error("Seamless Addon: Failed to fetch events", err);
        eventSelects.each(function () {
          $(this).find(".loading-placeholder").text("Error loading events");
        });
      });
  }

  // Add row button click
  $(document).on("click", ".seamless-addon-add-row", function (e) {
    e.preventDefault();

    const $template = $(".seamless-addon-template-row-template");
    const $tbody = $(".seamless-addon-event-templates-table tbody");

    if ($template.length === 0) {
      console.error("Template row not found");
      return;
    }

    // Clone the template row
    const $newRow = $template.clone();
    $newRow.removeClass("seamless-addon-template-row-template");
    $newRow.addClass("seamless-addon-template-row");

    // Update the index in the name attributes
    $newRow.find("select, input").each(function () {
      const $field = $(this);
      const name = $field.attr("name");
      if (name) {
        $field.attr("name", name.replace("__INDEX__", rowIndex));
      }
    });

    // Append to table
    $tbody.append($newRow);

    // Populate events if cached
    const $eventSelect = $newRow.find(".seamless-event-select");
    if (cachedEvents && $eventSelect.length) {
      populateEventSelect($eventSelect);
    }

    rowIndex++;
  });

  // Remove row button click
  $(document).on("click", ".seamless-addon-remove-row", function (e) {
    e.preventDefault();

    const $row = $(this).closest("tr");
    const $tbody = $row.closest("tbody");

    // Don't remove if it's the last row
    if ($tbody.find(".seamless-addon-template-row").length <= 1) {
      // Just clear the values instead
      $row.find("select").val("");
      return;
    }

    $row.remove();
  });
});
