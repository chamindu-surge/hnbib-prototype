/*
 * section-toggle.js
 *
 * Per-section variant toggle for M3 home pages and M4 structural pages.
 * Source of truth: skill/tools/section-toggle/section-toggle.js
 * Do not edit copies in 02-outputs/. Edit here and regenerate.
 *
 * Markup contract: see SKILL.md in this folder.
 */
(function () {
  'use strict';

  var MOBILE_BREAKPOINT = 768;
  var ROOT_CLASS = 'section-toggle-rail';
  var HIDDEN_CLASS = 'section-toggle-hidden';
  var ACTIVE_CLASS = 'section-toggle-active';

  // Canonical globals. data-controls on <body> picks which appear.
  var GLOBAL_DEFS = {
    texture: {
      label: 'Texture',
      classPrefix: 'tx-',
      options: ['clean', 'grid', 'noise', 'mesh', 'scan'],
      defaultOption: 'clean'
    },
    motion: {
      label: 'Motion',
      classPrefix: 'motion-',
      options: ['full', 'reduced', 'off'],
      defaultOption: 'full' // overridden by prefers-reduced-motion at init
    },
    density: {
      label: 'Density',
      classPrefix: 'density-',
      options: ['compact', 'standard', 'generous'],
      defaultOption: 'standard'
    }
  };

  function init() {
    // Apply default global classes to <body> first, before rendering anything.
    applyDefaultGlobals();

    var hosts = Array.prototype.slice.call(
      document.querySelectorAll('.section-host[data-section-id]')
    );

    // Set initial state: show the variant named by data-default-variant (default "B"),
    // falling back to index 0 if no matching variant label exists.
    hosts.forEach(function (host) {
      var variants = directVariants(host);
      var want = (host.getAttribute('data-default-variant') || 'B').toUpperCase();
      var defaultIndex = 0;
      variants.forEach(function (v, i) {
        if ((v.getAttribute('data-variant') || '').toUpperCase() === want) defaultIndex = i;
      });
      variants.forEach(function (v, i) {
        if (i === defaultIndex) v.classList.add(ACTIVE_CLASS);
        else v.classList.remove(ACTIVE_CLASS);
      });
    });

    // Only hosts with more than one variant get a rail row.
    var variantHosts = hosts.filter(function (host) {
      return directVariants(host).length > 1;
    });

    var globals = readControlsAttr();

    // Render the rail when there's something to show: globals or multi-variant
    // hosts. If neither, no rail.
    if (variantHosts.length === 0 && globals.length === 0) return;

    if (window.innerWidth < MOBILE_BREAKPOINT) {
      // No rail on mobile; default-state variant A is already applied above.
      bindResize(variantHosts);
      return;
    }

    var rail = buildRail(variantHosts, globals);
    document.body.appendChild(rail);

    bindKeyboard(variantHosts);
    bindResize(variantHosts, rail);
  }

  function applyDefaultGlobals() {
    var listed = readControlsAttr();
    listed.forEach(function (name) {
      var def = GLOBAL_DEFS[name];
      if (!def) return;
      // Only apply default if no class from this group is already present.
      var hasAny = false;
      def.options.forEach(function (opt) {
        if (document.body.classList.contains(def.classPrefix + opt)) {
          hasAny = true;
        }
      });
      if (hasAny) return;
      var initial = def.defaultOption;
      if (name === 'motion' && window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        initial = 'reduced';
      }
      document.body.classList.add(def.classPrefix + initial);
    });
  }

  function readControlsAttr() {
    var raw = document.body.getAttribute('data-controls') || '';
    return raw.split(',')
      .map(function (s) { return s.trim().toLowerCase(); })
      .filter(function (s) { return s.length > 0 && GLOBAL_DEFS[s]; });
  }

  function directVariants(host) {
    return Array.prototype.slice
      .call(host.children)
      .filter(function (el) {
        return el.classList && el.classList.contains('variant');
      });
  }

  function buildRail(hosts, globals) {
    var rail = document.createElement('aside');
    rail.className = ROOT_CLASS;
    rail.setAttribute('aria-label', 'Section variant toggle');

    var heading = document.createElement('div');
    heading.className = 'section-toggle-heading';
    // Backward-compat: if no globals are shown, keep the v1 heading 'Variants'.
    heading.textContent = (globals && globals.length > 0) ? 'Control panel' : 'Variants';
    rail.appendChild(heading);

    if (globals && globals.length > 0) {
      var globalsBlock = document.createElement('div');
      globalsBlock.className = 'section-toggle-globals';
      globals.forEach(function (name) {
        globalsBlock.appendChild(buildGlobalRow(name));
      });
      rail.appendChild(globalsBlock);

      if (hosts.length > 0) {
        var divider = document.createElement('div');
        divider.className = 'section-toggle-divider';
        rail.appendChild(divider);
        var sectionsHeading = document.createElement('div');
        sectionsHeading.className = 'section-toggle-section-heading';
        sectionsHeading.textContent = 'Layout';
        rail.appendChild(sectionsHeading);
      }
    }

    hosts.forEach(function (host) {
      rail.appendChild(buildHostRow(host));
    });

    return rail;
  }

  function buildGlobalRow(name) {
    var def = GLOBAL_DEFS[name];
    var row = document.createElement('div');
    row.className = 'section-toggle-row';
    row.setAttribute('data-global', name);

    var label = document.createElement('div');
    label.className = 'section-toggle-label';
    label.textContent = def.label;
    row.appendChild(label);

    var btns = document.createElement('div');
    btns.className = 'section-toggle-btns';
    def.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'section-toggle-btn';
      btn.textContent = opt.charAt(0).toUpperCase();
      btn.title = opt.charAt(0).toUpperCase() + opt.slice(1);
      if (document.body.classList.contains(def.classPrefix + opt)) {
        btn.classList.add(ACTIVE_CLASS);
      }
      btn.addEventListener('click', function () {
        setGlobal(def, opt, row);
      });
      btns.appendChild(btn);
    });
    row.appendChild(btns);
    return row;
  }

  function setGlobal(def, opt, row) {
    // Remove every class from this group, set the chosen one.
    def.options.forEach(function (o) {
      document.body.classList.remove(def.classPrefix + o);
    });
    document.body.classList.add(def.classPrefix + opt);

    if (!row) return;
    var btns = row.querySelectorAll('.section-toggle-btn');
    Array.prototype.forEach.call(btns, function (b, i) {
      if (def.options[i] === opt) b.classList.add(ACTIVE_CLASS);
      else b.classList.remove(ACTIVE_CLASS);
    });
  }

  function buildHostRow(host) {
    var sid = host.getAttribute('data-section-id');
    var slabel = host.getAttribute('data-section-label') || sid;
    var variants = directVariants(host);

    var row = document.createElement('div');
    row.className = 'section-toggle-row';
    row.setAttribute('data-section-id', sid);

    var label = document.createElement('div');
    label.className = 'section-toggle-label';
    label.textContent = slabel;
    row.appendChild(label);

    var btns = document.createElement('div');
    btns.className = 'section-toggle-btns';
    var want = (host.getAttribute('data-default-variant') || 'B').toUpperCase();
    var defaultIndex = 0;
    variants.forEach(function (v, i) {
      if ((v.getAttribute('data-variant') || '').toUpperCase() === want) defaultIndex = i;
    });
    variants.forEach(function (v, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'section-toggle-btn';
      btn.textContent =
        v.getAttribute('data-variant') || String.fromCharCode(65 + i);
      var vlabel = v.getAttribute('data-variant-label');
      if (vlabel) btn.title = vlabel;
      if (i === defaultIndex) btn.classList.add(ACTIVE_CLASS);
      btn.addEventListener('click', function () {
        setVariant(host, i);
      });
      btns.appendChild(btn);
    });
    row.appendChild(btns);
    return row;
  }

  function setVariant(host, index) {
    var variants = directVariants(host);
    if (index < 0 || index >= variants.length) return;
    variants.forEach(function (v, i) {
      if (i === index) v.classList.add(ACTIVE_CLASS);
      else v.classList.remove(ACTIVE_CLASS);
    });
    var rail = document.querySelector('.' + ROOT_CLASS);
    if (!rail) return;
    var sid = host.getAttribute('data-section-id');
    var row = rail.querySelector('[data-section-id="' + sid + '"]');
    if (!row) return;
    var btns = row.querySelectorAll('.section-toggle-btn');
    Array.prototype.forEach.call(btns, function (b, i) {
      if (i === index) b.classList.add(ACTIVE_CLASS);
      else b.classList.remove(ACTIVE_CLASS);
    });
  }

  function bindKeyboard(variantHosts) {
    document.addEventListener('keydown', function (e) {
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== '1' && e.key !== '2' && e.key !== '3') return;
      var idx = parseInt(e.key, 10) - 1;
      var focused = findHostInViewportCenter(variantHosts);
      if (focused) setVariant(focused, idx);
    });
  }

  function bindResize(variantHosts, rail) {
    window.addEventListener('resize', function () {
      var below = window.innerWidth < MOBILE_BREAKPOINT;
      if (below) {
        if (rail) rail.classList.add(HIDDEN_CLASS);
        variantHosts.forEach(function (h) {
          setVariant(h, 0);
        });
      } else if (rail) {
        rail.classList.remove(HIDDEN_CLASS);
      }
    });
  }

  function findHostInViewportCenter(hosts) {
    var center = window.innerHeight / 2;
    var best = null;
    var bestDist = Infinity;
    hosts.forEach(function (host) {
      var rect = host.getBoundingClientRect();
      var hostCenter = (rect.top + rect.bottom) / 2;
      var dist = Math.abs(hostCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = host;
      }
    });
    return best;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
