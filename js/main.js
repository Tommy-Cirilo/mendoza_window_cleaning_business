"use strict";

document.addEventListener("DOMContentLoaded", () => {
  initializeCurrentYear();
  initializeActiveNavigation();
  initializeMobileNavigation();
  initializeGalleryFilters();
  initializeContactForm();
});


/**
 * Inserts the current year into elements containing:
 * data-current-year
 */
function initializeCurrentYear() {
  const yearElements = document.querySelectorAll("[data-current-year]");

  yearElements.forEach((element) => {
    element.textContent = new Date().getFullYear().toString();
  });
}


/**
 * Adds the active class and aria-current attribute to the navigation
 * link that matches the current page.
 *
 * Add data-nav-link to each main navigation link.
 */
function initializeActiveNavigation() {
  const navigationLinks = document.querySelectorAll("[data-nav-link]");

  if (navigationLinks.length === 0) {
    return;
  }

  const currentPath = normalizePath(window.location.pathname);

  navigationLinks.forEach((link) => {
    const linkUrl = new URL(link.href, window.location.origin);
    const linkPath = normalizePath(linkUrl.pathname);

    const isCurrentPage = currentPath === linkPath;

    link.classList.toggle("active", isCurrentPage);

    if (isCurrentPage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}


/**
 * Normalizes paths so that:
 * /
 * /index.html
 * and /index
 *
 * can be compared more reliably.
 */
function normalizePath(pathname) {
  let path = pathname.toLowerCase();

  if (path.endsWith("/")) {
    path += "index.html";
  }

  return path;
}


/**
 * Closes the Bootstrap mobile navigation after a navigation link
 * is selected.
 *
 * Bootstrap handles the collapse behavior itself. This function
 * only improves the mobile experience when a user selects a link.
 */
function initializeMobileNavigation() {
  const navbarCollapse = document.querySelector(".navbar-collapse");
  const navigationLinks = document.querySelectorAll(
    ".navbar-collapse .nav-link"
  );

  if (
    !navbarCollapse ||
    navigationLinks.length === 0 ||
    typeof bootstrap === "undefined"
  ) {
    return;
  }

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const isMenuOpen = navbarCollapse.classList.contains("show");

      if (!isMenuOpen) {
        return;
      }

      const collapseInstance =
        bootstrap.Collapse.getOrCreateInstance(navbarCollapse);

      collapseInstance.hide();
    });
  });
}


/**
 * Filters showcase gallery items.
 *
 * Filter button example:
 * data-gallery-filter="residential"
 *
 * Gallery item example:
 * data-gallery-category="residential"
 *
 * Use data-gallery-filter="all" for the All button.
 */
function initializeGalleryFilters() {
  const filterButtons = document.querySelectorAll(
    "[data-gallery-filter]"
  );

  const galleryItems = document.querySelectorAll(
    "[data-gallery-category]"
  );

  if (filterButtons.length === 0 || galleryItems.length === 0) {
    return;
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedCategory =
        button.dataset.galleryFilter?.toLowerCase() ?? "all";

      updateActiveFilterButton(filterButtons, button);
      filterGalleryItems(galleryItems, selectedCategory);
    });
  });
}


/**
 * Updates the visual and accessibility state of gallery filters.
 */
function updateActiveFilterButton(buttons, activeButton) {
  buttons.forEach((button) => {
    const isActive = button === activeButton;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}


/**
 * Shows or hides gallery items based on their category.
 *
 * An item can support multiple categories separated by spaces:
 * data-gallery-category="residential before-after"
 */
function filterGalleryItems(items, selectedCategory) {
  items.forEach((item) => {
    const itemCategories =
      item.dataset.galleryCategory
        ?.toLowerCase()
        .split(/\s+/)
        .filter(Boolean) ?? [];

    const shouldShow =
      selectedCategory === "all" ||
      itemCategories.includes(selectedCategory);

    item.hidden = !shouldShow;
  });
}


/**
 * Enhances the contact form with Bootstrap validation and
 * optional asynchronous submission.
 *
 * Required HTML attributes:
 *
 * data-contact-form
 * novalidate
 *
 * Optional status element:
 *
 * data-form-status
 */
function initializeContactForm() {
  const form = document.querySelector("[data-contact-form]");

  if (!form) {
    return;
  }

  const statusElement = document.querySelector("[data-form-status]");
  const submitButton = form.querySelector('[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearFormStatus(statusElement);

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      focusFirstInvalidField(form);
      return;
    }

    form.classList.add("was-validated");

    const formAction = form.getAttribute("action");

    if (!formAction || formAction === "#") {
      showFormStatus(
        statusElement,
        "The contact form has not been connected to an email service yet.",
        "error"
      );

      return;
    }

    setSubmittingState(submitButton, true);

    try {
      const response = await submitForm(form, formAction);

      if (!response.ok) {
        throw new Error(
          `Form submission failed with status ${response.status}.`
        );
      }

      form.reset();
      form.classList.remove("was-validated");

      showFormStatus(
        statusElement,
        "Thank you. Your request has been sent successfully.",
        "success"
      );
    } catch (error) {
      console.error("Contact form submission error:", error);

      showFormStatus(
        statusElement,
        "We could not send your request. Please try again or contact the business directly.",
        "error"
      );
    } finally {
      setSubmittingState(submitButton, false);
    }
  });
}


/**
 * Submits the form using FormData.
 *
 * This approach is compatible with many hosted form services,
 * including Formspree-style endpoints.
 */
async function submitForm(form, action) {
  const formData = new FormData(form);

  return fetch(action, {
    method: form.method || "POST",
    body: formData,
    headers: {
      Accept: "application/json"
    }
  });
}


/**
 * Moves keyboard focus to the first invalid field.
 */
function focusFirstInvalidField(form) {
  const firstInvalidField = form.querySelector(":invalid");

  if (firstInvalidField instanceof HTMLElement) {
    firstInvalidField.focus();
  }
}


/**
 * Disables or enables the submit button while the request is sent.
 */
function setSubmittingState(button, isSubmitting) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent?.trim() || "Submit";
  }

  button.disabled = isSubmitting;
  button.setAttribute("aria-busy", String(isSubmitting));

  button.textContent = isSubmitting
    ? "Sending..."
    : button.dataset.originalText;
}


/**
 * Displays a contact form status message.
 */
function showFormStatus(element, message, type) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove(
    "form-status--success",
    "form-status--error"
  );

  element.classList.add(
    "is-visible",
    type === "success"
      ? "form-status--success"
      : "form-status--error"
  );

  element.setAttribute("role", type === "success" ? "status" : "alert");

  element.focus?.();
}


/**
 * Clears any previous form status message.
 */
function clearFormStatus(element) {
  if (!element) {
    return;
  }

  element.textContent = "";
  element.classList.remove(
    "is-visible",
    "form-status--success",
    "form-status--error"
  );

  element.removeAttribute("role");
}