(function () {
  "use strict";

  /* Form delivery: Web3Forms access key below routes every form submission
     to amir_foroughi@icloud.com. Key from https://web3forms.com. */
  var WEB3FORMS_KEY = "cf3e8e08-080f-444a-a384-f4c5027970bd";

  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function sendLead(form, onDone) {
    if (!WEB3FORMS_KEY) {
      onDone(true); /* demo mode */
      return;
    }
    var data = { access_key: WEB3FORMS_KEY };
    ["name", "phone", "email", "service", "calltime"].forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]:checked, [name="' + k + '"]:not([type=radio])');
      if (el) data[k] = el.value;
    });
    data.subject = "Callback request — " + (data.service || "website") + " — " + (data.name || "");
    data.from_name = "Foroughi & Co website";
    data.page = window.location.pathname;
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (r) { onDone(r.ok); })
      .catch(function () { onDone(false); });
  }

  function showSendError(form) {
    var err = form.querySelector(".form-error");
    if (!err) {
      err = document.createElement("p");
      err.className = "form-error";
      err.setAttribute("role", "alert");
      form.querySelector('button[type="submit"]').insertAdjacentElement("beforebegin", err);
    }
    err.textContent = "That didn't go through. Please try again, or call (416) 602-7093 directly.";
  }

  function lockSubmit(form, locked) {
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = locked;
    if (locked) {
      btn.dataset.label = btn.textContent;
      btn.textContent = "Sending…";
    } else if (btn.dataset.label) {
      btn.textContent = btn.dataset.label;
    }
  }

  /* ---- load choreography (setTimeout fallback: rAF is throttled in
         background tabs, which would leave the page invisible) ---- */
  function reveal() {
    body.classList.add("is-loaded");
  }
  requestAnimationFrame(function () {
    requestAnimationFrame(reveal);
  });
  window.setTimeout(reveal, 120);

  /* ---- hero video: plays at every width, respects reduced motion ---- */
  var video = document.getElementById("heroVideo");
  if (video) {
    var wantsVideo = !reduceMotion;
    if (wantsVideo) {
      var attempts = 0;
      var tryPlay = function () {
        if (!video.paused || attempts >= 8) return;
        attempts += 1;
        var p = video.play();
        if (p !== undefined) p.catch(function () { /* poster stays */ });
        window.setTimeout(tryPlay, 600);
      };
      video.addEventListener("playing", function () {
        video.classList.add("is-playing");
      });
      video.addEventListener("canplay", tryPlay);
      tryPlay();
    } else {
      video.removeAttribute("autoplay");
      video.preload = "none";
    }
  }

  /* ---- mobile menu ---- */
  var menuBtn = document.querySelector(".menu-btn");
  var rail = document.querySelector(".rail");
  if (menuBtn && rail) {
    menuBtn.addEventListener("click", function () {
      var open = rail.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.textContent = open ? "Close" : "Menu";
    });
  }

  /* ---- mega dropdown: hold it open, and blur the page behind it ----
     Hover alone is twitchy: any momentary gap between the trigger and the
     panel — a fast diagonal, a hand that overshoots — closes the menu
     mid-reach. The .is-open class keeps it up for a grace period after the
     pointer leaves, and re-entering within that window cancels the close. */
  var MENU_CLOSE_DELAY = 260;
  Array.prototype.forEach.call(
    document.querySelectorAll(".nav-drop, .rail .has-sub"),
    function (drop) {
      var closeTimer = null;

      function open() {
        window.clearTimeout(closeTimer);
        drop.classList.add("is-open");
        body.classList.add("mega-open");
      }

      function closeSoon() {
        window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(function () {
          drop.classList.remove("is-open");
          body.classList.remove("mega-open");
        }, MENU_CLOSE_DELAY);
      }

      drop.addEventListener("mouseenter", open);
      drop.addEventListener("mouseleave", closeSoon);
      drop.addEventListener("focusin", open);
      drop.addEventListener("focusout", function (e) {
        if (!drop.contains(e.relatedTarget)) closeSoon();
      });
    }
  );

  /* ---- ambient video bands: play in view, every width ---- */
  var bands = document.querySelectorAll(".band-video");
  if (bands.length && !reduceMotion) {
    var playBand = function (v) {
      var p = v.play();
      if (p !== undefined) p.catch(function () { /* poster stays */ });
    };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) playBand(en.target);
            else en.target.pause();
          });
        },
        { threshold: 0.25 }
      );
      Array.prototype.forEach.call(bands, function (v) { io.observe(v); });
    } else {
      Array.prototype.forEach.call(bands, playBand);
    }
  } else {
    Array.prototype.forEach.call(bands, function (v) {
      v.removeAttribute("autoplay");
      v.preload = "none";
    });
  }

  /* ---- callback panel ---- */
  var panel = document.querySelector(".panel");
  var overlay = document.querySelector(".panel-overlay");
  var lastFocus = null;

  function openPanel() {
    if (!panel || !overlay) return;
    lastFocus = document.activeElement;
    panel.hidden = false;
    overlay.hidden = false;
    void panel.offsetWidth; /* flush styles so the slide-in transition runs */
    panel.classList.add("is-open");
    overlay.classList.add("is-open");
    var first = panel.querySelector("input, select, button.panel-close");
    var firstField = panel.querySelector("form input");
    window.setTimeout(function () {
      (firstField || first).focus();
    }, reduceMotion ? 0 : 380);
    document.addEventListener("keydown", onKeydown);
  }

  function closePanel() {
    if (!panel || !overlay) return;
    panel.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.removeEventListener("keydown", onKeydown);
    window.setTimeout(function () {
      panel.hidden = true;
      overlay.hidden = true;
    }, reduceMotion ? 0 : 500);
    if (lastFocus) lastFocus.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      closePanel();
      return;
    }
    if (e.key !== "Tab") return;
    /* keep focus inside the dialog */
    var focusables = panel.querySelectorAll(
      'button, input, select, a[href], [tabindex]:not([tabindex="-1"])'
    );
    var list = Array.prototype.filter.call(focusables, function (el) {
      return el.offsetParent !== null;
    });
    if (!list.length) return;
    var firstEl = list[0];
    var lastEl = list[list.length - 1];
    if (e.shiftKey && document.activeElement === firstEl) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  }

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-open-panel]"),
    function (btn) {
      btn.addEventListener("click", openPanel);
    }
  );

  if (overlay) overlay.addEventListener("click", closePanel);
  var closeBtn = document.querySelector(".panel-close");
  if (closeBtn) closeBtn.addEventListener("click", closePanel);

  /* ---- form submit (endpoint wired at launch; success state for now) ---- */
  var form = panel ? panel.querySelector("form") : null;
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.querySelector(".hp input").value) return; /* honeypot */
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      lockSubmit(form, true);
      sendLead(form, function (ok) {
        lockSubmit(form, false);
        if (!ok) {
          showSendError(form);
          return;
        }
        panel.classList.add("is-done");
        var done = panel.querySelector(".panel-success h3");
        done.setAttribute("tabindex", "-1");
        done.focus();
      });
    });
  }

  /* ---- inline forms (contact, farsi pages) ---- */
  Array.prototype.forEach.call(
    document.querySelectorAll("form.inline-form"),
    function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var hp = f.querySelector(".hp input");
        if (hp && hp.value) return;
        if (!f.checkValidity()) {
          f.reportValidity();
          return;
        }
        lockSubmit(f, true);
        sendLead(f, function (ok) {
          lockSubmit(f, false);
          if (!ok) {
            showSendError(f);
            return;
          }
          f.hidden = true;
          var s = f.parentElement.querySelector(".form-success");
          if (s) {
            s.hidden = false;
            var h = s.querySelector("h3");
            if (h) {
              h.setAttribute("tabindex", "-1");
              h.focus();
            }
          }
        });
      });
    }
  );
})();
