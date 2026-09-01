/* Splash intro — plays once per session (sessionStorage), skipped entirely
   for visits with UTM/ad-campaign query parameters and for reduced-motion
   users. The head gate script has already classed <html> with either
   "no-splash" (skip) or "intro-lock" (scroll locked, play). Sequence:
   the media rapidly flashes through a stack of images while the "Foroughi
   Mortgage" wordmark eases in and then holds locked on top; on the curtain
   pull the whole overlay (media + wordmark) slides up 100svh as one piece,
   the fixed nav fades in, and the splash node is removed. */
(function () {
  "use strict";

  var splash = document.getElementById("intro-splash");
  if (!splash) return;

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function finish() {
    if (splash.parentNode) splash.parentNode.removeChild(splash);
    root.classList.remove("intro-lock");
  }

  if (root.classList.contains("no-splash") || reduceMotion || !window.gsap) {
    finish();
    return;
  }

  try {
    sessionStorage.setItem("fmIntroSeen", "1");
  } catch (e) { /* private mode — intro simply replays next visit */ }

  var logo = splash.querySelector(".splash-logo");
  var slides = Array.prototype.slice.call(splash.querySelectorAll(".splash-slide"));
  var nav = [];
  /* the whole header bar, so the wordmark fades in with the links rather
     than popping in ahead of them */
  var barEl = document.querySelector(".topbar");
  var menuBtn = document.querySelector(".menu-btn");
  if (barEl) nav.push(barEl);
  if (menuBtn) nav.push(menuBtn);

  /* the nav stays hidden while the splash runs (CSS: html.intro-lock);
     GSAP owns its fade-in from here */
  gsap.set(nav, { opacity: 0 });

  /* ---- rapid image sequence -------------------------------------------
     hard-cut through the stacked slides every SEQ_STEP seconds. Each step
     hides all, then shows one in the same tick, so there is never a black
     frame between images. The loop repeats while the splash holds, then is
     paused the instant the curtain pull begins — the current frame freezes
     and rides up with the overlay as a single piece. */
  var SEQ_STEP = 0.2;
  var seqTl = null;
  if (slides.length) {
    gsap.set(slides, { autoAlpha: 0 });
    gsap.set(slides[0], { autoAlpha: 1 });
    if (slides.length > 1) {
      seqTl = gsap.timeline({ repeat: -1 });
      slides.forEach(function (slide, i) {
        seqTl.add(function () {
          gsap.set(slides, { autoAlpha: 0 });
          gsap.set(slide, { autoAlpha: 1 });
        }, i * SEQ_STEP);
      });
      /* spacer so the final frame gets its full SEQ_STEP before the loop wraps */
      seqTl.to({}, { duration: SEQ_STEP });
    }
  }

  function stopSeq() {
    if (seqTl) seqTl.pause();
  }

  /* the hold must last at least one full pass through the slides, or the
     curtain cuts the sequence short and the last frames never show. Scale it
     to slides.length so any count keeps working (base case: 6 slides -> 1.8s,
     matching the original fixed hold). */
  var loopDuration = slides.length > 1 ? (slides.length + 1) * SEQ_STEP : 0.6;
  var curtainStart = loopDuration + 0.4;
  var navStart = curtainStart + 0.8;

  var tl = gsap.timeline({
    onComplete: function () {
      if (seqTl) seqTl.kill();
      gsap.set(nav, { clearProps: "opacity" });
      finish();
    },
  });

  /* 1. wordmark eases in during the hold, then stays locked — no parallax */
  tl.from(logo, { autoAlpha: 0, y: 24, duration: 0.8, ease: "power2.out" }, 0.2);

  /* 2. curtain pull — the whole overlay (frozen media + locked wordmark)
        slides up together, exactly as before */
  tl.to(splash, { y: "-100svh", duration: 1.2, ease: "power1.inOut", onStart: stopSeq }, curtainStart);

  /* 3. fixed nav fades in near the end of the exit */
  tl.to(nav, { opacity: 1, duration: 0.6, ease: "power1.out" }, navStart);

  /* failsafe: if the timeline hasn't finished ~9s after load (background
     tab throttling, or anything unexpected), jump it to the end so the
     page never stays scroll-locked behind the splash */
  window.setTimeout(function () {
    if (tl.progress() < 1) {
      if (seqTl) seqTl.kill();
      tl.progress(1);
    }
  }, 9000);
})();
