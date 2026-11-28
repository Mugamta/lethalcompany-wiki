// 시간대별 기대 스폰 그래프. 데이터: spawn-forecast-data.js (scripts/spawn_forecast.py)
(function () {
  "use strict";

  var SVG = "http://www.w3.org/2000/svg";
  var KINDS = [
    { key: "inside", title: "실내", eclipse: true },
    { key: "outside", title: "외부(야간)", eclipse: true },
    { key: "daytime", title: "주간", eclipse: false },
  ];
  var DEADLINES = [
    { v: 3, label: "D-3 (첫날)" },
    { v: 2, label: "D-2" },
    { v: 1, label: "D-1" },
    { v: 0, label: "D-0 (마감날)" },
  ];

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function svg(tag, attrs) {
    var e = document.createElementNS(SVG, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function fmt(x) {
    return x >= 10 ? x.toFixed(1) : x.toFixed(2);
  }
  function hourLabel(h) {
    return (h < 10 ? "0" : "") + h + "시";
  }
  // 눈금 간격: 1·2·5 계열로 3~5칸
  function niceStep(v) {
    if (v <= 0) return 1;
    var raw = v / 4, p = Math.pow(10, Math.floor(Math.log10(raw)));
    var steps = [1, 2, 5, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * p >= raw) return steps[i] * p;
    return 10 * p;
  }

  function select(label, options, value, onChange) {
    var wrap = el("label", { class: "sf-control" });
    wrap.appendChild(el("span", { class: "sf-control-label" }, label));
    var s = el("select");
    options.forEach(function (o) {
      var opt = el("option", { value: String(o.v) }, o.label);
      if (String(o.v) === String(value)) opt.selected = true;
      s.appendChild(opt);
    });
    s.addEventListener("change", function () { onChange(s.value); });
    wrap.appendChild(s);
    return wrap;
  }

  // ---------------------------------------------------------------- 선 그래프
  function lineChart(card, kind, series, tooltip) {
    var W = 360, H = 220, m = { l: 34, r: 74, t: 12, b: 26 };
    var hours = series[0].data.hours;
    var all = [];
    series.forEach(function (s) { all = all.concat(s.data.total); });
    var step = niceStep(Math.max.apply(null, all));
    var ticks = Math.max(1, Math.ceil(Math.max.apply(null, all) / step - 1e-9));
    var yMax = step * ticks;
    var x = function (i) { return m.l + (W - m.l - m.r) * (hours.length === 1 ? 0.5 : i / (hours.length - 1)); };
    var y = function (v) { return m.t + (H - m.t - m.b) * (1 - v / yMax); };

    var root = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sf-svg", role: "img",
      "aria-label": kind.title + " 누적 기대 마릿수" });

    // 격자·축
    for (var g = 0; g <= ticks; g++) {
      var v = step * g, yy = y(v);
      root.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: yy, y2: yy, class: g === 0 ? "sf-axis" : "sf-gridline" }));
      var t = svg("text", { x: m.l - 6, y: yy + 3.5, class: "sf-tick", "text-anchor": "end" });
      t.textContent = (Math.round(v * 10) / 10).toString();
      root.appendChild(t);
    }
    hours.forEach(function (h, i) {
      if (hours.length > 6 && i % 2 === 1) return;
      var t = svg("text", { x: x(i), y: H - 8, class: "sf-tick", "text-anchor": "middle" });
      t.textContent = hourLabel(h);
      root.appendChild(t);
    });

    // 선·점
    var ends = [];
    series.forEach(function (s) {
      var d = s.data.total.map(function (v, i) { return (i ? "L" : "M") + x(i) + "," + y(v); }).join("");
      root.appendChild(svg("path", { d: d, class: "sf-line " + s.cls }));
      s.data.total.forEach(function (v, i) {
        root.appendChild(svg("circle", { cx: x(i), cy: y(v), r: 4, class: "sf-dot " + s.cls }));
      });
      var last = s.data.total[s.data.total.length - 1];
      ends.push({ y: y(last), v: last, s: s });
    });
    // 끝 라벨: 겹치면 벌림
    ends.sort(function (a, b) { return a.y - b.y; });
    for (var i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
    ends.forEach(function (e) {
      var t = svg("text", { x: W - m.r + 8, y: e.y + 4, class: "sf-endlabel" });
      t.textContent = e.s.short + " " + fmt(e.v);
      root.appendChild(t);
    });

    // 십자선·툴팁
    var cross = svg("line", { y1: m.t, y2: H - m.b, class: "sf-cross", visibility: "hidden" });
    root.appendChild(cross);
    var hit = svg("rect", { x: m.l - 10, y: 0, width: W - m.l - m.r + 20, height: H, fill: "transparent", tabindex: "0" });
    root.appendChild(hit);

    function show(i, evt) {
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
      cross.setAttribute("visibility", "visible");
      tooltip.textContent = "";
      tooltip.appendChild(el("div", { class: "sf-tip-title" }, kind.title + " · " + hourLabel(hours[i]) + " 배치까지"));
      series.forEach(function (s) {
        var row = el("div", { class: "sf-tip-row" });
        row.appendChild(el("span", { class: "sf-tip-key " + s.cls }));
        row.appendChild(el("strong", null, fmt(s.data.total[i]) + "마리"));
        var add = s.data.total[i] - (i ? s.data.total[i - 1] : 0);
        row.appendChild(el("span", { class: "sf-tip-sub" }, s.name + " (이번 배치 +" + fmt(add) + ")"));
        tooltip.appendChild(row);
      });
      tooltip.hidden = false;
      var box = card.getBoundingClientRect();
      var px = evt && evt.clientX != null ? evt.clientX - box.left : x(i) / W * box.width;
      tooltip.style.left = Math.min(Math.max(px + 12, 0), box.width - tooltip.offsetWidth) + "px";
      tooltip.style.top = "36px";
    }
    function nearest(evt) {
      var r = root.getBoundingClientRect();
      var sx = (evt.clientX - r.left) / r.width * W;
      var best = 0;
      for (var i = 1; i < hours.length; i++) if (Math.abs(x(i) - sx) < Math.abs(x(best) - sx)) best = i;
      return best;
    }
    var focusIdx = hours.length - 1;
    hit.addEventListener("pointermove", function (e) { show(nearest(e), e); });
    hit.addEventListener("pointerleave", function () { cross.setAttribute("visibility", "hidden"); tooltip.hidden = true; });
    hit.addEventListener("focus", function () { show(focusIdx); });
    hit.addEventListener("blur", function () { cross.setAttribute("visibility", "hidden"); tooltip.hidden = true; });
    hit.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") focusIdx = Math.max(0, focusIdx - 1);
      else if (e.key === "ArrowRight") focusIdx = Math.min(hours.length - 1, focusIdx + 1);
      else return;
      e.preventDefault(); show(focusIdx);
    });
    return root;
  }

  // ---------------------------------------------------------------- 본체
  function render(container, D) {
    var state = { moon: D.moons[0].slug, deadline: 3, tableWeather: "normal", tableValue: "chance" };
    try {
      var saved = JSON.parse(localStorage.getItem("sf-state") || "null");
      if (saved) for (var k in saved) if (k in state) state[k] = saved[k];
    } catch (e) { /* 무시 */ }
    if (!D.moons.some(function (m) { return m.slug === state.moon; })) state.moon = D.moons[0].slug;

    function update() {
      try { localStorage.setItem("sf-state", JSON.stringify(state)); } catch (e) { /* 무시 */ }
      draw();
    }

    function draw() {
      var moon = D.moons.filter(function (m) { return m.slug === state.moon; })[0];
      var normal = moon.conditions["normal-" + state.deadline];
      var eclipse = moon.conditions["eclipse-" + state.deadline];
      container.textContent = "";

      // 필터 한 줄
      var bar = el("div", { class: "sf-filters" });
      bar.appendChild(select("위성", D.moons.map(function (m) { return { v: m.slug, label: m.name }; }), state.moon,
        function (v) { state.moon = v; update(); }));
      bar.appendChild(select("마감", DEADLINES, state.deadline, function (v) { state.deadline = +v; update(); }));
      container.appendChild(bar);

      // 요약
      var sum = el("p", { class: "sf-summary" });
      var parts = [];
      KINDS.forEach(function (k) {
        var n = normal[k.key], e = eclipse[k.key];
        if (!n) return;
        var s = k.title + " " + fmt(n.total[n.total.length - 1]) + "마리";
        if (k.eclipse) s += " (일식 " + fmt(e.total[e.total.length - 1]) + ")";
        parts.push(s);
      });
      sum.textContent = "하루 끝까지 기대 마릿수: " + (parts.length ? parts.join(" · ") : "스폰 없음");
      container.appendChild(sum);
      var notes = [];
      notes.push("일식 최소 스폰 " + (moon.eclipseMin != null ? moon.eclipseMin + "마리" : "없음") +
        " · 최대 파워 실내 " + moon.maxPower[0] + " / 외부 " + moon.maxPower[1] + " / 주간 " + moon.maxPower[2]);
      if (moon.diversityLimited) notes.push("이 위성은 다양성 제한이 있어 실제로는 그래프보다 종류가 덜 섞이고 조금 적게 나올 수 있습니다.");
      notes.forEach(function (n) { container.appendChild(el("p", { class: "sf-note" }, n)); });

      // 범례 (2개 이상 계열)
      var legend = el("div", { class: "sf-legend" });
      [["sf-s1", "일식 아님 (맑음·비·뇌우·안개·홍수)"], ["sf-s2", "일식"]].forEach(function (p) {
        var it = el("span", { class: "sf-legend-item" });
        it.appendChild(el("span", { class: "sf-legend-key " + p[0] }));
        it.appendChild(document.createTextNode(p[1]));
        legend.appendChild(it);
      });
      container.appendChild(legend);

      // 작은 그래프 셋
      var grid = el("div", { class: "sf-grid" });
      KINDS.forEach(function (k) {
        var card = el("div", { class: "sf-card" });
        card.appendChild(el("div", { class: "sf-card-title" }, k.title + " · 누적 기대 마릿수"));
        var n = normal[k.key];
        if (!n) {
          card.appendChild(el("p", { class: "sf-empty" }, "이 위성에는 " + k.title + " 몬스터가 없습니다."));
        } else {
          var series = k.eclipse
            ? [{ data: n, cls: "sf-s1", name: "일식 아님", short: "평소" },
               { data: eclipse[k.key], cls: "sf-s2", name: "일식", short: "일식" }]
            : [{ data: n, cls: "sf-s1", name: "모든 날씨", short: "전체" }];
          var tip = el("div", { class: "sf-tip", role: "status" });
          tip.hidden = true;
          card.appendChild(lineChart(card, k, series, tip));
          card.appendChild(tip);
          if (!k.eclipse) card.appendChild(el("p", { class: "sf-card-note" }, "주간 스폰은 날씨·마감과 관계없습니다."));
        }
        grid.appendChild(card);
      });
      container.appendChild(grid);

      // 몬스터별 표
      container.appendChild(el("h3", { class: "sf-table-title" }, "몬스터별"));
      var bar2 = el("div", { class: "sf-filters" });
      bar2.appendChild(select("날씨", [{ v: "normal", label: "일식 아님" }, { v: "eclipse", label: "일식" }],
        state.tableWeather, function (v) { state.tableWeather = v; update(); }));
      bar2.appendChild(select("값", [{ v: "chance", label: "이미 나왔을 확률" }, { v: "expected", label: "기대 마릿수" }],
        state.tableValue, function (v) { state.tableValue = v; update(); }));
      container.appendChild(bar2);
      container.appendChild(table(moon.conditions[state.tableWeather + "-" + state.deadline], state.tableValue));
    }

    update();
  }

  function table(cond, mode) {
    var hours = [6, 8, 10, 12, 14, 16, 18, 20, 22];
    var wrap = el("div", { class: "sf-table-wrap" });
    var t = el("table", { class: "sf-table" });
    var thead = el("thead"), tr = el("tr");
    tr.appendChild(el("th", null, "몬스터"));
    hours.forEach(function (h) { tr.appendChild(el("th", null, hourLabel(h))); });
    thead.appendChild(tr); t.appendChild(thead);
    var tbody = el("tbody");
    var maxExp = 0;
    KINDS.forEach(function (k) {
      if (cond[k.key]) cond[k.key].monsters.forEach(function (mm) { maxExp = Math.max(maxExp, Math.max.apply(null, mm.expected)); });
    });
    KINDS.forEach(function (k) {
      var c = cond[k.key];
      if (!c) return;
      var g = el("tr", { class: "sf-group" });
      g.appendChild(el("th", { colspan: String(hours.length + 1) }, k.title));
      tbody.appendChild(g);
      var rows = c.monsters.slice().sort(function (a, b) {
        return b.expected[b.expected.length - 1] - a.expected[a.expected.length - 1];
      });
      rows.forEach(function (mm) {
        var r = el("tr");
        r.appendChild(el("td", { class: "sf-name" }, mm.name));
        hours.forEach(function (h) {
          var i = c.hours.indexOf(h);
          if (i < 0) { r.appendChild(el("td", { class: "sf-cell sf-na" }, "—")); return; }
          var v = mode === "chance" ? mm.chance[i] : mm.expected[i];
          var level = mode === "chance" ? v : (maxExp ? v / maxExp : 0);
          var td = el("td", { class: "sf-cell", title: mm.name + " · " + hourLabel(h) + " 배치까지" },
            mode === "chance" ? Math.round(v * 100) + "%" : fmt(v));
          td.style.setProperty("--sf-level", level.toFixed(3));
          if (level > 0.55) td.classList.add("sf-strong");
          r.appendChild(td);
        });
        tbody.appendChild(r);
      });
    });
    t.appendChild(tbody);
    wrap.appendChild(t);
    return wrap;
  }

  function init() {
    var c = document.getElementById("spawn-forecast");
    if (!c || !window.SPAWN_FORECAST) return;
    render(c, window.SPAWN_FORECAST);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
