(function () {
  "use strict";

  /* Form delivery: paste your Web3Forms access key between the quotes.
     While empty, forms show success without sending (demo mode). */
  var WEB3FORMS_KEY = "";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isRTL = document.documentElement.dir === "rtl";

  function sendLead(form, extra, onDone) {
    if (!WEB3FORMS_KEY) { onDone(true); return; }
    var data = { access_key: WEB3FORMS_KEY, from_name: "Foroughi & Co website", page: window.location.pathname };
    ["name", "phone", "email", "service", "calltime"].forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]:checked, [name="' + k + '"]:not([type=radio])');
      if (el) data[k] = el.value;
    });
    Object.assign(data, extra || {});
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    }).then(function (r) { onDone(r.ok); }).catch(function () { onDone(false); });
  }

  /* ---- push-down reveal nav ------------------------------------------------
     The panels sit inside .site-top, so opening one grows the sticky header and
     the page below is pushed down by ordinary layout — no overlay, and the body
     is never scroll-locked, because the page has not been covered.
     Each trigger toggles its own panel and owns the aria-expanded state; only
     one panel is open at a time. */
  var panels = document.querySelectorAll(".nav-reveal");
  if (panels.length) {
    var triggers = document.querySelectorAll("[data-open-menu]");
    var siteTopEl = document.querySelector(".site-top");

    var triggersFor = function (id) {
      return Array.prototype.filter.call(triggers, function (t) {
        return (t.getAttribute("data-open-menu") || "menuOverlay") === id;
      });
    };

    var setOpen = function (panel, open) {
      panel.classList.toggle("is-open", open);
      triggersFor(panel.id).forEach(function (t) {
        t.setAttribute("aria-expanded", String(open));
      });
    };

    var closeAll = function (except) {
      Array.prototype.forEach.call(panels, function (p) {
        if (p !== except && p.classList.contains("is-open")) setOpen(p, false);
      });
    };

    Array.prototype.forEach.call(triggers, function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var target = document.getElementById(b.getAttribute("data-open-menu") || "menuOverlay");
        if (!target) return;
        var willOpen = !target.classList.contains("is-open");
        closeAll(target);
        setOpen(target, willOpen);
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-close-menu]"), function (b) {
      b.addEventListener("click", function () { closeAll(null); });
    });

    /* click anywhere outside the header chrome closes the open panel */
    document.addEventListener("click", function (e) {
      if (siteTopEl && siteTopEl.contains(e.target)) return;
      closeAll(null);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var open = document.querySelector(".nav-reveal.is-open");
      if (!open) return;
      closeAll(null);
      /* return focus to the control that opened it */
      var t = triggersFor(open.id)[0];
      if (t) t.focus();
    });

    /* tabbing out of the header closes it too, so keyboard users are not left
       with a panel open behind them */
    document.addEventListener("focusin", function (e) {
      if (siteTopEl && siteTopEl.contains(e.target)) return;
      closeAll(null);
    });
  }

  /* ---- sticky top chrome: condense once scrolled, and publish its height
         so the drop-down menus can sit directly beneath it ---- */
  var siteTop = document.querySelector(".site-top");
  if (siteTop) {
    /* Publish the height of the BAR ROWS only, not of .site-top as a whole:
       the reveal panels now live inside .site-top, and they size themselves
       against this variable. Measuring the whole header would feed the open
       panel's own height back into its max-height and collapse it. */
    var firstPanel = siteTop.querySelector(".nav-reveal");
    var syncHeight = function () {
      var h = firstPanel
        ? firstPanel.getBoundingClientRect().top - siteTop.getBoundingClientRect().top
        : siteTop.offsetHeight;
      document.documentElement.style.setProperty("--site-top-h", Math.round(h) + "px");
    };
    var onScroll = function () {
      siteTop.classList.toggle("is-stuck", window.scrollY > 8);
      syncHeight();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", syncHeight);
    /* the condense animation changes the height after the scroll event */
    siteTop.addEventListener("transitionend", syncHeight);
    onScroll();
  }

  /* ---- callback panel ---- */
  var panel = document.getElementById("panel");
  var overlay = document.getElementById("panelOverlay");
  var lastFocus = null;
  var shift = isRTL ? "-translate-x-full" : "translate-x-full";

  function openPanel() {
    if (!panel) return;
    lastFocus = document.activeElement;
    overlay.classList.remove("pointer-events-none", "opacity-0");
    panel.classList.remove(shift);
    var f = panel.querySelector("form input");
    window.setTimeout(function () { if (f) f.focus(); }, reduceMotion ? 0 : 380);
    document.addEventListener("keydown", onEsc);
  }
  function closePanel() {
    if (!panel) return;
    overlay.classList.add("pointer-events-none", "opacity-0");
    panel.classList.add(shift);
    document.removeEventListener("keydown", onEsc);
    if (lastFocus) lastFocus.focus();
  }
  function onEsc(e) { if (e.key === "Escape") closePanel(); }

  Array.prototype.forEach.call(document.querySelectorAll("[data-open-panel]"), function (b) { b.addEventListener("click", openPanel); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-close-panel]"), function (b) { b.addEventListener("click", closePanel); });
  if (overlay) overlay.addEventListener("click", closePanel);

  Array.prototype.forEach.call(document.querySelectorAll("form[data-callback]"), function (cbForm) {
    cbForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var hp = cbForm.querySelector('input[name="company"]');
      if (hp && hp.value) return; /* honeypot */
      if (!cbForm.checkValidity()) { cbForm.reportValidity(); return; }
      var btn = cbForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      sendLead(cbForm, { subject: "Callback request — " + (document.body.dataset.service || "website") }, function (ok) {
        btn.disabled = false;
        if (!ok) { alert("That didn't go through — please call (416) 602-7093."); return; }
        cbForm.classList.add("hidden");
        var s = cbForm.nextElementSibling;
        if (s && s.hasAttribute("data-form-success")) {
          s.classList.remove("hidden");
          var h = s.querySelector("h3");
          if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
        }
      });
    });
  });

  /* ---- newsletter (footer) ---- */
  var nl = document.querySelector("form[data-newsletter]");
  if (nl) {
    nl.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!nl.checkValidity()) { nl.reportValidity(); return; }
      sendLead(nl, { subject: "Newsletter signup", email: nl.querySelector("input").value }, function () {
        nl.classList.add("hidden");
        document.querySelector("[data-newsletter-ok]").classList.remove("hidden");
      });
    });
  }

  /* ---- card carousel ---- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-carousel]"), function (root) {
    var track = root.querySelector(".car-track");
    var cards = track.children;
    var prev = root.querySelector("[data-car-prev]");
    var next = root.querySelector("[data-car-next]");
    var bar = root.querySelector("[data-car-bar]");
    var index = 0;

    function visible() { return window.matchMedia("(min-width: 768px)").matches ? 3 : 1; }
    function maxIndex() { return Math.max(0, cards.length - visible()); }
    function render() {
      var step = cards[0].getBoundingClientRect().width + 24;
      var x = index * step * (isRTL ? 1 : -1);
      track.style.transform = "translateX(" + x + "px)";
      if (bar) bar.style.width = Math.round(((index + visible()) / cards.length) * 100) + "%";
      prev.style.opacity = index === 0 ? 0.3 : 1;
      next.style.opacity = index >= maxIndex() ? 0.3 : 1;
    }
    prev.addEventListener("click", function () { index = Math.max(0, index - 1); render(); });
    next.addEventListener("click", function () { index = Math.min(maxIndex(), index + 1); render(); });
    window.addEventListener("resize", function () { index = Math.min(index, maxIndex()); render(); });
    render();
  });

  /* ---- scroll reveal ------------------------------------------------------
     Progressive enhancement, strictly. Only elements that are still BELOW the
     fold when this runs are ever hidden, so nothing the reader has already
     been shown can flicker, and a browser without IntersectionObserver (or a
     reader who asked for less motion) simply gets the finished page. */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var groups = [
      [".svc-hero-inner > *", 70, "text"],
      [".svc-hero-video", 0, "media"],
      [".svc-glance-grid > div", 70, "text"],
      [".svc-split > .svc-body", 0, "text"],
      [".svc-split figure", 0, "media"],
      [".svc-sec > .svc-wrap > .svc-prose", 0, "text"],
      [".svc-steps li", 80, "text"],
      [".svc-faq", 0, "text"],
      [".svc-band .svc-wrap > *", 80, "text"],
      [".svc-related-grid a", 60, "text"],
      [".blog-card", 60, "text"],
    ];

    var below = window.innerHeight * 0.9;
    var targets = [];

    groups.forEach(function (g) {
      var els = document.querySelectorAll(g[0]);
      Array.prototype.forEach.call(els, function (el, i) {
        if (el.getBoundingClientRect().top < below) return; /* already seen */
        el.setAttribute("data-reveal", g[2] === "media" ? "media" : "");
        if (g[1]) el.style.setProperty("--reveal-delay", i * g[1] + "ms");
        targets.push(el);
      });
    });

    if (targets.length) {
      document.documentElement.classList.add("reveal-on");

      var show = function (el) {
        el.classList.add("is-in");
        revealIO.unobserve(el);
        var i = targets.indexOf(el);
        if (i > -1) targets.splice(i, 1);
        if (!targets.length) window.removeEventListener("scroll", sweep);
      };

      var revealIO = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) show(en.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
      );

      /* Backstop. A jump — an in-page anchor, End, a flick on a trackpad —
         can carry an element from below the viewport to above it without the
         ratio ever crossing a threshold, so the observer never reports it and
         the element would stay invisible for the rest of the visit. This
         sweep reveals anything the viewport has already reached or passed. */
      var queued = false;
      var sweep = function () {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
          queued = false;
          targets.slice().forEach(function (el) {
            if (el.getBoundingClientRect().top < window.innerHeight) show(el);
          });
        });
      };

      targets.forEach(function (el) { revealIO.observe(el); });
      window.addEventListener("scroll", sweep, { passive: true });
    }
  }

  /* ---- ambient video ---- */
  var bands = document.querySelectorAll(".band-video");
  if (bands.length && !reduceMotion) {
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { var p = en.target.play(); if (p) p.catch(function () {}); }
        else en.target.pause();
      });
    }, { threshold: 0.25 }) : null;
    Array.prototype.forEach.call(bands, function (v) {
      if (io) io.observe(v);
      else { var p = v.play(); if (p) p.catch(function () {}); }
    });
  }
})();
