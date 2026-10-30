/* Ankit Anand — shared site behaviour (no dependencies).
   Hooks are data-attributes so every page can opt in:
   [data-anim]           Wix entrance motion when scrolled into view (fade-expand, fade-expand-lg, float-in, reveal-in, fade-in)
   .parallax-layer       scroll-linked background parallax
   [data-tabs]           accessible tabs (role=tab / role=tabpanel)
   [data-lightbox]       open an image in the lightbox (href = image, data-caption = text)
   [data-dialog-open]    open <dialog id="…"> ; [data-dialog-close] closes it
   [data-filters]        filter buttons [data-filter] over items [data-cats] inside [data-filter-items]
   [data-slideshow]      slides with prev/next, dots and autoplay
   form[data-mailto]     compose an email from the form fields                                          */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.__siteReady = true;

  /* ---------- mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    var closeNav = function () {
      doc.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };
    toggle.addEventListener("click", function () {
      var open = !doc.classList.contains("nav-open");
      doc.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    document.querySelectorAll(".site-nav a").forEach(function (a) { a.addEventListener("click", closeNav); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }

  /* ---------- entrance animations (IntersectionObserver, once) ---------- */
  var animated = document.querySelectorAll("[data-anim]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    animated.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    animated.forEach(function (el) { io.observe(el); });
  }

  /* ---------- scroll-linked parallax backgrounds ---------- */
  var layers = Array.prototype.slice.call(document.querySelectorAll(".parallax-layer"));
  if (layers.length && !reduceMotion) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      layers.forEach(function (layer) {
        var box = layer.parentElement.getBoundingClientRect();
        if (box.bottom < -100 || box.top > vh + 100) return;
        // progress: 0 when the section enters at the bottom, 1 when it leaves at the top
        var progress = (vh - box.top) / (vh + box.height);
        var range = box.height * 0.2;
        layer.style.transform = "translate3d(0," + ((progress - 0.5) * range).toFixed(1) + "px,0)";
      });
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------- tabs ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (!panel) return;
        panel.hidden = !on;
        if (on) {
          panel.classList.remove("is-showing"); void panel.offsetWidth; panel.classList.add("is-showing");
        } else {
          panel.querySelectorAll("video").forEach(function (v) { v.pause(); });
        }
      });
      if (focus) tab.focus();
      tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
    var scroller = root.querySelector("[data-tab-scroll]");
    var list = root.querySelector('[role="tablist"]');
    if (scroller && list) {
      scroller.addEventListener("click", function () {
        var atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 4;
        list.scrollBy({ left: atEnd ? -list.scrollWidth : 220, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }
  });

  /* ---------- dialogs: generic + lightbox ---------- */
  var openDialog = function (dlg, opener) {
    if (!dlg || typeof dlg.showModal !== "function") return false;
    dlg.__opener = opener || null;
    dlg.showModal();
    doc.style.overflow = "hidden";
    return true;
  };
  var wireDialog = function (dlg) {
    if (dlg.__wired) return;
    dlg.__wired = true;
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.closest("[data-dialog-close]")) dlg.close();
    });
    dlg.addEventListener("close", function () {
      // keep the page locked while another dialog (e.g. the modal under a lightbox) is still open
      if (!document.querySelector("dialog[open]")) doc.style.overflow = "";
      dlg.querySelectorAll("video").forEach(function (v) { v.pause(); });
      if (dlg.__opener) dlg.__opener.focus();
    });
  };
  document.querySelectorAll("dialog").forEach(wireDialog);

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-dialog-open]");
    if (opener) {
      var dlg = document.getElementById(opener.getAttribute("data-dialog-open"));
      if (dlg) { wireDialog(dlg); if (openDialog(dlg, opener)) e.preventDefault(); }
      return;
    }
    var lb = e.target.closest("[data-lightbox]");
    if (lb) {
      var box = document.getElementById("lightbox");
      if (!box) {
        box = document.createElement("dialog");
        box.id = "lightbox";
        box.className = "lightbox";
        box.setAttribute("aria-label", "Image viewer");
        box.innerHTML = '<button class="dialog-close" type="button" data-dialog-close aria-label="Close">&times;</button>' +
          '<figure><img alt=""><figcaption></figcaption></figure>';
        document.body.appendChild(box);
        wireDialog(box);
      }
      var img = box.querySelector("img");
      img.src = lb.getAttribute("data-lightbox") || lb.getAttribute("href");
      img.alt = lb.getAttribute("data-alt") || "";
      box.querySelector("figcaption").textContent = lb.getAttribute("data-caption") || "";
      if (openDialog(box, lb)) e.preventDefault();
    }
  });

  /* ---------- filters (projects page) ---------- */
  document.querySelectorAll("[data-filters]").forEach(function (bar) {
    var scope = document.querySelector(bar.getAttribute("data-filters")) || document;
    var items = Array.prototype.slice.call(scope.querySelectorAll("[data-cats]"));
    var buttons = Array.prototype.slice.call(bar.querySelectorAll("[data-filter]"));
    var status = document.querySelector(bar.getAttribute("data-filter-status") || "#filter-status");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        buttons.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", String(on));
        });
        var apply = function () {
          var shown = 0;
          items.forEach(function (it) {
            var match = f === "all" || (" " + it.getAttribute("data-cats") + " ").indexOf(" " + f + " ") > -1;
            it.hidden = !match;
            if (match) {
              shown++;
              it.classList.remove("is-in");
              void it.offsetWidth;
              it.classList.add("is-in");
            }
          });
          // set inside apply: startViewTransition runs this callback asynchronously
          if (status) status.textContent = shown + (shown === 1 ? " project" : " projects") + " shown";
        };
        if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply); else apply();
      });
    });
  });

  /* ---------- slideshow (articles page) ---------- */
  document.querySelectorAll("[data-slideshow]").forEach(function (root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-slide]"));
    if (slides.length < 2) return;
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-goto]"));
    var idx = Math.max(0, slides.findIndex(function (s) { return !s.hidden; }));
    var timer = null;
    var delay = parseInt(root.getAttribute("data-autoplay") || "0", 10);
    var show = function (n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === idx;
        s.hidden = !on;
        s.setAttribute("aria-hidden", String(!on));
        if (on) { s.classList.remove("is-in"); void s.offsetWidth; s.classList.add("is-in"); }
      });
      dots.forEach(function (d, i) { d.setAttribute("aria-current", i === idx ? "true" : "false"); });
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var start = function () { if (delay && !reduceMotion && !timer) timer = setInterval(function () { show(idx + 1); }, delay); };
    root.addEventListener("click", function (e) {
      var prev = e.target.closest("[data-prev]"), next = e.target.closest("[data-next]"), dot = e.target.closest("[data-goto]");
      if (prev) { show(idx - 1); stop(); }
      if (next) { show(idx + 1); stop(); }
      if (dot) { show(parseInt(dot.getAttribute("data-goto"), 10)); stop(); }
    });
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { show(idx - 1); stop(); }
      if (e.key === "ArrowRight") { show(idx + 1); stop(); }
    });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("focusin", stop);
    root.addEventListener("mouseleave", start);
    show(idx);
    start();
  });

  /* ---------- contact form → email (GitHub Pages has no form backend) ---------- */
  document.querySelectorAll("form[data-mailto]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var v = function (n) { var f = form.elements[n]; return f ? f.value.trim() : ""; };
      var name = (v("first") + " " + v("last")).trim();
      var body = [v("message"), "", "—", name, v("email"), v("phone")].filter(function (x, i) { return x || i < 3; }).join("\n");
      var href = "mailto:" + form.getAttribute("data-mailto") +
        "?subject=" + encodeURIComponent("Website enquiry from " + name) +
        "&body=" + encodeURIComponent(body);
      window.location.href = href;
      var status = form.querySelector(".form-status");
      if (status) status.textContent = "Opening your email app… if nothing happens, write to " + form.getAttribute("data-mailto");
    });
  });

  /* ---------- pause videos when the tab is hidden ---------- */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) document.querySelectorAll("video").forEach(function (v) { v.pause(); });
  });

  /* ---------- live GitHub repositories ([data-gh-user]) ----------
     Refreshes [data-gh-count] and each [data-gh-repo] meta line (language, last update, stars)
     from the public GitHub API, and appends any repo not yet on the page into [data-gh-extra].
     The static HTML stays as-is if the API is unreachable or rate-limited. */
  var ghRoot = document.querySelector("[data-gh-user]");
  if (ghRoot && window.fetch) {
    var ghUser = ghRoot.getAttribute("data-gh-user");
    var ghSkip = [ghUser.toLowerCase(), (ghUser + ".github.io").toLowerCase()]; // profile README + this site
    var ghKey = "gh-repos-" + ghUser;
    var langColor = { Python: "#3572a5", R: "#198ce7", Mathematica: "#dd1100", JavaScript: "#f1e05a", HTML: "#e34c26", SQL: "#e38c00", TeX: "#3d6117", "Jupyter Notebook": "#da5b0b", Stata: "#1a5f91" };
    var fmtDate = function (iso) { return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" }); };

    var buildCard = function (r) {
      var li = document.createElement("li");
      li.setAttribute("data-anim", "fade-expand");
      li.className = "is-in";
      li.innerHTML = '<article class="repo-card"><div class="repo-thumb repo-thumb--gh" aria-hidden="true">' +
        '<svg focusable="false"><use href="#i-github"/></svg></div><div class="repo-body"><h3 class="repo-title"></h3>' +
        '<p class="repo-summary"></p><ul class="repo-tags" aria-label="Details"></ul><div class="repo-foot">' +
        '<a class="btn-outline repo-btn" target="_blank" rel="noopener"><svg aria-hidden="true" focusable="false"><use href="#i-github"/></svg>Code' +
        '<span class="sr-only"> on GitHub (opens in a new tab)</span></a></div></div></article>';
      li.querySelector(".repo-title").textContent = r.name.replace(/[_-]+/g, " ");
      li.querySelector(".repo-summary").textContent = r.description || "Public repository on GitHub.";
      var tags = li.querySelector(".repo-tags");
      [r.language, "Updated " + fmtDate(r.pushed_at)].forEach(function (t) {
        if (!t) return;
        var tag = document.createElement("li");
        tag.textContent = t;
        tags.appendChild(tag);
      });
      li.querySelector("a").href = "https://github.com/" + ghUser + "/" + encodeURIComponent(r.name);
      return li;
    };

    var renderRepos = function (repos) {
      repos = repos.filter(function (r) { return !r.fork && !r.private && ghSkip.indexOf(r.name.toLowerCase()) < 0; });
      document.querySelectorAll("[data-gh-count]").forEach(function (el) { el.textContent = repos.length; });
      var byName = {};
      repos.forEach(function (r) { byName[r.name.toLowerCase()] = r; });
      document.querySelectorAll("[data-gh-repo]").forEach(function (meta) {
        var r = byName[meta.getAttribute("data-gh-repo").toLowerCase()];
        if (!r) return;
        var lang = meta.querySelector(".gh-lang"), upd = meta.querySelector(".gh-updated");
        if (lang && r.language) { lang.textContent = r.language; lang.style.setProperty("--c", langColor[r.language] || "#9aa3ad"); }
        if (upd) upd.textContent = "Updated " + fmtDate(r.pushed_at);
        var stars = meta.querySelector(".gh-stars");
        if (r.stargazers_count && !stars) { stars = document.createElement("span"); stars.className = "gh-stars"; meta.appendChild(stars); }
        if (stars) stars.textContent = "★ " + r.stargazers_count;
      });
      var extra = document.querySelector("[data-gh-extra]");
      if (!extra) return;
      var shown = {};
      document.querySelectorAll('a[href^="https://github.com/' + ghUser + '/"]').forEach(function (a) {
        var name = a.getAttribute("href").split("/")[4];
        if (name) shown[decodeURIComponent(name).toLowerCase()] = true;
      });
      repos.forEach(function (r) { if (!shown[r.name.toLowerCase()]) extra.appendChild(buildCard(r)); });
    };

    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(ghKey) || "null"); } catch (e) { cached = null; }
    if (cached && Date.now() - cached.t < 3600000) {
      renderRepos(cached.repos);
    } else {
      fetch("https://api.github.com/users/" + encodeURIComponent(ghUser) + "/repos?per_page=100&sort=pushed", { headers: { Accept: "application/vnd.github+json" } })
        .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(function (repos) {
          if (!Array.isArray(repos)) return;
          try { sessionStorage.setItem(ghKey, JSON.stringify({ t: Date.now(), repos: repos })); } catch (e) { /* storage unavailable */ }
          renderRepos(repos);
        })
        .catch(function () { /* keep the static cards */ });
    }
  }

  /* ---------- footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
