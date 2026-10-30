/* Interactive effects for every page (runs after main.js; loaded with fx.css).
   Home: intro loader, hero letter cascade + typewriter + mouse depth, impact counters,
   self-drawing timeline, sliding tab indicator.
   Everywhere: page transitions, decoding headings, card spotlight, button ripples,
   scroll progress, auto-hiding header, cursor ring, magnetic buttons, certificate tilt,
   back-to-top ring, "Let's talk" chip, slideshow timer bar. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  var add = function (html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return document.body.appendChild(t.content.firstChild);
  };

  /* ---------- shared UI injected on every page ---------- */
  var wipe = add('<div class="page-wipe" aria-hidden="true"></div>');
  var progress = document.querySelector(".scroll-progress") || add('<div class="scroll-progress" aria-hidden="true"></div>');
  var cursor = document.querySelector(".cursor-ring") || add('<div class="cursor-ring" aria-hidden="true"></div>');
  var toTop = document.querySelector(".to-top") || add('<button class="to-top" type="button" aria-label="Back to top">' +
    '<svg viewBox="0 0 54 54" aria-hidden="true"><circle class="track" cx="27" cy="27" r="24"/><circle class="ring" cx="27" cy="27" r="24" pathLength="1"/></svg>' +
    '<span class="arrow" aria-hidden="true">&uarr;</span></button>');
  var contact = document.getElementById("contact");
  var chip = add('<a class="talk-chip" href="' + (contact ? "#contact" : "index.html#contact") + '"><span class="pulse" aria-hidden="true"></span>Let&rsquo;s talk</a>');

  /* ---------- split text into letter spans (keeps child elements like .g) ---------- */
  var split = function (el, start) {
    var i = start || 0;
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split("").forEach(function (c) {
          if (!c.trim()) { frag.appendChild(document.createTextNode(c)); return; }
          var s = document.createElement("span");
          s.className = "ch";
          s.setAttribute("aria-hidden", "true");
          s.style.setProperty("--i", i++);
          s.textContent = c;
          frag.appendChild(s);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        i = split(node, i);
      }
    });
    return i;
  };

  /* ---------- hero: letter cascade + typewriter ---------- */
  var heroTitle = document.querySelector(".hero-title");
  if (heroTitle) {
    heroTitle.setAttribute("aria-label", heroTitle.textContent.replace(/\s+/g, " ").trim());
    split(heroTitle);
  }
  var typed = document.querySelector("[data-typed]");
  var startTyping = function () {
    if (!typed) return;
    var words = JSON.parse(typed.getAttribute("data-typed"));
    var out = typed.querySelector(".word");
    if (reduceMotion) { out.textContent = words[0]; return; }
    var w = 0, n = 0, deleting = false;
    var tick = function () {
      var word = words[w];
      n += deleting ? -1 : 1;
      out.textContent = word.slice(0, n);
      var delay = deleting ? 32 : 70;
      if (!deleting && n === word.length) { deleting = true; delay = 1700; }
      else if (deleting && n === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
      setTimeout(tick, delay);
    };
    tick();
  };
  var heroGo = function () {
    doc.classList.add("hero-ready");
    setTimeout(startTyping, 900);
  };

  /* ---------- intro loader (home, once per visit, skippable) ---------- */
  var intro = document.querySelector(".intro");
  if (intro && store.get("intro-seen") !== "1" && !reduceMotion) {
    doc.classList.add("intro-lock");
    split(intro.querySelector(".intro-name"));
    var count = intro.querySelector(".intro-count");
    var bar = intro.querySelector(".intro-bar");
    var DURATION = 2300, t0 = performance.now(), finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      store.set("intro-seen", "1");
      intro.classList.add("is-done");
      doc.classList.remove("intro-lock");
      setTimeout(heroGo, 350);
      setTimeout(function () { intro.hidden = true; }, 1150);
    };
    var step = function (now) {
      if (finished) return;
      var p = Math.min(1, (now - t0) / DURATION);
      var eased = 1 - Math.pow(1 - p, 3);
      count.textContent = String(Math.round(eased * 100)).padStart(3, "0");
      bar.style.transform = "scaleX(" + eased + ")";
      if (p < 1) requestAnimationFrame(step); else setTimeout(finish, 180);
    };
    requestAnimationFrame(step);
    intro.addEventListener("click", finish);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish(); }, { once: true });
  } else {
    if (intro) intro.hidden = true;
    heroGo();
  }

  /* ---------- page transitions (internal links) ---------- */
  if (!reduceMotion) {
    if (store.get("wipe") === "1" && !(intro && !intro.hidden)) doc.classList.add("wipe-in");
    store.set("wipe", "0");
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute("href");
      if (a.target || a.hasAttribute("download") || /^(https?:|mailto:|tel:|#)/i.test(href)) return;
      var url = new URL(href, location.href);
      if (url.pathname === location.pathname && url.hash) return; // same-page anchor
      e.preventDefault();
      store.set("wipe", "1");
      doc.classList.add("is-leaving");
      setTimeout(function () { location.href = url.href; }, 430);
    });
    window.addEventListener("pageshow", function (e) { if (e.persisted) doc.classList.remove("is-leaving", "wipe-in"); });
  }

  /* ---------- decoding headings ---------- */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>";
  var decode = function (el) {
    var nodes = [];
    var walk = function (n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3 && c.textContent.trim()) nodes.push({ node: c, text: c.textContent });
        else if (c.nodeType === 1) walk(c);
      });
    };
    walk(el);
    if (!nodes.length) return;
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    var t0 = performance.now(), dur = 950;
    var frame = function (now) {
      var p = Math.min(1, (now - t0) / dur);
      nodes.forEach(function (o) {
        var keep = Math.floor(o.text.length * p);
        var s = o.text.slice(0, keep);
        for (var i = keep; i < o.text.length; i++) {
          s += /\s/.test(o.text[i]) ? o.text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        o.node.textContent = s;
      });
      if (p < 1) requestAnimationFrame(frame);
      else nodes.forEach(function (o) { o.node.textContent = o.text; });
    };
    requestAnimationFrame(frame);
  };
  if (!reduceMotion && "IntersectionObserver" in window) {
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        dio.unobserve(en.target);
        setTimeout(function () { decode(en.target); }, 120);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll("h1.lulo, h2.lulo, .pj-title, .devtools h2").forEach(function (h) { dio.observe(h); });
  }

  /* ---------- impact counters ---------- */
  var nums = document.querySelectorAll("[data-count]");
  var runCount = function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target.toLocaleString("en-US") + suffix; return; }
    var t0 = performance.now(), dur = 1800;
    var frame = function (now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(target * (p === 1 ? 1 : eased)).toLocaleString("en-US") + suffix;
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { cio.observe(el); });
  } else {
    nums.forEach(runCount);
  }

  /* ---------- self-drawing timeline ---------- */
  var timeline = document.querySelector(".timeline");
  var tlFill = null, tlDots = [];
  if (timeline && !reduceMotion) {
    tlFill = document.createElement("span");
    tlFill.className = "tl-fill";
    tlFill.setAttribute("aria-hidden", "true");
    timeline.appendChild(tlFill);
    timeline.classList.add("is-drawing");
    tlDots = Array.prototype.slice.call(timeline.querySelectorAll(".tl-dot"));
  }
  var drawTimeline = function () {
    if (!tlFill) return;
    var r = timeline.getBoundingClientRect();
    var head = window.innerHeight * 0.62; // the "pen" sits a little below mid-screen
    var p = Math.max(0, Math.min(1, (head - r.top) / r.height));
    tlFill.style.transform = "scaleY(" + p.toFixed(4) + ")";
    tlDots.forEach(function (d) { d.classList.toggle("is-lit", d.getBoundingClientRect().top < head); });
  };

  /* ---------- scroll: progress, header, back-to-top, chip, timeline ---------- */
  var ring = toTop.querySelector(".ring");
  var lastY = window.scrollY, ticking = false, contactVisible = false;
  if (contact && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { contactVisible = en[0].isIntersecting; onScroll(); }, { threshold: 0.15 }).observe(contact);
  }
  var onScroll = function () {
    ticking = false;
    var y = window.scrollY;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p = Math.min(1, y / max);
    progress.style.transform = "scaleX(" + p + ")";
    if (ring) ring.style.strokeDashoffset = String(1 - p);
    toTop.classList.toggle("is-on", y > 700);
    chip.classList.toggle("is-on", y > 900 && !contactVisible && p < 0.97);
    doc.classList.toggle("header-scrolled", y > 10);
    if (doc.classList.contains("nav-open") || y < 400 || y < lastY) doc.classList.remove("header-hidden");
    else if (y > lastY) doc.classList.add("header-hidden");
    lastY = y;
    drawTimeline();
  };
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

  /* ---------- sliding tab indicator ---------- */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var ink = document.createElement("span");
    ink.className = "tab-ink";
    ink.setAttribute("aria-hidden", "true");
    list.appendChild(ink);
    var move = function () {
      var sel = list.querySelector('[aria-selected="true"]');
      if (!sel) return;
      ink.style.width = sel.offsetWidth + "px";
      ink.style.transform = "translateX(" + sel.offsetLeft + "px)";
    };
    list.addEventListener("click", function () { requestAnimationFrame(move); });
    list.addEventListener("keydown", function () { requestAnimationFrame(move); });
    window.addEventListener("resize", move);
    if (document.fonts) document.fonts.ready.then(move);
    move();
  });

  /* ---------- slideshow timer bar (pauses with the slideshow) ---------- */
  document.querySelectorAll("[data-slideshow][data-autoplay]").forEach(function (root) {
    if (reduceMotion) return;
    var host = root.querySelector(".art-slides") || root;
    var timer = document.createElement("div");
    timer.className = "slide-timer";
    timer.setAttribute("aria-hidden", "true");
    timer.style.setProperty("--dur", (parseInt(root.getAttribute("data-autoplay"), 10) || 7000) + "ms");
    timer.innerHTML = "<span></span>";
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.appendChild(timer);
    var restart = function () { timer.classList.remove("run"); void timer.offsetWidth; timer.classList.add("run"); };
    new MutationObserver(restart).observe(root, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    root.addEventListener("mouseenter", function () { timer.classList.add("paused"); });
    root.addEventListener("mouseleave", function () { timer.classList.remove("paused"); restart(); });
    root.addEventListener("focusin", function () { timer.classList.add("paused"); });
    restart();
  });

  /* ---------- button ripples ---------- */
  if (!reduceMotion) {
    document.addEventListener("pointerdown", function (e) {
      var b = e.target.closest(".btn-green, .btn-outline, .pj-filter, .tab, .art-arrow, .to-top");
      if (!b) return;
      var r = b.getBoundingClientRect();
      var s = document.createElement("span");
      s.className = "ripple";
      s.style.left = (e.clientX - r.left) + "px";
      s.style.top = (e.clientY - r.top) + "px";
      b.appendChild(s);
      setTimeout(function () { s.remove(); }, 700);
    });
  }

  if (!finePointer || reduceMotion) return;

  /* ---------- card spotlight ---------- */
  document.querySelectorAll(".gh-card, .repo-card, .pj-card, .pub-card, .contact-box, .about-box, .skill-box, .devtools, .art-pub, .cert").forEach(function (card) {
    if (getComputedStyle(card).position === "static") card.style.position = "relative";
    var glow = document.createElement("span");
    glow.className = "spot-glow";
    glow.setAttribute("aria-hidden", "true");
    card.appendChild(glow);
    card.classList.add("has-spot");
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- hero depth on mouse move ---------- */
  var hero = document.querySelector(".hero");
  var heroCopy = hero && hero.querySelector(".hero-copy");
  if (heroCopy) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      heroCopy.style.translate = (px * -18).toFixed(1) + "px " + (py * -12).toFixed(1) + "px";
    });
    hero.addEventListener("pointerleave", function () { heroCopy.style.translate = ""; });
  }

  /* ---------- cursor ring ---------- */
  var mx = -100, my = -100, cx = -100, cy = -100;
  window.addEventListener("pointermove", function (e) {
    mx = e.clientX; my = e.clientY; cursor.classList.add("is-on");
    cursor.classList.toggle("is-hover", !!e.target.closest("a, button, .cert, .tab, input, textarea, .pill"));
  }, { passive: true });
  document.addEventListener("pointerleave", function () { cursor.classList.remove("is-on"); });
  (function follow() {
    cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
    cursor.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
    requestAnimationFrame(follow);
  })();

  /* ---------- magnetic buttons ---------- */
  document.querySelectorAll(".btn-outline, .btn-green, .talk-chip").forEach(function (b) {
    b.addEventListener("pointermove", function (e) {
      var r = b.getBoundingClientRect();
      var dx = (e.clientX - r.left - r.width / 2) * 0.22, dy = (e.clientY - r.top - r.height / 2) * 0.35;
      b.style.translate = dx.toFixed(1) + "px " + dy.toFixed(1) + "px";
    });
    b.addEventListener("pointerleave", function () { b.style.translate = ""; });
  });

  /* ---------- certificate tilt ---------- */
  document.querySelectorAll(".cert").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add("is-tilting");
      card.style.transform = "perspective(900px) rotateX(" + (-py * 7).toFixed(2) + "deg) rotateY(" + (px * 9).toFixed(2) + "deg) translateY(-4px)";
    });
    card.addEventListener("pointerleave", function () { card.classList.remove("is-tilting"); card.style.transform = ""; });
  });
})();
