// Parallel coordinates: Verstappen 2023 vs six historically dominant F1 seasons.
// Every metric is normalized to 0-1 (higher = better) so eras with different
// scoring systems and season lengths share a comparable scale.

function drawParallelCoordinates(data) {
  const tooltip = d3.select("#tooltip");
  const svg = d3.select("#parallel-coordinates");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const margin = { top: 98, right: 200, bottom: 42, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const seasons = data.map(d => ({
    label: d.season_label,
    driver: d.driver,
    year: +d.year,
    races: +d.races,
    win_rate: +d.wins / +d.races,
    podium_rate: +d.podiums / +d.races,
    pole_rate: +d.poles / +d.races,
    fastest_lap_rate: +d.fastest_laps / +d.races,
    points_capture: Math.min(1, (+d.points / +d.races) / +d.points_max_per_race),
    reliability: 1 - (+d.dnfs / +d.races)
  }));

  // All dimensions intentionally use the same 0-1 scale so line height has the
  // same meaning on every axis.
  const dimensions = [
    { key: "win_rate",         label: "Win Rate" },
    { key: "podium_rate",      label: "Podium Rate" },
    { key: "pole_rate",        label: "Pole Rate" },
    { key: "fastest_lap_rate", label: "Fastest Lap Rate" },
    { key: "points_capture",   label: "Points Capture" },
    { key: "reliability",      label: "Reliability" }
  ];

  const x = d3.scalePoint()
    .domain(dimensions.map(d => d.key))
    .range([0, innerWidth])
    .padding(0.05);

  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([innerHeight, 0]);

  const color = d3.scaleOrdinal()
    .domain([
      "Verstappen 2023",
      "Hamilton 2020",
      "Vettel 2013",
      "Schumacher 2004",
      "Senna 1988",
      "Clark 1963",
      "Ascari 1952"
    ])
    .range([
      "#ff4d4d",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#a855f7",
      "#14b8a6",
      "#ec4899"
    ]);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", 22)
    .attr("font-weight", "bold")
    .text("Verstappen 2023 vs Historically Dominant F1 Seasons");

  dimensions.forEach(dim => {
    const axisG = g.append("g")
      .attr("transform", `translate(${x(dim.key)},0)`);

    axisG.call(
      d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%"))
    );

    axisG.selectAll(".tick").each(function() {
      // Tick labels sit on top of multiple colored lines, so each label gets a
      // small dark backing box for readability.
      const tick = d3.select(this);
      const text = tick.select("text");
      const value = text.text();

      text.remove();

      tick.append("rect")
        .attr("x", -44)
        .attr("y", -9)
        .attr("width", 34)
        .attr("height", 18)
        .attr("rx", 3)
        .attr("fill", "#0f141b")
        .attr("opacity", 0.92);

      tick.append("text")
        .attr("x", -12)
        .attr("dy", "0.32em")
        .attr("text-anchor", "end")
        .attr("fill", "#cdd6df")
        .attr("font-size", 11)
        .attr("font-weight", "600")
        .text(value);
    });
    axisG.selectAll(".domain, .tick line").attr("stroke", "#5c6777");

    axisG.append("text")
      .attr("y", -24)
      .attr("text-anchor", "middle")
      .attr("fill", "#dbe4ee")
      .attr("font-size", 11)
      .attr("font-weight", "600")
      .text(dim.label);
  });

  const line = d3.line()
    .x(d => x(d.dim))
    .y(d => y(d.value));

  function seasonPath(season) {
    return dimensions.map(d => ({ dim: d.key, value: season[d.key] }));
  }

  let legendRows = null;
  const focusSet = new Set();

  function isFocused(label) {
    return focusSet.size === 0 || focusSet.has(label);
  }

  function baseOpacity(label) {
    if (focusSet.size > 0) return focusSet.has(label) ? 1 : 0.1;
    return label === "Verstappen 2023" ? 1 : 0.7;
  }

  function baseStrokeWidth(label) {
    if (focusSet.size > 0) return focusSet.has(label) ? 4 : 2;
    return label === "Verstappen 2023" ? 4 : 2.5;
  }

  function legendFill(label) {
    if (focusSet.has(label)) return color(label);
    return label === "Verstappen 2023" && focusSet.size === 0 ? "#ff4d4d" : "#dbe4ee";
  }

  function legendWeight(label) {
    if (focusSet.has(label)) return "700";
    return label === "Verstappen 2023" && focusSet.size === 0 ? "700" : "400";
  }

  function applyFocus(hoverLabel = null) {
    // Focus buttons can select several seasons; hover temporarily elevates one
    // selected or unselected season without losing the current focus set.
    g.selectAll(".season-path")
      .attr("opacity", p => hoverLabel
        ? (p.label === hoverLabel ? 1 : isFocused(p.label) ? 0.32 : 0.08)
        : baseOpacity(p.label))
      .attr("stroke-width", p => hoverLabel
        ? (p.label === hoverLabel ? 4.5 : isFocused(p.label) ? 3 : 2)
        : baseStrokeWidth(p.label));

    if (!legendRows) return;

    legendRows
      .attr("opacity", p => hoverLabel
        ? (p.label === hoverLabel ? 1 : isFocused(p.label) ? 0.55 : 0.22)
        : baseOpacity(p.label))
      .select(".legend-swatch")
      .attr("height", p => (hoverLabel === p.label || focusSet.has(p.label)) ? 8 : 4)
      .attr("y", p => (hoverLabel === p.label || focusSet.has(p.label)) ? 4 : 6);

    legendRows.select(".legend-label")
      .attr("fill", p => hoverLabel === p.label ? color(p.label) : legendFill(p.label))
      .attr("font-weight", p => hoverLabel === p.label ? "700" : legendWeight(p.label));
  }

  function updateFocusButtons() {
    const picker = document.getElementById("parallel-focus");
    if (!picker) return;

    picker.querySelectorAll("button[data-value]").forEach(btn => {
      btn.classList.toggle("active", focusSet.has(btn.dataset.value));
    });
  }

  function setHighlight(label) {
    applyFocus(label);
  }

  function clearHighlight() {
    applyFocus();
  }

  function toggleFocus(label) {
    if (focusSet.has(label)) focusSet.delete(label);
    else focusSet.add(label);
    updateFocusButtons();
    applyFocus();
  }

  // Draw non-Verstappen lines first so the Verstappen line renders on top
  const ordered = seasons.slice().sort((a, b) =>
    a.label === "Verstappen 2023" ? 1 : b.label === "Verstappen 2023" ? -1 : 0
  );

  g.selectAll(".season-path")
    .data(ordered)
    .join("path")
    .attr("class", "season-path")
    .attr("d", d => line(seasonPath(d)))
    .attr("fill", "none")
    .attr("stroke", d => color(d.label))
    .attr("stroke-width", d => d.label === "Verstappen 2023" ? 4 : 2.5)
    .attr("opacity", d => d.label === "Verstappen 2023" ? 1 : 0.7)
    .style("cursor", "pointer")
    .on("click", function(event, d) {
      toggleFocus(d.label);
    })
    .on("mouseover", function(event, d) {
      setHighlight(d.label);

      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.label}</strong><br>
          ${d.races} races<br>
          Win Rate: ${(d.win_rate * 100).toFixed(1)}%<br>
          Podium Rate: ${(d.podium_rate * 100).toFixed(1)}%<br>
          Pole Rate: ${(d.pole_rate * 100).toFixed(1)}%<br>
          Fastest Lap Rate: ${(d.fastest_lap_rate * 100).toFixed(1)}%<br>
          Points Capture: ${(d.points_capture * 100).toFixed(1)}%<br>
          Reliability: ${(d.reliability * 100).toFixed(1)}%
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
      clearHighlight();
      tooltip.style("opacity", 0);
    });

  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 30},${margin.top})`);

  legend.append("text")
    .attr("y", -8)
    .attr("fill", "#dbe4ee")
    .attr("font-size", 12)
    .attr("font-weight", "600")
    .text("Season");

  const legendData = seasons
    .slice()
    .sort((a, b) => b.win_rate - a.win_rate);

  legendRows = legend.selectAll(".legend-row")
    .data(legendData)
    .join("g")
    .attr("class", "legend-row")
    .attr("transform", (s, i) => `translate(0, ${i * 26 + 8})`)
    .style("cursor", "pointer")
    .on("click", function(event, s) {
      toggleFocus(s.label);
    })
    .on("mouseover", function(event, s) {
      setHighlight(s.label);
    })
    .on("mouseout", function() {
      clearHighlight();
    });

  legendRows.append("rect")
    .attr("class", "legend-hitbox")
    .attr("x", -8)
    .attr("y", -4)
    .attr("width", 165)
    .attr("height", 22)
    .attr("fill", "transparent");

  legendRows.append("rect")
    .attr("class", "legend-swatch")
    .attr("width", 18)
    .attr("height", 4)
    .attr("y", 6)
    .attr("fill", s => color(s.label));

  legendRows.append("text")
    .attr("class", "legend-label")
    .attr("x", 26)
    .attr("y", 12)
    .attr("fill", s => s.label === "Verstappen 2023" ? "#ff4d4d" : "#dbe4ee")
    .attr("font-size", 13)
    .attr("font-weight", s => s.label === "Verstappen 2023" ? "700" : "400")
    .text(s => s.label);

  const picker = document.getElementById("parallel-focus");
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
