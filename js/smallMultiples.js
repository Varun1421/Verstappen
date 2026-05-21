// 2x6 small multiples grid: Verstappen vs Pérez across six metrics.

function drawSmallMultiples(data) {
  const tooltip = d3.select("#tooltip");

  const metrics = [
    { key: "cumulative_points",       label: "Cumulative Points",         maxSvg: "#max-cumulative-points",       perezSvg: "#perez-cumulative-points" },
    { key: "cumulative_fastest_laps", label: "Cumulative Fastest Laps",   maxSvg: "#max-cumulative-fastest-laps", perezSvg: "#perez-cumulative-fastest-laps" },
    { key: "cumulative_podiums",      label: "Cumulative Podiums",        maxSvg: "#max-cumulative-podiums",      perezSvg: "#perez-cumulative-podiums" },
    { key: "cumulative_wins",         label: "Cumulative Wins",           maxSvg: "#max-cumulative-wins",         perezSvg: "#perez-cumulative-wins" },
    { key: "cumulative_poles",        label: "Cumulative Pole Positions", maxSvg: "#max-cumulative-poles",        perezSvg: "#perez-cumulative-poles" },
    { key: "points_per_race",         label: "Points Per Race",           maxSvg: "#max-points-per-race",         perezSvg: "#perez-points-per-race" }
  ];

  const drivers = [
    { name: "Max Verstappen", color: "#ff4d4d" },
    { name: "Sergio Perez",   color: "#3b82f6" }
  ];

  function formatValue(value) {
    return Number.isInteger(value) ? value : value.toFixed(1);
  }

  function rowFor(driverName, round) {
    return data.find(d => d.driver === driverName && d.race_round === round);
  }

  function clearSyncedHover() {
    d3.selectAll(".small-point")
      .attr("opacity", 0.75)
      .attr("r", 3.2)
      .attr("stroke", "none");

    d3.selectAll(".small-hover-guide")
      .attr("opacity", 0);

    tooltip.style("opacity", 0);
  }

  function setSyncedHover(event, metricKey, metricLabel, round) {
    // Bloomberg-style synchronized hover: one race round highlights in both
    // driver rows, so viewers compare Verstappen and Pérez at the same moment.
    const maxRow = rowFor("Max Verstappen", round);
    const perezRow = rowFor("Sergio Perez", round);
    const raceName = maxRow?.race_name || perezRow?.race_name || `Round ${round}`;

    d3.selectAll(".small-point")
      .attr("opacity", 0.22)
      .attr("r", 2.6)
      .attr("stroke", "none");

    d3.selectAll(`.small-point[data-metric="${metricKey}"][data-round="${round}"]`)
      .attr("opacity", 1)
      .attr("r", 5)
      .attr("stroke", "#f8fafc")
      .attr("stroke-width", 1.4);

    d3.selectAll(".small-hover-guide")
      .attr("opacity", 0);

    d3.selectAll(`.small-hover-guide[data-metric="${metricKey}"][data-round="${round}"]`)
      .attr("opacity", 0.85);

    tooltip
      .style("opacity", 1)
      .html(`
        <strong>${raceName}</strong><br>
        Round: ${round}<br>
        ${metricLabel}<br>
        Verstappen: ${maxRow ? formatValue(maxRow[metricKey]) : "N/A"}<br>
        Pérez: ${perezRow ? formatValue(perezRow[metricKey]) : "N/A"}
      `)
      .style("left", `${event.pageX + 12}px`)
      .style("top", `${event.pageY - 28}px`);
  }

  metrics.forEach(metric => {
    // Shared y-max per metric so the two driver rows are directly comparable
    const yMax = d3.max(data.map(d => d[metric.key]));

    drivers.forEach(driver => {
      const driverData = data
        .filter(d => d.driver === driver.name)
        .sort((a, b) => a.race_round - b.race_round);

      const svgId = driver.name === "Max Verstappen" ? metric.maxSvg : metric.perezSvg;

      drawSinglePanel({
        svgId,
        data: driverData,
        metricKey: metric.key,
        metricLabel: metric.label,
        yMax,
        color: driver.color,
        onSyncedHover: setSyncedHover,
        onSyncedMove: setSyncedHover,
        onSyncedOut: clearSyncedHover
      });
    });
  });

  // Driver focus toolbar (Show Both / Highlight Verstappen / Highlight Pérez)
  const buttons = document.querySelectorAll(".driver-focus-btn");
  const maxRow = document.getElementById("max-row");
  const perezRow = document.getElementById("perez-row");

  function applyDriverFocus(focus) {
    buttons.forEach(b => b.classList.toggle("active", b.dataset.focus === focus));

    if (maxRow && perezRow) {
      maxRow.classList.remove("dimmed");
      perezRow.classList.remove("dimmed");

      if (focus === "max") perezRow.classList.add("dimmed");
      else if (focus === "perez") maxRow.classList.add("dimmed");
    }

    if (window.setStatsComparisonFocus) {
      // The summary bars expose the same global focus setter, giving both
      // charts one shared driver-selection state.
      window.setStatsComparisonFocus(focus);
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      applyDriverFocus(btn.dataset.focus);
    });
  });

  window.setDriverComparisonFocus = applyDriverFocus;
  applyDriverFocus("both");
}

function drawSinglePanel({
  svgId,
  data,
  metricKey,
  metricLabel,
  yMax,
  color,
  onSyncedHover,
  onSyncedMove,
  onSyncedOut
}) {
  const svg = d3.select(svgId);
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const margin = { top: 12, right: 10, bottom: 26, left: 42 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([1, 22]).range([0, innerWidth]);
  const y = d3.scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);

  const xAxis = d3.axisBottom(x).tickValues([1, 11, 22]).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y).ticks(4);

  g.append("g").attr("transform", `translate(0,${innerHeight})`).call(xAxis);
  g.append("g").call(yAxis);

  g.selectAll(".domain, .tick line").attr("stroke", "#5c6777");
  g.selectAll(".tick text").attr("fill", "#cdd6df").attr("font-size", 10);

  const line = d3.line()
    .x(d => x(d.race_round))
    .y(d => y(d[metricKey]));

  g.selectAll(".small-hover-guide")
    .data(data)
    .join("line")
    .attr("class", "small-hover-guide")
    .attr("data-metric", metricKey)
    .attr("data-round", d => d.race_round)
    .attr("x1", d => x(d.race_round))
    .attr("x2", d => x(d.race_round))
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", "#f8fafc")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3 4")
    .attr("opacity", 0)
    .attr("pointer-events", "none");

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2.5)
    .attr("d", line);

  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("class", "small-point")
    .attr("data-metric", metricKey)
    .attr("data-round", d => d.race_round)
    .attr("cx", d => x(d.race_round))
    .attr("cy", d => y(d[metricKey]))
    .attr("r", 3.2)
    .attr("fill", color)
    .attr("opacity", 0.75)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      onSyncedHover(event, metricKey, metricLabel, d.race_round);
    })
    .on("mousemove", function(event, d) {
      onSyncedMove(event, metricKey, metricLabel, d.race_round);
    })
    .on("mouseout", function() {
      onSyncedOut();
    });
}
