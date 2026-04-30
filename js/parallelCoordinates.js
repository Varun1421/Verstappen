// parallelCoordinates.js
// Compares Verstappen 2023 against three historically dominant seasons:
// Schumacher 2004, Vettel 2013, Hamilton 2019. All metrics are normalized
// to 0-1 (higher = better) so axes share a comparable scale across eras
// with very different points systems and season lengths.

function drawParallelCoordinates(data) {
  const tooltip = d3.select("#tooltip");
  const svg = d3.select("#parallel-coordinates");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const margin = { top: 60, right: 200, bottom: 50, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Compute normalized 0-1 metrics. All "higher = better" so the visual
  // grammar is consistent: the line that hugs the top of every axis is
  // the most dominant season.
  const seasons = data.map(d => ({
    label: d.season_label,
    driver: d.driver,
    year: +d.year,
    races: +d.races,
    win_rate: +d.wins / +d.races,
    podium_rate: +d.podiums / +d.races,
    pole_rate: +d.poles / +d.races,
    fastest_lap_rate: +d.fastest_laps / +d.races,
    // Points capture: avg points per race / max points possible per race in that era
    points_capture: Math.min(1, (+d.points / +d.races) / +d.points_max_per_race),
    // Reliability: 1 - DNF rate
    reliability: 1 - (+d.dnfs / +d.races)
  }));

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

  // Shared 0-1 scale across all axes
  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([innerHeight, 0]);

  // Verstappen highlighted in red, others in muted but distinct hues
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
      "#ff4d4d", // Verstappen — brand red, highlighted
      "#3b82f6", // Hamilton — Mercedes blue
      "#10b981", // Vettel — emerald
      "#f59e0b", // Schumacher — amber
      "#a855f7", // Senna — purple
      "#14b8a6", // Clark — teal
      "#ec4899"  // Ascari — magenta
    ]);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", 22)
    .attr("font-weight", "bold")
    .text("Verstappen 2023 vs Historically Dominant F1 Seasons");

  // Draw each axis as a vertical line with ticks
  dimensions.forEach(dim => {
    const axisG = g.append("g")
      .attr("transform", `translate(${x(dim.key)},0)`);

    axisG.call(
      d3.axisLeft(y)
        .ticks(5)
        .tickFormat(d3.format(".0%"))
    );

    axisG.selectAll(".tick text")
      .attr("fill", "#cdd6df")
      .attr("font-size", 11);

    axisG.selectAll(".domain, .tick line")
      .attr("stroke", "#5c6777");

    // Axis label at top
    axisG.append("text")
      .attr("y", -16)
      .attr("text-anchor", "middle")
      .attr("fill", "#dbe4ee")
      .attr("font-size", 12)
      .attr("font-weight", "600")
      .text(dim.label);
  });

  // One polyline per season
  const line = d3.line()
    .x(d => x(d.dim))
    .y(d => y(d.value));

  function seasonPath(season) {
    return dimensions.map(d => ({ dim: d.key, value: season[d.key] }));
  }

  // Draw non-Verstappen lines first so Verstappen renders on top
  const ordered = seasons.slice().sort((a, b) =>
    a.label === "Verstappen 2023" ? 1 : b.label === "Verstappen 2023" ? -1 : 0
  );

  const seasonPaths = g.selectAll(".season-path")
    .data(ordered)
    .join("path")
    .attr("class", "season-path")
    .attr("d", d => line(seasonPath(d)))
    .attr("fill", "none")
    .attr("stroke", d => color(d.label))
    .attr("stroke-width", d => d.label === "Verstappen 2023" ? 4 : 2.5)
    .attr("opacity", d => d.label === "Verstappen 2023" ? 1 : 0.7)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      // Dim others
      g.selectAll(".season-path")
        .attr("opacity", p => p.label === d.label ? 1 : 0.15);

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
      g.selectAll(".season-path")
        .attr("opacity", p => p.label === "Verstappen 2023" ? 1 : 0.7);
      tooltip.style("opacity", 0);
    });

  // Legend on the right
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 30},${margin.top})`);

  legend.append("text")
    .attr("y", -8)
    .attr("fill", "#dbe4ee")
    .attr("font-size", 12)
    .attr("font-weight", "600")
    .text("Season");

  seasons
    .slice()
    .sort((a, b) => b.win_rate - a.win_rate)
    .forEach((s, i) => {
      const row = legend.append("g")
        .attr("transform", `translate(0, ${i * 26 + 8})`);

      row.append("rect")
        .attr("width", 18)
        .attr("height", 4)
        .attr("y", 6)
        .attr("fill", color(s.label));

      row.append("text")
        .attr("x", 26)
        .attr("y", 12)
        .attr("fill", s.label === "Verstappen 2023" ? "#ff4d4d" : "#dbe4ee")
        .attr("font-size", 13)
        .attr("font-weight", s.label === "Verstappen 2023" ? "700" : "400")
        .text(s.label);
    });
}
