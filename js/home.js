/* Homepage — the two tab groups: the audience switcher in the bright hero and
   the two-path story sequence. Both are ordinary WAI-ARIA tabs: a roving
   tabindex, arrow-key navigation, and content that is present in the markup
   whether or not this script ever runs. Nothing here is scroll-linked. */
(function () {
  "use strict";

  function wireTabs(list, onSelect) {
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    if (tabs.length < 2) return;

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      if (onSelect) onSelect(tab);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (step) {
          e.preventDefault();
          select(tabs[(i + step + tabs.length) % tabs.length], true);
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          select(e.key === "Home" ? tabs[0] : tabs[tabs.length - 1], true);
        }
      });
    });
  }

  /* the audience switcher swaps the hero's supporting copy and its next step */
  wireTabs(document.querySelector(".hp-seg"));

  /* the story sequence keeps one frame and changes the steps beside it */
  var frame = document.getElementById("storyFrame");
  var figure = frame && frame.closest(".hp-story-frame");

  wireTabs(document.querySelector(".hp-story-tabs"), function (tab) {
    var src = tab.getAttribute("data-frame");
    if (!frame || !src || frame.getAttribute("src") === src) return;

    if (!figure || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame.src = src;
      return;
    }

    /* cross-fade rather than a hard cut; the swap waits for the new file so a
       slow connection never shows an empty frame */
    var next = new Image();
    next.onload = function () {
      figure.classList.add("is-swapping");
      window.setTimeout(function () {
        frame.src = src;
        figure.classList.remove("is-swapping");
      }, 180);
    };
    next.src = src;
  });
})();
