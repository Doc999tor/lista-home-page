(function() {
    "use strict";

    var tagId = "G-ZVGM6DFLQQ";
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(tagId);

    var firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
        return;
    }

    (document.head || document.documentElement).appendChild(script);
})();
