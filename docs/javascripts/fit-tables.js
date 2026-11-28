/*
 * 화면보다 넓은 표를 가로 스크롤 없이 보여 준다.
 *
 * 표가 들어갈 자리보다 넓으면 첫 열(이름 열)을 반복해 붙인 여러 개의 좁은 표로
 * 나눠 세로로 늘어놓는다. 마크다운 원본은 건드리지 않는다
 * (scripts/spawn_forecast.py 가 원본 표를 그대로 읽기 때문).
 * 창 크기가 바뀌거나 탭을 전환하면 다시 계산한다.
 */
(function () {
  "use strict";

  var SPLIT_CLASS = "fit-split";

  function cellsOf(row) {
    return Array.prototype.slice.call(row.children);
  }

  // 원본 표에서 [0] + cols 열만 뽑은 새 표를 만든다.
  function buildPart(table, cols) {
    var part = document.createElement("table");
    part.setAttribute("data-fit-part", "");
    ["thead", "tbody"].forEach(function (tag) {
      var src = table.querySelector(tag);
      if (!src) return;
      var dst = document.createElement(tag);
      Array.prototype.forEach.call(src.rows, function (row) {
        var cells = cellsOf(row);
        var tr = document.createElement("tr");
        [0].concat(cols).forEach(function (i) {
          if (cells[i]) tr.appendChild(cells[i].cloneNode(true));
        });
        dst.appendChild(tr);
      });
      part.appendChild(dst);
    });
    return part;
  }

  function overflows(el, width) {
    return el.scrollWidth > width + 1;
  }

  function restore(table) {
    var box = table.parentNode;
    var next = box.nextElementSibling;
    if (next && next.classList.contains(SPLIT_CLASS)) next.remove();
    box.style.display = "";
  }

  function fit(table) {
    // Material 은 표를 div.md-typeset__scrollwrap > div.md-typeset__table 로 감싼다.
    var box = table.closest(".md-typeset__scrollwrap") || table.parentNode;
    restore(table);
    table.removeAttribute("data-fit-wrap");

    var width = box.clientWidth;
    if (!width) return; // 숨은 탭 안의 표: 보일 때 다시 계산
    if (!overflows(box, width) && !overflows(table, table.clientWidth)) return;

    var head = table.rows[0];
    if (!head) return;
    var ncol = cellsOf(head).length;
    if (ncol < 3) {
      table.setAttribute("data-fit-wrap", ""); // 쪼갤 열이 없으면 글자를 줄바꿈
      return;
    }

    var holder = document.createElement("div");
    holder.className = SPLIT_CLASS + " md-typeset__table";
    box.parentNode.insertBefore(holder, box.nextSibling);
    box.style.display = "none";

    function fits(cols) {
      var part = buildPart(table, cols);
      holder.appendChild(part);
      var ok = !overflows(part, holder.clientWidth);
      holder.removeChild(part);
      return ok;
    }

    // 1) 앞에서부터 들어가는 만큼 채워 몇 조각이 필요한지 구한다.
    var groups = [];
    var group = [];
    for (var c = 1; c < ncol; c++) {
      if (group.length && !fits(group.concat(c))) {
        groups.push(group);
        group = [];
      }
      group.push(c);
    }
    groups.push(group);

    // 2) 같은 조각 수로 열을 고르게 나눠 본다 (마지막 조각에 한두 열만 남지 않게).
    var k = groups.length;
    if (k > 1) {
      var even = [];
      var rest = ncol - 1;
      var next = 1;
      for (var g = 0; g < k; g++) {
        var size = Math.ceil(rest / (k - g));
        var cols = [];
        for (var j = 0; j < size; j++) cols.push(next++);
        rest -= size;
        even.push(cols);
      }
      if (even.every(fits)) groups = even;
    }

    groups.forEach(function (cols) {
      var part = buildPart(table, cols);
      holder.appendChild(part);
      // 한 열만 넣어도 넘치는 조각은 글자를 줄바꿈
      if (overflows(part, holder.clientWidth)) part.setAttribute("data-fit-wrap", "");
    });
  }

  function fitAll() {
    document
      .querySelectorAll(".md-content .md-typeset table:not([data-fit-part])")
      .forEach(fit);
  }

  var timer = null;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(fitAll, 100);
  }

  var lastWidth = 0;
  window.addEventListener("resize", function () {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    schedule();
  });
  document.addEventListener("change", function (e) {
    if (e.target.closest && e.target.closest(".tabbed-set")) fitAll();
  });

  // 접혀 있던 <details> 를 펼치면 그 안의 표를 계산 (toggle 은 버블링 안 됨)
  document.addEventListener("toggle", function (e) {
    if (e.target.open) fitAll();
  }, true);

  function start() {
    lastWidth = window.innerWidth;
    fitAll();
  }
  if (window.document$ && window.document$.subscribe) {
    window.document$.subscribe(start);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
