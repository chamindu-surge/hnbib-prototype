/*
 * scripts.js — Chalk Meridian prototype (M4)
 * Shared across all pages.
 * Devices: count-up on scroll, sparkline path draw, scroll-fade,
 *          nav scroll-shadow, mobile burger, services tab-switch.
 * All motion gated by body.motion-off / prefers-reduced-motion.
 */
(function () {
  'use strict';

  /* ─── Helpers ─────────────────────────────────────────── */
  function motionAllowed() {
    return !document.body.classList.contains('motion-off') &&
      !document.body.classList.contains('motion-reduced');
  }

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  /* ─── Count-up ────────────────────────────────────────── */
  function startCountUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    var target  = parseFloat(el.dataset.target) || 0;
    var prefix  = el.dataset.prefix  || '';
    var suffix  = el.dataset.suffix  || '';
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var duration = 1600;
    var start = performance.now();

    function step(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOutQuart(progress);
      var value = target * eased;
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }

    if (motionAllowed()) {
      requestAnimationFrame(step);
    } else {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
  }

  /* ─── Sparkline SVG path draw ─────────────────────────── */
  function animatePaths(root) {
    var paths = root.querySelectorAll('.sparkline-path');
    Array.prototype.forEach.call(paths, function (path) {
      if (path.dataset.animated) return;
      path.dataset.animated = '1';
      var len = path.getTotalLength();
      if (!motionAllowed()) {
        path.style.strokeDasharray  = 'none';
        path.style.strokeDashoffset = '0';
        return;
      }
      path.style.strokeDasharray  = len;
      path.style.strokeDashoffset = len;
      path.style.transition = 'stroke-dashoffset 1400ms cubic-bezier(0.16, 1, 0.3, 1)';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          path.style.strokeDashoffset = '0';
        });
      });
    });
  }

  /* ─── Scroll-fade ─────────────────────────────────────── */
  function initScrollFade() {
    if (!motionAllowed()) {
      document.querySelectorAll('.scroll-fade').forEach(function (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }
    var style = document.createElement('style');
    style.textContent = [
      '.scroll-fade{opacity:0;transform:translateY(24px);',
      'transition:opacity 500ms cubic-bezier(0.16,1,0.3,1),',
      'transform 500ms cubic-bezier(0.16,1,0.3,1);}',
      '.scroll-fade.visible{opacity:1;transform:none;}'
    ].join('');
    document.head.appendChild(style);
  }

  /* ─── IntersectionObserver ────────────────────────────── */
  function observe() {
    if (!('IntersectionObserver' in window)) {
      /* Fallback: reveal everything */
      document.querySelectorAll('.scroll-fade').forEach(function (el) {
        el.classList.add('visible');
      });
      document.querySelectorAll('[data-target]').forEach(function (el) {
        startCountUp(el);
      });
      return;
    }

    var fadeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          fadeObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.scroll-fade').forEach(function (el) {
      fadeObs.observe(el);
    });

    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          startCountUp(e.target);
          countObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });

    document.querySelectorAll('[data-target]').forEach(function (el) {
      countObs.observe(el);
    });

    var sparkObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animatePaths(e.target);
          sparkObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.sparkline-wrap').forEach(function (el) {
      sparkObs.observe(el);
    });
  }

  /* ─── Nav scroll shadow ────────────────────────────────── */
  function initNavScroll() {
    var nav = document.querySelector('.global-nav') || document.querySelector('.site-nav');
    if (!nav) return;
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });
  }

  /* ─── Mobile burger ─────────────────────────────────────── */
  function initBurger() {
    var nav = document.querySelector('.global-nav') || document.querySelector('.site-nav');
    var burger = document.querySelector('.nav-burger') || document.querySelector('.nav-toggle');
    if (!nav || !burger) return;
    burger.addEventListener('click', function () {
      nav.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded',
        String(nav.classList.contains('nav-open')));
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) nav.classList.remove('nav-open');
    });
  }

  /* ─── Dept filter (careers sidebar) ────────────────────── */
  function initDeptFilter() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.dept-filter a[data-dept]')
    );
    if (!links.length) return;
    var listFull = document.querySelector('.job-list-full');
    if (!listFull) return;
    var items = Array.prototype.slice.call(
      listFull.querySelectorAll('.job-list-item[data-dept]')
    );
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        links.forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');
        var dept = link.getAttribute('data-dept');
        items.forEach(function (item) {
          var show = dept === 'all' || item.getAttribute('data-dept') === dept;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ─── Filter bar (news categories) ─────────────────────── */
  function initFilterBars() {
    var bars = document.querySelectorAll('.filter-bar');
    Array.prototype.forEach.call(bars, function (bar) {
      var grid = bar.nextElementSibling;
      if (!grid || !grid.classList.contains('filtered-grid')) return;
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.filtered-card'));
      var btns  = Array.prototype.slice.call(bar.querySelectorAll('.filter-btn'));
      btns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          btns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var filter = (btn.getAttribute('data-filter') || 'all').toLowerCase();
          var filters = filter.split(' '); // support multi-value e.g. "macro strategy"
          cards.forEach(function (card) {
            var cat = (card.getAttribute('data-cat') || '').toLowerCase();
            var show = filter === 'all' || filters.indexOf(cat) !== -1;
            card.style.display = show ? '' : 'none';
          });
        });
      });
    });
  }

  /* ─── Services tab-switch ───────────────────────────────── */
  function initServicesTabs() {
    var menus = document.querySelectorAll('.services-menu');
    Array.prototype.forEach.call(menus, function (menu) {
      var panel = menu.closest('.services-b') &&
                  menu.closest('.services-b').querySelector('.services-panel');
      if (!panel) return;
      var items = menu.querySelectorAll('.sm-item');
      Array.prototype.forEach.call(items, function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          Array.prototype.forEach.call(items, function (b) {
            b.classList.remove('active');
          });
          btn.classList.add('active');
          var title  = btn.dataset.title  || '';
          var body   = btn.dataset.body   || '';
          var cta    = btn.dataset.cta    || '';
          var ctaHref = btn.dataset.ctaHref || '#';
          var t = panel.querySelector('.sp-title');
          var b = panel.querySelector('.sp-body');
          var c = panel.querySelector('.sp-cta');
          if (t) t.textContent = title;
          if (b) b.textContent = body;
          if (c) { c.textContent = cta; c.href = ctaHref; }
        });
      });
    });
  }

  /* ─── prefers-reduced-motion ────────────────────────────── */
  function applySystemMotion() {
    if (window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('motion-reduced');
    }
  }

  /* ─── Init ────────────────────────────────────────────── */
  function init() {
    applySystemMotion();
    initScrollFade();
    observe();
    initNavScroll();
    initBurger();
    initDeptFilter();
    initFilterBars();
    initServicesTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
