// 1x6 row of paired bars: Verstappen vs Pérez 2023 season totals.

function drawStatsComparison() {
  const tooltip = d3.select("#tooltip");

  const stats = [
    { metric: "Points",         max: 575,  perez: 285, unit: "" },
    { metric: "Wins",           max: 19,   perez: 2,   unit: "" },
    { metric: "Podiums",        max: 21,   perez: 9,   unit: "" },
    { metric: "Pole Positions", max: 12,   perez: 2,   unit: "" },
    { metric: "Fastest Laps",   max: 9,    perez: 3,   unit: "" },
    { metric: "Points / Race",  max: 26.1, perez: 13.0, unit: "" }
  ];

  const svg = d3.select("#statsChart");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const cols = 6;
  const panelWidth = width / cols;

  const margin = { top: 28, right: 12, bottom: 40, left: 12 };
  const innerWidth = panelWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const color = d3.scaleOrdinal()
    .domain(["Max Verstappen", "Sergio Perez"])
    .range(["#ff4d4d", "#3b82f6"]);

  stats.forEach((stat, i) => {
    const g = svg.append("g")
      .attr("transform", `translate(${i * panelWidth + margin.left}, ${margin.top})`);

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -10)
      .attr("fill", "#ffffff")
      .attr("text-anchor", "middle")
      .attr("font-size", 13)
      .attr("font-weight", "600")
      .text(stat.metric);

    const maxVal = Math.max(stat.max, stat.perez);
    const y = d3.scaleLinear()
      .domain([0, maxVal])
      .nice()
      .range([innerHeight, 0]);

    const x = d3.scaleBand()
      .domain(["Max Verstappen", "Sergio Perez"])
      .range([0, innerWidth])
      .padding(0.25);

    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", innerHeight)
      .attr("y2", innerHeight)
      .attr("stroke", "#607089")
      .attr("stroke-width", 1);

    const driverData = [
      { driver: "Max Verstappen", value: stat.max },
      { driver: "Sergio Perez",   value: stat.perez }
    ];

    g.selectAll(".stat-bar")
      .data(driverData)
      .join("rect")
      .attr("x", d => x(d.driver))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.value))
      .attr("fill", d => color(d.driver))
      .attr("rx", 2)
      .on("mouseover", function(event, d) {
        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.driver === "Sergio Perez" ? "Pérez" : "Verstappen"}</strong><br>
            ${stat.metric}: ${d.value}
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
        tooltip.style("opacity", 0);
      });

    g.selectAll(".stat-label")
      .data(driverData)
      .join("text")
      .attr("x", d => x(d.driver) + x.bandwidth() / 2)
      .attr("y", d => y(d.value) - 5)
      .attr("fill", "#e8ecf2")
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("font-weight", "600")
      .text(d => d.value);

    g.selectAll(".stat-axis")
      .data(driverData)
      .join("text")
      .attr("x", d => x(d.driver) + x.bandwidth() / 2)
      .attr("y", innerHeight + 16)
      .attr("fill", "#d8dee9")
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .text(d => d.driver === "Max Verstappen" ? "VER" : "PER");
  });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 8)
    .attr("text-anchor", "middle")
    .attr("fill", "#8b95a3")
    .attr("font-size", 11)
    .text("Driver comparison within the same 2023 Red Bull car");
}
