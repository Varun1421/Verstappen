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
        tooltip
      });
    });
  });

  // Driver focus toolbar (Show Both / Highlight Verstappen / Highlight Pérez)
  const buttons = document.querySelectorAll(".driver-focus-btn");
  const maxRow = document.getElementById("max-row");
  const perezRow = document.getElementById("perez-row");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const focus = btn.dataset.focus;

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      if (!maxRow || !perezRow) return;

      maxRow.classList.remove("dimmed");
      perezRow.classList.remove("dimmed");

      if (focus === "max") perezRow.classList.add("dimmed");
      else if (focus === "perez") maxRow.classList.add("dimmed");
    });
  });
}

function drawSinglePanel({ svgId, data, metricKey, metricLabel, yMax, color, tooltip }) {
  const svg = d3.select(svgId);
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const margin = { top: 8, right: 8, bottom: 24, left: 34 };
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

  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 22)
    .attr("text-anchor", "middle")
    .attr("fill", "#8b95a3")
    .attr("font-size", 9)
    .text("Race round");

  const line = d3.line()
    .x(d => x(d.race_round))
    .y(d => y(d[metricKey]));

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2.5)
    .attr("d", line);

  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.race_round))
    .attr("cy", d => y(d[metricKey]))
    .attr("r", 2.8)
    .attr("fill", color)
    .on("mouseover", function(event, d) {
      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.driver}</strong><br>
          Race: ${d.race_name}<br>
          Round: ${d.race_round}<br>
          ${metricLabel}: ${d[metricKey]}<br>
          Points: ${d.points_per_race}<br>
          Finish: ${d.finish_position}
        `)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", function() {
      tooltip.style("opacity", 0);
    });
}
