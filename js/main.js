/* ProСТО — interface behaviour (Motion for vanilla JS) */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var prefersReduced = function () { return reduceQuery.matches; };
  var MotionAPI = window.Motion || null;

  var focusableSelector = 'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

  function trapFocus(event, container, extra) {
    if (event.key !== "Tab") return;
    var nodes = Array.prototype.slice.call(container.querySelectorAll(focusableSelector));
    if (extra && extra.length) nodes = nodes.concat(extra);
    nodes = nodes.filter(function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
    });
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ---------------------------------------------------------
     Header state
     --------------------------------------------------------- */
  var header = document.getElementById("hdr");
  var onScroll = function () {
    if (!header) return;
    if (window.scrollY > 10) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------------------------------------
     Mobile menu
     --------------------------------------------------------- */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  var menuOpen = false;
  var menuReturnFocus = null;

  function openMenu() {
    if (!menu || !burger || menuOpen) return;
    menuOpen = true;
    menuReturnFocus = document.activeElement;
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Закрыть меню");
    menu.removeAttribute("inert");
    menu.setAttribute("aria-hidden", "false");
    menu.classList.add("is-open");
    doc.classList.add("lock");

    if (MotionAPI && !prefersReduced()) {
      var nav = menu.querySelector(".menu__nav");
      var foot = menu.querySelector(".menu__foot");
      if (nav) MotionAPI.animate(nav, { opacity: [0, 1], y: [18, 0] }, { duration: 0.45, ease: [0.16, 1, 0.3, 1] });
      if (foot) MotionAPI.animate(foot, { opacity: [0, 1], y: [14, 0] }, { duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] });
    }

    window.setTimeout(function () {
      var first = menu.querySelector(".menu__nav a");
      if (first) first.focus({ preventScroll: true });
    }, 30);
  }

  function closeMenu(restoreFocus) {
    if (!menu || !burger || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menu.setAttribute("inert", "");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
    doc.classList.remove("lock");
    if (restoreFocus !== false && menuReturnFocus && typeof menuReturnFocus.focus === "function") {
      menuReturnFocus.focus({ preventScroll: true });
    }
  }

  if (burger && menu) {
    burger.addEventListener("click", function () {
      if (menuOpen) closeMenu();
      else openMenu();
    });

    menu.addEventListener("click", function (event) {
      var link = event.target.closest("a[href]");
      if (link && link.getAttribute("href").charAt(0) === "#") closeMenu(false);
    });

    var brandLink = document.querySelector(".hdr .brand");
    if (brandLink) {
      brandLink.addEventListener("click", function () {
        if (menuOpen) closeMenu(false);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (!menuOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      } else {
        trapFocus(event, menu, [burger]);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && menuOpen) closeMenu(false);
    });
  }

  /* ---------------------------------------------------------
     Photo lightbox
     --------------------------------------------------------- */
  var galleryButtons = Array.prototype.slice.call(document.querySelectorAll(".gallery__btn"));
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var lbCount = document.getElementById("lbCount");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var lbOpen = false;
  var lbIndex = 0;
  var lbReturnFocus = null;

  var galleryItems = galleryButtons.map(function (button) {
    var image = button.querySelector("img");
    return {
      src: button.getAttribute("data-full"),
      caption: button.getAttribute("data-caption") || "",
      alt: image ? image.alt : ""
    };
  });

  function renderLightbox() {
    var item = galleryItems[lbIndex];
    if (!item || !lbImg) return;
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    if (lbCap) lbCap.textContent = item.caption;
    if (lbCount) lbCount.textContent = (lbIndex + 1) + " / " + galleryItems.length;
  }

  function openLightbox(index, trigger) {
    if (!lightbox || !lbImg || !galleryItems.length) return;
    lbIndex = (index + galleryItems.length) % galleryItems.length;
    lbReturnFocus = trigger || document.activeElement;
    lbOpen = true;
    renderLightbox();
    lightbox.removeAttribute("inert");
    lightbox.setAttribute("aria-hidden", "false");
    lightbox.classList.add("is-open");
    doc.classList.add("lock");

    if (MotionAPI && !prefersReduced()) {
      var stage = lightbox.querySelector(".lb__stage");
      if (stage) MotionAPI.animate(stage, { opacity: [0, 1], y: [18, 0], scale: [0.985, 1] }, { duration: 0.45, ease: [0.16, 1, 0.3, 1] });
    }
    if (lbClose) lbClose.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightbox || !lbOpen) return;
    lbOpen = false;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.setAttribute("inert", "");
    doc.classList.remove("lock");
    if (lbReturnFocus && typeof lbReturnFocus.focus === "function") {
      lbReturnFocus.focus({ preventScroll: true });
    }
  }

  function stepLightbox(delta) {
    if (!lbOpen) return;
    lbIndex = (lbIndex + delta + galleryItems.length) % galleryItems.length;
    renderLightbox();
    if (MotionAPI && !prefersReduced() && lbImg) {
      MotionAPI.animate(lbImg, { opacity: [0.2, 1] }, { duration: 0.28, ease: "ease-out" });
    }
  }

  galleryButtons.forEach(function (button, index) {
    button.addEventListener("click", function () { openLightbox(index, button); });
  });

  if (lightbox) {
    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    if (lbPrev) lbPrev.addEventListener("click", function () { stepLightbox(-1); });
    if (lbNext) lbNext.addEventListener("click", function () { stepLightbox(1); });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (event) {
      if (!lbOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepLightbox(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepLightbox(1);
      } else {
        trapFocus(event, lightbox);
      }
    });
  }

  /* ---------------------------------------------------------
     Reveal choreography — only if Motion is available
     --------------------------------------------------------- */
  if (MotionAPI && !prefersReduced()) {
    doc.classList.add("motion-ready");

    var heroItems = document.querySelectorAll(".hero [data-hero]");
    if (heroItems.length) {
      MotionAPI.animate(heroItems, { opacity: [0, 1], y: [26, 0] }, {
        duration: 0.9,
        delay: MotionAPI.stagger(0.075),
        ease: [0.16, 1, 0.3, 1]
      });
    }

    MotionAPI.inView("[data-reveal]", function (info) {
      MotionAPI.animate(info.target, { opacity: [0, 1], y: [30, 0] }, {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      });
    }, { margin: "0px 0px -8% 0px" });
  }
})();
