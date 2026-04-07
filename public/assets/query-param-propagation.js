(() => {
  const currentQueryParams = new URLSearchParams(window.location.search);
  const documentReferrerValue = window.location.href;

  if (!currentQueryParams.has("document_referrer")) {
    currentQueryParams.set("document_referrer", documentReferrerValue);
  }

  function mergeCurrentQueryParamsIntoUrl(urlLike) {
    const url = new URL(urlLike, window.location.origin);

    currentQueryParams.forEach((value, key) => {
      if (value === "") {
        url.searchParams.delete(key);
        return;
      }

      if (!url.searchParams.has(key)) {
        url.searchParams.append(key, value);
      }
    });

    if (!url.searchParams.has("document_referrer")) {
      url.searchParams.set("document_referrer", documentReferrerValue);
    }

    return url;
  }

  function shouldSkipHref(href) {
    return (
      !href ||
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    );
  }

  function normalizeAnchorHref(url) {
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    return url.toString();
  }

  window.mergeCurrentQueryParamsIntoUrl = function mergeCurrentQueryParamsIntoUrlPublic(urlLike) {
    return mergeCurrentQueryParamsIntoUrl(urlLike).toString();
  };

  document.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href");

    if (shouldSkipHref(href)) {
      return;
    }

    try {
      const mergedUrl = mergeCurrentQueryParamsIntoUrl(href);
      anchor.setAttribute("href", normalizeAnchorHref(mergedUrl));
    } catch (error) {
      // Ignore malformed href values and keep rendering unaffected.
    }
  });

  document.querySelectorAll("form[action]").forEach((form) => {
    const action = form.getAttribute("action");
    if (!action) {
      return;
    }

    try {
      const actionUrl = new URL(action, window.location.origin);
      // if (!actionUrl.pathname.endsWith("/contact_us")) {
      //   return;
      // }

      const mergedActionUrl = mergeCurrentQueryParamsIntoUrl(action);
      form.setAttribute("action", normalizeAnchorHref(mergedActionUrl));
    } catch (error) {
      // Ignore malformed action values.
    }
  });
})();
