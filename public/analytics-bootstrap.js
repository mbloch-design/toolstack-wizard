/* Blocking first-party guard. Keep Auth URL/referrer transport private for this document. */
(function () {
  function sensitive(value) {
    if (!value) return false;
    try {
      var url = new URL(value, window.location.origin);
      if (!/^https?:$/.test(url.protocol) || url.hash || url.username || url.password) return true;
      if (/^\/(fr|en)\/(connexion|inscription|compte|sign-in|sign-up|account|back-office)(\/|$)/i.test(url.pathname) || /^\/auth\/v1(\/|$)/i.test(url.pathname)) return true;
      return Array.from(url.searchParams.keys()).some(function (key) {
        key = key.replace(/[_-]/g, "").toLowerCase();
        return /token|password|secret|authorization|credential/i.test(key) || /^(email|name|displayname|fullname|givenname|familyname|code|state|nonce|error|errorcode|errordescription|sessionid|returnto|redirectto|redirecturi)$/.test(key);
      });
    } catch (e) { return true; }
  }
  window.__tooltrimAnalyticsPrivateDocument = true;
  try {
    if (sensitive(window.location.href) || sensitive(document.referrer)) return;
    var script = document.createElement("script");
    script.defer = true;
    script.dataset.websiteId = "dfid_RKrD2vDEKLSNNPOu5wVhx";
    script.dataset.domain = "tooltrim.com";
    script.src = "https://datafa.st/js/script.cookieless.js";
    document.head.appendChild(script);
    window.__tooltrimAnalyticsPrivateDocument = false;
  } catch (e) { /* Fail closed: no successful bootstrap means no raw trackers. */ }
})();
