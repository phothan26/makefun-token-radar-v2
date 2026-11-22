// TOKEN TIDE dashboard. Renders window.TIDE_DATA. No network, no clock, no randomness.
// The farm-plan rules below mirror main.ts exactly; a Node check verifies the two
// implementations produce byte-identical steps for every board row.
(function () {
  'use strict';
  // ---- formatting (mirrors main.ts) ----
  function trim1(x) { const s = x.toFixed(1); return s.endsWith('.0') ? s.slice(0, -2) : s; }
  function fmtUsd(v) {
    if (v >= 1e9) return '$' + trim1(v / 1e9) + 'B';
    if (v >= 1e6) return '$' + trim1(v / 1e6) + 'M';
    if (v >= 1e3) return '$' + trim1(v / 1e3) + 'K';
    return '$' + Math.round(v);
  }
  function fmtPct(g) { return (g >= 0 ? '+' : '') + trim1(g) + '%'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ordinal(n) { return n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'); }

  // ---- farm plans (mirrors main.ts) ----
  function categoryAction(cat) {
    const c = (cat || '').toLowerCase();
    if (/bridge/.test(c)) return 'Route real volume through it: on a bridge, the flow is the farm. Bridge on its busiest chain first, repeat the same route weekly while the 7d change holds, and keep each transfer big enough to count as genuine usage.';
    if (/dex/.test(c)) return 'Work its pools first: on a Dexs protocol, volume follows TVL momentum, so fees and points accrue fastest while the tide is rising. Provide liquidity in the deepest pool and keep the position single-sided if the pool allows it.';
    if (/lend/.test(c) || /risk curators/.test(c) || /collateral/.test(c) || /cdp/.test(c)) return 'Lend first: supply the asset the protocol is growing fastest in, then borrow against it only after a week of positive TVL prints. Lending rewards patient capital while momentum is rising.';
    if (/deriv/.test(c) || /perp/.test(c) || /options/.test(c) || /basis/.test(c) || /synthetics/.test(c)) return 'Use its derivatives desk for momentum exposure with tight size: momentum reverses fast on leverage, so cap the position at what you could lose in a single week and never add to a loser.';
    if (/yield/.test(c) || /farm/.test(c)) return 'Farm its highest-TVL vault first, then rotate to the next vault only when its 7d change beats the first by five points. Chasing every vault at once dilutes the position.';
    if (/stak/.test(c) || /restak/.test(c)) return 'Stake through it on the chain where it is growing fastest; restaked positions compound the momentum but lock capital, so ladder the entries across three weeks instead of staking everything at once.';
    if (/rwa/.test(c) || /stablecoin/.test(c) || /payments/.test(c) || /card/.test(c)) return 'Use it for real flows, not idle deposits: move a recurring payment or settlement through it weekly, because steady volume is what a token launch rewards here.';
    if (/launchpad/.test(c)) return 'Join its launches early and hold the allocation through the first week: launchpads reward the wallets that show up at the start of a raise, not the ones that arrive after the momentum prints.';
    if (cat) return 'Use the protocol\'s core ' + cat + ' product first and do it weekly: repeated, real usage is what a future token rewards most, and one-off interactions read as a tourist, not a user.';
    return 'Use the protocol\'s core product first and do it weekly: repeated, real usage is what a future token rewards most, and one-off interactions read as a tourist, not a user.';
  }
  function farmSteps(r) {
    const g = r.g;
    const steps = [];
    if (g === null) {
      steps.push('No weekly print recorded for ' + r.name + ' yet: wait for the first 7d change to print before sizing in. A protocol with no momentum reading is a watch, not an entry — check back after the next weekly update.');
    } else if (g > 20) {
      steps.push('Ride the tide now: ' + r.name + ' is up ' + fmtPct(g) + ' in 7 days on ' + fmtUsd(r.tvl) + ' of TVL. Open a starter position this week and add in two tranches over the next 10 days while the 7d change stays positive.');
    } else if (g > 0) {
      steps.push('Enter on strength: ' + r.name + ' is up ' + fmtPct(g) + ' in 7 days. Start small now and add after the next weekly print confirms the move is holding.');
    } else {
      steps.push('Wait for the turn: ' + r.name + ' is down ' + fmtPct(g) + ' over 7 days. Do not chase it yet — watch for two straight positive weekly prints before putting capital in.');
    }
    steps.push(categoryAction(r.category));
    const n = r.chains.length;
    const shown = r.chains.slice(0, 3).join(', ') + (n > 3 ? ' and ' + (n - 3) + ' more' : '');
    const second = n > 1 ? r.chains[1] : 'the next chain';
    steps.push('Start on ' + r.chains[0] + ', the first chain listed for ' + r.name + ' (' + n + ' chain' + (n === 1 ? '' : 's') + ' in all: ' + shown + '). If ' + r.chains[0] + ' fees spike, move the same flow to ' + second + ' and compare the 7d change there.');
    steps.push('Re-check the 7d change every week: if it turns negative two weeks running, cut the position in half, and exit on a third negative week. Momentum can reverse without warning — the exit rule is the plan, not an afterthought.');
    const c = (r.category || '').toLowerCase();
    if (/dex/.test(c) || /liquidity/.test(c)) {
      steps.push('Mind impermanent loss: a fast-rising pool still reprices against you, so prefer the deepest pool and avoid thin pairs while momentum is hot.');
    } else if (r.tvl < 50000000) {
      steps.push('Small-base warning: at ' + fmtUsd(r.tvl) + ' of TVL a single whale moving in or out swings the 7d change by double digits. Size for a 30% drawdown and never use leverage here.');
    } else {
      steps.push('Smart-contract risk stays real at any size: farm from a fresh wallet, never approve unlimited spend, and revoke approvals after each session.');
    }
    if (r.watchlist) {
      steps.push('Watchlist note: ' + r.name + ' records no token and sits above the $50M floor, so it is a launch candidate. Farm usage and points now — if a token ever comes, early users are the ones it rewards.');
    }
    if (r.age !== null && r.age < 365 && g !== null && g > 10) {
      steps.push('Breakout watch: listed only ' + r.age + ' days ago and already up ' + fmtPct(g) + ' in a week. Young protocols that hold this pace for a month are the ones that re-rate — check weekly, not daily, and let the trend confirm itself.');
    }
    return steps.map(function (s) { return s.trim(); });
  }

  // ---- data ----
  var D = window.TIDE_DATA;
  function rowObj(a) {
    var cat = D.cats[a[2]];
    var catF = 1 + Math.min(0.6, Math.max(-0.4, (D.catMedians[cat] || 0) / 50));
    return { slug: a[0], name: a[1], category: cat === '—' ? null : cat,
      chains: a[3].map(function (i) { return D.chains[i]; }), tvl: a[4], g: a[5],
      age: a[6], vel: a[7], trend: a[8], catF: catF, core: Math.min((a[7] + a[8]) * catF, 3.0),
      scale: a[9], chainB: a[10], nt: a[11], score: a[12], value: a[13], watchlist: a[14] === 1 };
  }
  var ROWS = D.rows.map(rowObj);
  var BY_SLUG = {};
  ROWS.forEach(function (r, i) { r.rank = i + 1; BY_SLUG[r.slug] = r; });
  var gSorted = ROWS.slice().sort(function (a, b) { return (b.g === null ? -1e9 : b.g) - (a.g === null ? -1e9 : a.g); });
  var gRank = {};
  gSorted.forEach(function (r, i) { gRank[r.slug] = i + 1; });

  // expose pure functions for the Node verification check
  window.TIDE = { farmSteps: farmSteps, categoryAction: categoryAction, fmtUsd: fmtUsd, fmtPct: fmtPct, rowObj: rowObj };

  if (typeof document === 'undefined') return; // Node verification harness stops here

  // ---- header + movers ----
  document.getElementById('asOf').textContent = D.asOf;
  document.getElementById('countTracked').textContent = D.tracked;
  document.getElementById('countWatch').textContent = D.watchlist;
  document.getElementById('countRanked').textContent = D.ranked;
  var top = D.topMovers[0];
  document.getElementById('topMover').textContent = top[1] + ' ' + fmtPct(top[2]);
  document.getElementById('moverStrip').innerHTML = D.topMovers.map(function (m) {
    var r = BY_SLUG[m[0]];
    return '<div class="mover' + (m[2] < 0 ? ' neg' : '') + '"><span class="m-name">' + esc(m[1]) + '</span>' +
      '<span class="m-chg">' + fmtPct(m[2]) + '</span><br><span class="m-rank">Rank #' + r.rank + ' · ' + esc(r.category || '—') + '</span></div>';
  }).join('');

  // ---- filters ----
  var cats = Array.from(new Set(ROWS.map(function (r) { return r.category || '—'; }))).sort();
  var chains = Array.from(new Set(ROWS.reduce(function (a, r) { return a.concat(r.chains); }, []))).sort();
  document.getElementById('fCat').innerHTML = '<option value="">All categories</option>' + cats.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
  document.getElementById('fChain').innerHTML = '<option value="">All chains</option>' + chains.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');

  var sortKey = 'rank', sortDir = 1;
  function filtered() {
    var dir = document.getElementById('fDir').value;
    var cat = document.getElementById('fCat').value;
    var ch = document.getElementById('fChain').value;
    var wl = document.getElementById('fWl').checked;
    var q = document.getElementById('fQ').value.trim().toLowerCase();
    return ROWS.filter(function (r) {
      if (dir === 'gainers' && !(r.g !== null && r.g > 0)) return false;
      if (dir === 'losers' && !(r.g !== null && r.g <= 0)) return false;
      if (cat && (r.category || '—') !== cat) return false;
      if (ch && r.chains.indexOf(ch) === -1) return false;
      if (wl && !r.watchlist) return false;
      if (q && r.name.toLowerCase().indexOf(q) === -1 && r.slug.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }
  function sortRows(list) {
    var k = sortKey, d = sortDir;
    return list.slice().sort(function (a, b) {
      var va, vb;
      if (k === 'rank') { va = a.rank; vb = b.rank; }
      else if (k === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (k === 'category') { va = a.category || ''; vb = b.category || ''; }
      else if (k === 'chains') { va = a.chains[0] || ''; vb = b.chains[0] || ''; }
      else if (k === 'tvl') { va = a.tvl; vb = b.tvl; }
      else if (k === 'change') { va = a.g === null ? -1e9 : a.g; vb = b.g === null ? -1e9 : b.g; }
      else if (k === 'score') { va = a.score; vb = b.score; }
      else { va = a.value; vb = b.value; }
      return (va < vb ? -1 : va > vb ? 1 : a.rank - b.rank) * d;
    });
  }
  function renderBoard() {
    var list = sortRows(filtered());
    document.getElementById('rowCount').textContent = list.length + ' of ' + ROWS.length + ' shown';
    document.getElementById('boardBody').innerHTML = list.map(function (r) {
      var chg = r.g === null ? '—' : fmtPct(r.g);
      var cls = r.g === null ? '' : r.g > 0 ? 'up' : 'down';
      var teaser = farmSteps(r)[0];
      return '<tr data-slug="' + esc(r.slug) + '"><td class="num">' + r.rank + '</td>' +
        '<td><b>' + esc(r.name) + '</b>' + (r.watchlist ? '<span class="wl-badge">WATCHLIST</span>' : '') + '</td>' +
        '<td>' + esc(r.category || '—') + '</td><td>' + esc(r.chains.slice(0, 2).join(', ')) + (r.chains.length > 2 ? ' +' + (r.chains.length - 2) : '') + '</td>' +
        '<td class="num">' + fmtUsd(r.tvl) + '</td><td class="num ' + cls + '">' + chg + '</td>' +
        '<td class="num score">' + r.score.toFixed(2) + '</td><td class="num">' + fmtUsd(r.value) + '</td>' +
        '<td class="teaser">' + esc(teaser) + '</td></tr>';
    }).join('');
    document.querySelectorAll('#boardBody tr').forEach(function (tr) {
      tr.addEventListener('click', function () { openDetail(tr.getAttribute('data-slug')); });
    });
  }
  ['fDir', 'fCat', 'fChain', 'fWl', 'fQ'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', renderBoard);
    document.getElementById(id).addEventListener('change', renderBoard);
  });
  document.querySelectorAll('#board th[data-sort]').forEach(function (th) {
    th.addEventListener('click', function () {
      var k = th.getAttribute('data-sort');
      if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = k === 'name' || k === 'category' || k === 'chains' ? 1 : -1; }
      renderBoard();
    });
  });

  // ---- detail ----
  function whyLine(r) {
    var parts = [
      { name: 'velocity', v: r.vel * r.catF }, { name: 'trend', v: r.trend * r.catF },
      { name: 'scale gate', v: r.scale }, { name: 'chain breadth', v: r.chainB }, { name: 'no-token bonus', v: r.nt }
    ].sort(function (a, b) { return b.v - a.v; });
    var topF = parts[0];
    var capped = (r.vel + r.trend) * r.catF > 3.0;
    var catMed = D.catMedians[r.category] !== undefined ? D.catMedians[r.category] : 0;
    return 'Ranks #' + r.rank + ': its 7d change of ' + (r.g === null ? 'not recorded' : fmtPct(r.g)) +
      ' is the ' + ordinal(gRank[r.slug]) + ' fastest on the board; its ' + (r.category || 'uncategorised') +
      ' category has a median 7d change of ' + fmtPct(catMed) + '; momentum score ' + r.score.toFixed(2) +
      ' is led by ' + topF.name + ' (+' + topF.v.toFixed(2) + ')' + (capped ? ', with velocity + trend hitting the 3.00 core cap' : '') +
      '; it records ' + (r.nt > 0 ? 'no token' : 'a token') + ' on ' + fmtUsd(r.tvl) + ' of TVL.';
  }
  function openDetail(slug) {
    var r = BY_SLUG[slug];
    if (!r) return;
    document.querySelectorAll('#boardBody tr').forEach(function (tr) { tr.classList.toggle('sel', tr.getAttribute('data-slug') === slug); });
    var el = document.getElementById('detail');
    el.hidden = false;
    document.getElementById('dName').textContent = '#' + r.rank + ' · ' + r.name + (r.watchlist ? '  ★ watchlist' : '');
    document.getElementById('dSub').textContent = (r.category || 'Uncategorised') + ' · ' + r.chains.join(', ') + ' · listed ' + (r.age === null ? 'date unknown' : r.age + ' days ago');
    var chg = r.g === null ? '—' : fmtPct(r.g);
    var cls = r.g === null ? '' : r.g > 0 ? 'up' : 'down';
    document.getElementById('dMetrics').innerHTML =
      '<div><span class="k">TVL</span><span class="v">' + fmtUsd(r.tvl) + '</span></div>' +
      '<div><span class="k">7d change</span><span class="v ' + cls + '">' + chg + '</span></div>' +
      '<div><span class="k">Momentum score</span><span class="v">' + r.score.toFixed(2) + '</span></div>' +
      '<div><span class="k">Implied value</span><span class="v">' + fmtUsd(r.value) + '</span></div>';
    var rows = [
      ['Velocity — 7d change ' + (r.g === null ? 'not recorded' : fmtPct(r.g)) + ', clamped to −40%…+60%, ÷ 30', r.vel],
      ['Trend persistence — ' + (r.age === null ? 'age unknown' : r.age < 365 ? 'young breakout' : 'confirmed trend'), r.trend],
      ['Category momentum — ' + (r.category || 'none') + ' median ×' + r.catF.toFixed(2), r.catF],
      ['Core (velocity + trend) × category, capped at 3.00', r.core],
      ['Scale gate — log TVL, weak weight', r.scale],
      ['Chain momentum — ' + r.chains.length + ' chain' + (r.chains.length === 1 ? '' : 's'), r.chainB],
      ['No-token bonus', r.nt],
      ['Momentum score', r.score]
    ];
    document.getElementById('dFactors').innerHTML = '<tr><th>Factor</th><th style="text-align:right">Value</th></tr>' +
      rows.map(function (x) { return '<tr><td>' + esc(x[0]) + '</td><td class="num">' + x[1].toFixed(2) + '</td></tr>'; }).join('');
    document.getElementById('dWhy').textContent = whyLine(r);
    document.getElementById('dFarm').innerHTML = farmSteps(r).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
  }
  document.getElementById('detailClose').addEventListener('click', function () {
    document.getElementById('detail').hidden = true;
    document.querySelectorAll('#boardBody tr').forEach(function (tr) { tr.classList.remove('sel'); });
  });

  // ---- charts (inline SVG strings, no network) ----
  function histogram() {
    var W = 560, H = 220, pad = 34, bins = 12, lo = -50, hi = 100;
    var counts = new Array(bins).fill(0);
    ROWS.forEach(function (r) {
      if (r.g === null) return;
      var i = Math.min(bins - 1, Math.floor((Math.max(lo, Math.min(hi, r.g)) - lo) / (hi - lo) * bins));
      counts[i]++;
    });
    var max = Math.max.apply(null, counts);
    var bw = (W - pad * 2) / bins;
    var out = ['<svg viewBox="0 0 ' + W + ' ' + H + '">'];
    counts.forEach(function (c, i) {
      var x = pad + i * bw, h = (H - pad - 20) * c / max;
      var mid = lo + (i + 0.5) * (hi - lo) / bins;
      out.push('<rect x="' + (x + 1).toFixed(1) + '" y="' + (H - 20 - h).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + (mid >= 0 ? '#177245' : '#b3402e') + '" opacity="0.85"/>');
      if (c > 0) out.push('<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 26 - h).toFixed(1) + '" text-anchor="middle" font-size="10" fill="#6f6a5c">' + c + '</text>');
    });
    var zeroX = pad + (0 - lo) / (hi - lo) * (W - pad * 2);
    out.push('<line x1="' + zeroX + '" y1="8" x2="' + zeroX + '" y2="' + (H - 20) + '" stroke="#211d17" stroke-width="1"/>');
    out.push('<line x1="' + pad + '" y1="' + (H - 20) + '" x2="' + (W - pad) + '" y2="' + (H - 20) + '" stroke="#211d17" stroke-width="1"/>');
    [[lo, pad], [0, zeroX], [hi, W - pad]].forEach(function (p) {
      out.push('<text x="' + p[1] + '" y="' + (H - 5) + '" text-anchor="middle" font-size="10" fill="#6f6a5c">' + (p[0] > 0 ? '+' : '') + p[0] + '%</text>');
    });
    out.push('</svg>');
    document.getElementById('hist').innerHTML = out.join('');
  }
  function scatter() {
    var W = 560, H = 220, pad = 34;
    var lMin = Math.log10(5e6), lMax = Math.log10(1.2e11);
    var sMin = Math.min.apply(null, ROWS.map(function (r) { return r.score; }));
    var sMax = Math.max.apply(null, ROWS.map(function (r) { return r.score; }));
    var out = ['<svg viewBox="0 0 ' + W + ' ' + H + '">'];
    ROWS.forEach(function (r) {
      var x = pad + (Math.log10(r.tvl) - lMin) / (lMax - lMin) * (W - pad * 2);
      var y = H - 20 - (r.score - sMin) / (sMax - sMin) * (H - pad - 20);
      out.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r.rank === 1 ? 6 : 3.5) + '" fill="' + (r.g !== null && r.g > 0 ? '#177245' : '#b3402e') + '" opacity="0.75"' + (r.rank === 1 ? ' stroke="#8a6d1b" stroke-width="2"' : '') + '/>');
    });
    out.push('<line x1="' + pad + '" y1="' + (H - 20) + '" x2="' + (W - pad) + '" y2="' + (H - 20) + '" stroke="#211d17" stroke-width="1"/>');
    out.push('<line x1="' + pad + '" y1="8" x2="' + pad + '" y2="' + (H - 20) + '" stroke="#211d17" stroke-width="1"/>');
    [['$5M', pad], ['$100M', pad + (Math.log10(1e8) - lMin) / (lMax - lMin) * (W - pad * 2)], ['$100B', W - pad]].forEach(function (p) {
      out.push('<text x="' + p[1] + '" y="' + (H - 5) + '" text-anchor="middle" font-size="10" fill="#6f6a5c">' + p[0] + '</text>');
    });
    out.push('<text x="' + pad + '" y="14" font-size="10" fill="#6f6a5c">momentum ' + sMax.toFixed(1) + '</text>');
    out.push('</svg>');
    document.getElementById('scatter').innerHTML = out.join('');
  }

  // ---- init: URL params (?detail=slug, ?dir=gainers|losers, ?cat=, ?chain=, ?wl=1, ?q=) ----
  var q = new URLSearchParams(window.location.search);
  if (q.get('dir')) document.getElementById('fDir').value = q.get('dir');
  if (q.get('cat')) document.getElementById('fCat').value = q.get('cat');
  if (q.get('chain')) document.getElementById('fChain').value = q.get('chain');
  if (q.get('wl') === '1') document.getElementById('fWl').checked = true;
  if (q.get('q')) document.getElementById('fQ').value = q.get('q');
  renderBoard();
  histogram();
  scatter();
  if (q.get('detail')) {
    openDetail(q.get('detail'));
    // Detail screenshot mode: hide everything but the detail panel so the whole
    // view (metrics, factor breakdown, why-line, full farm plan) fits the frame
    // with no scrolling — scrolling under virtual time can leave unpainted areas.
    document.body.classList.add('detail-mode');
  }
})();
