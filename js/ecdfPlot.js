// Percentile dominance curve: for each athlete, convert every event result to
// a sport-relative percentile, then show how often they cleared each threshold.

function drawEcdfPlot(ecdfData) {
  const tooltip = d3.select("#tooltip");

  const athletes = ecdfData.map(d => ({
    name: d.name,
    sport: d.sport,
    season: d.season,
    events: +d.events,
    fieldSize: +d.field_size,
    metric: d.metric,
    positions: d.positions.split(",").map(position => +position.trim()),
    color: d.color,
    highlight: d.highlight === "true"
  }));

  function dominancePercentile(position, fieldSize) {
    return 1 - ((position - 1) / (fieldSize - 1));
  }

  function percentileSeries(athlete) {
    return athlete.positions.map(position =>
      dominancePercentile(position, athlete.fieldSize)
    );
  }

  function shareAtOrAbove(values, threshold) {
    return values.filter(value => value >= threshold - 1e-9).length / values.length;
  }

  function curvePoints(athlete) {
    const values = percentileSeries(athlete);
    const thresholds = d3.range(0.75, 1.0001, 0.01);
    return thresholds.map(threshold => ({
      threshold,
      share: shareAtOrAbove(values, threshold)
    }));
  }

  function thresholdShare(athlete, threshold) {
    return shareAtOrAbove(percentileSeries(athlete), threshold);
  }

  function benchmarkShare(threshold) {
    // A soft "typical elite" reference curve. This is an interpretive baseline,
    // not a measured athlete, so it stays gray and visually secondary.
    const anchors = [
      { threshold: 0.75, share: 0.92 },
      { threshold: 0.80, share: 0.78 },
      { threshold: 0.85, share: 0.58 },
      { threshold: 0.90, share: 0.36 },
      { threshold: 0.95, share: 0.18 },
      { threshold: 1.00, share: 0.06 }
    ];

    const upper = anchors.find(d => d.threshold >= threshold);
    const lower = anchors.slice().reverse().find(d => d.threshold <= threshold);
    if (!lower) return anchors[0].share;
    if (!upper) return anchors[anchors.length - 1].share;
    if (lower.threshold === upper.threshold) return lower.share;

    const t = (threshold - lower.threshold) / (upper.threshold - lower.threshold);
    return lower.share + t * (upper.share - lower.share);
  }

  function benchmarkPoints() {
    return d3.range(0.75, 1.0001, 0.01).map(threshold => {
      const center = benchmarkShare(threshold);
      const spread = threshold >= 0.95 ? 0.06 : 0.09;
      return {
        threshold,
        center,
        lower: Math.max(0, center - spread),
        upper: Math.min(1, center + spread)
      };
    });
  }

  const svg = d3.select("#ecdf-plot");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const margin = { top: 86, right: 270, bottom: 82, left: 86 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 28)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", 21)
    .attr("font-weight", "bold")
    .text("Percentile-Based Dominance Across Sports");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .attr("fill", "#94a3b8")
    .attr("font-size", 11)
    .text("Each event is converted to a 0-1 sport-relative percentile before comparison");

  const x = d3.scaleLinear()
    .domain([0.75, 1])
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([innerHeight, 0]);

  g.append("g").attr("class", "v-grid")
    .selectAll("line")
    .data([0.8, 0.85, 0.9, 0.95, 1])
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", "#1e2937")
    .attr("stroke-dasharray", "2 5");

  g.append("g").attr("class", "h-grid")
    .selectAll("line")
    .data([0.25, 0.5, 0.75, 1])
    .join("line")
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("stroke", "#1e2937")
    .attr("stroke-dasharray", "2 5");

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(
      d3.axisBottom(x)
        .tickValues([0.75, 0.8, 0.85, 0.9, 0.95, 1])
        .tickFormat(d3.format(".0%"))
        .tickSize(6)
    )
    .call(axis => {
      axis.selectAll("text").attr("fill", "#cdd6df").attr("font-size", 11);
      axis.selectAll(".domain, .tick line").attr("stroke", "#5c6777");
    });

  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")))
    .call(axis => {
      axis.selectAll("text").attr("fill", "#cdd6df").attr("font-size", 11);
      axis.selectAll(".domain, .tick line").attr("stroke", "#5c6777");
    });

  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 46)
    .attr("text-anchor", "middle")
    .attr("fill", "#dbe4ee")
    .attr("font-size", 13)
    .attr("font-weight", "600")
    .text("Dominance percentile threshold");

  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 64)
    .attr("text-anchor", "middle")
    .attr("fill", "#8b95a3")
    .attr("font-size", 11)
    .attr("font-style", "italic")
    .text("1.00 = best performer in the event field");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -58)
    .attr("text-anchor", "middle")
    .attr("fill", "#dbe4ee")
    .attr("font-size", 13)
    .text("Share of events at or above threshold");

  g.append("g").attr("class", "threshold-tags")
    .selectAll("text")
    .data([
      { threshold: 0.9, label: "Top 10%" },
      { threshold: 0.95, label: "Top 5%" },
      { threshold: 1, label: "Best" }
    ])
    .join("text")
    .attr("x", d => x(d.threshold))
    .attr("y", -8)
    .attr("text-anchor", "middle")
    .attr("fill", "#94a3b8")
    .attr("font-size", 10)
    .attr("letter-spacing", "0.5px")
    .text(d => d.label.toUpperCase());

  const line = d3.line()
    .x(d => x(d.threshold))
    .y(d => y(d.share))
    .curve(d3.curveStepAfter);

  const benchmarkLine = d3.line()
    .x(d => x(d.threshold))
    .y(d => y(d.center))
    .curve(d3.curveStepAfter);

  const benchmarkArea = d3.area()
    .x(d => x(d.threshold))
    .y0(d => y(d.lower))
    .y1(d => y(d.upper))
    .curve(d3.curveStepAfter);

  const ordered = athletes.slice().sort((a, b) =>
    a.highlight ? 1 : b.highlight ? -1 : 0
  );

  const benchmark = benchmarkPoints();

  // Draw the benchmark first so all athlete curves remain visually dominant.
  g.append("path")
    .datum(benchmark)
    .attr("class", "benchmark-band")
    .attr("d", benchmarkArea)
    .attr("fill", "#94a3b8")
    .attr("opacity", 0.13)
    .attr("pointer-events", "none");

  g.append("path")
    .datum(benchmark)
    .attr("class", "benchmark-line")
    .attr("d", benchmarkLine)
    .attr("fill", "none")
    .attr("stroke", "#94a3b8")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "5 5")
    .attr("opacity", 0.55)
    .attr("pointer-events", "none");

  let legendRows = null;
  const focusSet = new Set();

  function isFocused(name) {
    return focusSet.size === 0 || focusSet.has(name);
  }

  function baseOpacity(name, highlight) {
    if (focusSet.size > 0) return focusSet.has(name) ? 1 : 0.1;
    return highlight ? 1 : 0.8;
  }

  function baseStrokeWidth(name, highlight) {
    if (focusSet.size > 0) return focusSet.has(name) ? 4 : 2;
    return highlight ? 4 : 2.5;
  }

  function legendFill(athlete) {
    if (focusSet.has(athlete.name)) return athlete.color;
    return athlete.highlight && focusSet.size === 0 ? "#ff4d4d" : "#dbe4ee";
  }

  function legendWeight(athlete) {
    if (focusSet.has(athlete.name)) return "700";
    return athlete.highlight && focusSet.size === 0 ? "700" : "500";
  }

  function applyFocus(hoverName = null) {
    // The ECDF and legend share one focus state: clicking athlete buttons or
    // legend rows keeps selected curves vivid while dimming the rest.
    g.selectAll(".ecdf-path")
      .attr("opacity", p => hoverName
        ? (p.name === hoverName ? 1 : isFocused(p.name) ? 0.32 : 0.08)
        : baseOpacity(p.name, p.highlight))
      .attr("stroke-width", p => hoverName
        ? (p.name === hoverName ? 4.5 : isFocused(p.name) ? 3 : 2)
        : baseStrokeWidth(p.name, p.highlight));

    g.selectAll(".threshold-dot")
      .attr("opacity", p => hoverName
        ? (p.name === hoverName ? 1 : isFocused(p.name) ? 0.45 : 0.1)
        : baseOpacity(p.name, p.highlight))
      .attr("r", p => (hoverName === p.name || focusSet.has(p.name)) ? 5 : p.highlight ? 4.5 : 3.5);

    if (!legendRows) return;

    legendRows
      .attr("opacity", p => hoverName
        ? (p.name === hoverName ? 1 : isFocused(p.name) ? 0.55 : 0.22)
        : baseOpacity(p.name, p.highlight))
      .select(".legend-swatch")
      .attr("height", p => (hoverName === p.name || focusSet.has(p.name)) ? 8 : 4)
      .attr("y", p => (hoverName === p.name || focusSet.has(p.name)) ? 4 : 6);

    legendRows.select(".legend-label")
      .attr("fill", p => hoverName === p.name ? p.color : legendFill(p))
      .attr("font-weight", p => hoverName === p.name ? "700" : legendWeight(p));
  }

  function updateFocusButtons() {
    const picker = document.getElementById("ecdf-focus");
    if (!picker) return;

    picker.querySelectorAll("button[data-value]").forEach(btn => {
      btn.classList.toggle("active", focusSet.has(btn.dataset.value));
    });
  }

  function toggleFocus(name) {
    if (focusSet.has(name)) focusSet.delete(name);
    else focusSet.add(name);
    updateFocusButtons();
    applyFocus();
  }

  g.selectAll(".ecdf-path")
    .data(ordered)
    .join("path")
    .attr("class", "ecdf-path")
    .attr("d", d => line(curvePoints(d)))
    .attr("fill", "none")
    .attr("stroke", d => d.color)
    .attr("stroke-width", d => d.highlight ? 4 : 2.5)
    .attr("opacity", d => d.highlight ? 1 : 0.8)
    .style("cursor", "pointer")
    .on("click", function(event, d) {
      toggleFocus(d.name);
    })
    .on("mouseover", function(event, d) {
      applyFocus(d.name);

      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.name}</strong><br>
          Sport: ${d.sport}<br>
          Metric: ${d.metric}<br>
          Events: ${d.events}<br>
          Top 10% field: ${(thresholdShare(d, 0.9) * 100).toFixed(1)}%<br>
          Top 5% field: ${(thresholdShare(d, 0.95) * 100).toFixed(1)}%<br>
          Best in field: ${(thresholdShare(d, 1) * 100).toFixed(1)}%
        `)
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", function() {
      applyFocus();
      tooltip.style("opacity", 0);
    });

  g.selectAll(".threshold-dot")
    .data(ordered)
    .join("circle")
    .attr("class", "threshold-dot")
    .attr("cx", x(1))
    .attr("cy", d => y(thresholdShare(d, 1)))
    .attr("r", d => d.highlight ? 4.5 : 3.5)
    .attr("fill", d => d.color)
    .attr("stroke", "#0d1218")
    .attr("stroke-width", 1.5);

  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 30}, ${margin.top})`);

  legend.append("text")
    .attr("y", -8)
    .attr("fill", "#dbe4ee")
    .attr("font-size", 12)
    .attr("font-weight", "600")
    .text("Athlete · Season");

  const benchmarkLegend = legend.append("g")
    .attr("transform", "translate(0, 8)");

  benchmarkLegend.append("rect")
    .attr("width", 18)
    .attr("height", 8)
    .attr("y", 2)
    .attr("fill", "#94a3b8")
    .attr("opacity", 0.18);

  benchmarkLegend.append("line")
    .attr("x1", 0)
    .attr("x2", 18)
    .attr("y1", 6)
    .attr("y2", 6)
    .attr("stroke", "#94a3b8")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4 3")
    .attr("opacity", 0.7);

  benchmarkLegend.append("text")
    .attr("x", 26)
    .attr("y", 10)
    .attr("fill", "#94a3b8")
    .attr("font-size", 12)
    .attr("font-weight", "600")
    .text("Typical elite benchmark");

  legendRows = legend.selectAll(".legend-row")
    .data(athletes)
    .join("g")
    .attr("class", "legend-row")
    .attr("transform", (a, i) => `translate(0, ${i * 34 + 42})`)
    .style("cursor", "pointer")
    .on("click", function(event, a) {
      toggleFocus(a.name);
    })
    .on("mouseover", function(event, a) {
      applyFocus(a.name);
    })
    .on("mouseout", function() {
      applyFocus();
    });

  legendRows.append("rect")
    .attr("class", "legend-hitbox")
    .attr("x", -8)
    .attr("y", -4)
    .attr("width", 225)
    .attr("height", 30)
    .attr("fill", "transparent");

  legendRows.append("rect")
    .attr("class", "legend-swatch")
    .attr("width", 18)
    .attr("height", 4)
    .attr("y", 6)
    .attr("fill", a => a.color);

  legendRows.append("text")
    .attr("class", "legend-label")
    .attr("x", 26)
    .attr("y", 12)
    .attr("fill", a => a.highlight ? "#ff4d4d" : "#dbe4ee")
    .attr("font-size", 12)
    .attr("font-weight", a => a.highlight ? "700" : "500")
    .text(a => a.name);

  legendRows.append("text")
    .attr("x", 26)
    .attr("y", 26)
    .attr("fill", "#8b95a3")
    .attr("font-size", 10)
    .text(a => `${a.sport} · top 5% in ${(thresholdShare(a, 0.95) * 100).toFixed(0)}%`);

  const picker = document.getElementById("ecdf-focus");
  if (picker) {
    picker.querySelectorAll("button[data-value]").forEach(btn => {
      btn.addEventListener("click", () => toggleFocus(btn.dataset.value));
    });

    const clearBtn = picker.querySelector("button[data-action='clear']");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        focusSet.clear();
        updateFocusButtons();
        applyFocus();
      });
    }
  }

  applyFocus();
}
