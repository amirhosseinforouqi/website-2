/* Home page — single full-viewport cover: looping background clip, load
   choreography, and the intro copy easing in. No scroll behavior. */
(function () {
  "use strict";

  var body = document.body;
  var video = document.getElementById("scrubVideo");

  /* ---- load choreography (kept from the original cover) ---- */
  function reveal() { body.classList.add("is-loaded"); }
  requestAnimationFrame(function () { requestAnimationFrame(reveal); });
  window.setTimeout(reveal, 120);

  if (video) {
    video.classList.add("is-playing"); /* fade the clip in */
    video.loop = true;
    var p = video.play();
    if (p !== undefined) p.catch(function () { /* poster stays */ });
  }

  /* intro copy eases in once, on load */
  if (window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.from(".hsec-copy > *", {
      y: 26,
      autoAlpha: 0,
      duration: 0.85,
      ease: "power3.out",
      stagger: 0.09,
      delay: 0.35,
    });
  }
})();
