/* Shmor site kit: menu toggle + on-site search (pages are found via /search-index.json) */
(function () {
  'use strict';
  var btn = document.querySelector('[data-menu]'), nav = document.querySelector('[data-nav]');
  if (btn && nav) btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });

  // TravelDeals: add a "Trip type" field to every search box; its value is folded into ?q=
  var TYPES = [['', 'Anything'], ['holidays', 'Holidays'], ['all inclusive', 'All-inclusive'], ['flights', 'Flights'], ['hotels', 'Hotels'], ['city breaks', 'City breaks']];
  Array.prototype.forEach.call(document.querySelectorAll('form.search'), function (form) {
    var q = form.querySelector('input[name=q]'), btn = form.querySelector('button');
    if (!q || !btn) return;
    var seg = document.createElement('label');
    seg.className = 'seg';
    seg.innerHTML = '<span>Trip type</span><select>' + TYPES.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('') + '</select>';
    form.insertBefore(seg, btn);
    form.addEventListener('submit', function () {
      var t = seg.querySelector('select').value;
      if (t && q.value.toLowerCase().indexOf(t) < 0) q.value = (q.value + ' ' + t).trim();
    });
  });

  var out = document.getElementById('search-results');
  if (!out) return;
  var q = (new URLSearchParams(location.search).get('q') || '').trim();
  var input = document.querySelector('.search input[name=q]');
  if (input) input.value = q;
  if (!q) return;
  document.getElementById('search-title').textContent = 'Results for “' + q + '”';
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var words = q.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 1; });
  fetch('/search-index.json').then(function (r) { return r.json(); }).then(function (pages) {
    var hits = pages.map(function (p) {
      var score = words.reduce(function (s, w) { return s + (p.terms.indexOf(w) > -1 ? 1 : 0); }, 0);
      return { p: p, score: score };
    }).filter(function (h) { return h.score > 0; }).sort(function (a, b) { return b.score - a.score; });
    out.innerHTML = hits.length
      ? hits.map(function (h) { return '<a class="card' + (h.p.img ? ' has-img' : '') + '" href="' + h.p.path + '">' + (h.p.img ? '<img class="card-img" src="' + esc(h.p.img) + '" alt="" loading="lazy" width="600" height="360">' : '') + '<h3>' + esc(h.p.title) + '</h3><p>' + esc(h.p.text) + '</p><span class="cta">Explore →</span></a>'; }).join('')
      : '<p class="empty">No pages matched. Try a broader search, or browse the guides below.</p>' +
        pages.slice(0, 6).map(function (p) { return '<a class="card" href="' + p.path + '"><h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p></a>'; }).join('');
  }).catch(function () { out.innerHTML = '<p class="empty">Search is unavailable right now.</p>'; });
})();
