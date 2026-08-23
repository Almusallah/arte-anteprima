/* ============================================================
   OFFICINE GẶP — interaction layer
   Lenis (smooth scroll) + GSAP/ScrollTrigger (horizontal pin
   & reveals) + Splitting (text) + live city clocks + cursor.

   Robustness rules:
   • Text reveals only HIDE-then-animate when the tab is visible.
     If the page loads in a background tab (or prefers-reduced-
     motion), everything renders in its natural, visible state —
     text is never left stuck at opacity 0.
   • The horizontal pin is set up through gsap.matchMedia so it
     self-corrects across resizes / orientation changes.
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer =
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  // Animate intro/reveals only when we can actually paint frames.
  var doReveal =
    hasGSAP && !prefersReduced && document.visibilityState === "visible";

  /* ---------- footer year & clocks (always run) ---------- */
  (function () {
    var y = document.querySelector("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  })();

  function startClocks() {
    var clocks = document.querySelectorAll("[data-clock]");
    if (!clocks.length) return;
    function tick() {
      clocks.forEach(function (el) {
        try {
          var t = new Intl.DateTimeFormat("en-GB", {
            timeZone: el.getAttribute("data-clock"),
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date());
          var b = el.querySelector("b");
          if (b) b.textContent = t;
        } catch (e) {}
      });
    }
    tick();
    setInterval(tick, 1000 * 15);
  }

  /* ---------- Lenis smooth scroll + ScrollTrigger sync ---------- */
  var lenis = null;
  function initLenis() {
    if (prefersReduced || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, smoothTouch: false });
    window.lenis = lenis; // debug / verification hook
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) {
        lenis.raf(t);
        requestAnimationFrame(raf);
      });
    }
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        // #top targets the (fixed) header area — a fixed element resolves to
        // the current scroll position, so scroll to 0 explicitly instead
        if (id === "#top") {
          e.preventDefault();
          lenis.scrollTo(0, { offset: 0 });
          return;
        }
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0 });
      });
    });
  }

  /* ---------- Splitting + reveals ---------- */
  function initReveals() {
    if (window.Splitting) Splitting();
    if (!doReveal) return; // leave everything visible

    gsap.utils.toArray("[data-splitting]").forEach(function (el) {
      var chars = el.querySelectorAll(".char");
      if (!chars.length) return;
      if (el.classList.contains("hero__title")) return; // handled after loader

      var play = function () {
        gsap.fromTo(
          chars,
          { yPercent: 110, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            ease: "expo.out",
            stagger: 0.012,
            onComplete: function () {
              gsap.set(chars, { clearProps: "transform,opacity" });
            },
          }
        );
      };

      ScrollTrigger.create({
        // elements inside the pinned track resolve their position oddly;
        // trigger them off the section instead
        trigger: el.closest(".h-track") ? ".h-section" : el,
        start: el.closest(".h-track") ? "top 60%" : "top 88%",
        once: true,
        onEnter: play,
      });
    });

    gsap.utils.toArray("[data-reveal]").forEach(function (group) {
      gsap.fromTo(
        group.children,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: { trigger: group, start: "top 85%", once: true },
          onComplete: function () {
            gsap.set(group.children, { clearProps: "transform,opacity" });
          },
        }
      );
    });
  }

  function revealHero() {
    var hero = document.querySelector(".hero__title");
    if (!hero || !doReveal) return;
    var chars = hero.querySelectorAll(".char");
    if (!chars.length) return;
    gsap.fromTo(
      chars,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.014,
        delay: 0.05,
        onComplete: function () {
          gsap.set(chars, { clearProps: "transform,opacity" });
        },
      }
    );
  }

  /* ---------- Horizontal pinned section (gsap.matchMedia) ---------- */
  function initHorizontal() {
    var track = document.querySelector("[data-track]");
    var section = document.querySelector(".h-section");
    if (!track || !section) return;

    if (!hasGSAP || prefersReduced) {
      document.body.classList.add("no-pin");
      return;
    }

    var mm = gsap.matchMedia();
    var getAmount = function () {
      return Math.max(0, track.scrollWidth - window.innerWidth);
    };

    mm.add("(min-width: 769px)", function () {
      document.body.classList.remove("no-pin");
      var tween = gsap.to(track, {
        x: function () { return -getAmount(); },
        ease: "none",
      });
      var st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: function () { return "+=" + getAmount(); },
        pin: true,
        scrub: 1,
        animation: tween,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
      return function () { st.kill(); tween.kill(); gsap.set(track, { clearProps: "x" }); };
    });

    mm.add("(max-width: 768px)", function () {
      document.body.classList.add("no-pin");
    });
  }

  /* ---------- Manifesto marquee ---------- */
  function initMarquee() {
    var marquee = document.querySelector("[data-marquee]");
    if (!marquee) return;
    var base = marquee.querySelector(".marquee__line");
    if (!base) return;

    while (marquee.scrollWidth < window.innerWidth * 1.2) {
      marquee.appendChild(base.cloneNode(true));
    }
    var firstHalf = Array.prototype.slice.call(marquee.children);
    firstHalf.forEach(function (n) { marquee.appendChild(n.cloneNode(true)); });

    if (prefersReduced || !hasGSAP) return;
    var distance = marquee.scrollWidth / 2;
    gsap.to(marquee, {
      x: -distance,
      duration: distance / 90, // ~90px / second
      ease: "none",
      repeat: -1,
    });
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    var cursor = document.querySelector(".cursor");
    if (!cursor || !finePointer || prefersReduced) return;
    document.body.classList.add("has-cursor");

    var mx = window.innerWidth / 2, my = window.innerHeight / 2, cx = mx, cy = my;
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });
    (function render() {
      cx += (mx - cx) * 0.2;
      cy += (my - cy) * 0.2;
      cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      requestAnimationFrame(render);
    })();

    document.querySelectorAll("a, button, [data-cursor]").forEach(function (el) {
      var type = el.getAttribute("data-cursor");
      el.addEventListener("pointerenter", function () {
        if (type === "view") cursor.classList.add("is-view");
        else if (type === "hide") cursor.classList.add("is-hide");
        else cursor.classList.add("is-link");
      });
      el.addEventListener("pointerleave", function () {
        cursor.classList.remove("is-view", "is-hide", "is-link");
      });
    });
  }

  /* ---------- Loader ---------- */
  function runLoader(done) {
    var loader = document.querySelector(".loader");
    if (!doReveal || !loader) {
      document.body.classList.remove("is-loading");
      if (loader) loader.style.display = "none";
      done();
      return;
    }
    var words = loader.querySelectorAll(".loader__word");
    var bar = loader.querySelector(".loader__progress span");
    gsap.set(words, { yPercent: 110 });
    gsap
      .timeline({
        onComplete: function () {
          document.body.classList.remove("is-loading");
          done();
        },
      })
      .to(words, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.08 })
      .to(bar, { width: "100%", duration: 0.9, ease: "power2.inOut" }, 0.15)
      .to(loader, { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, "+=0.15");
  }

  /* ---------- boot ---------- */
  function boot() {
    startClocks();
    initLenis();
    initMarquee();
    initHorizontal();
    initReveals();
    initCursor();

    if (hasGSAP) {
      ScrollTrigger.refresh();
      window.addEventListener("load", function () { ScrollTrigger.refresh(); });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
      }
    }

    runLoader(function () {
      revealHero();
      if (hasGSAP) ScrollTrigger.refresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

/* ---------- Research index + sticky pane ---------- */
(function () {
  var grid = document.querySelector("[data-research]");
  if (!grid) return;
  var items = Array.prototype.slice.call(grid.querySelectorAll(".research__li"));
  var pane = grid.querySelector(".research__pane");
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function activate(li) {
    items.forEach(function (x) {
      var on = x === li;
      x.classList.toggle("is-active", on);
      var b = x.querySelector(".research__item");
      if (b) b.setAttribute("aria-expanded", on ? "true" : "false");
    });
    if (pane) {
      var d = li.querySelector(".research__detail");
      pane.innerHTML = d ? d.outerHTML : "";
    }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  items.forEach(function (li) {
    var btn = li.querySelector(".research__item");
    if (!btn) return;
    btn.addEventListener("click", function () { activate(li); });
    if (finePointer) {
      btn.addEventListener("pointerenter", function () { activate(li); });
    }
  });

  var first = grid.querySelector(".research__li.is-active") || items[0];
  if (first) activate(first);
})();
