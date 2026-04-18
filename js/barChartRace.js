function drawBarChartRace(data) {
  const svg = d3.select("#bar-chart-race");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const margin = { top: 60, right: 140, bottom: 50, left: 180 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const raceRounds = [...new Set(data.map(d => d.race_round))].sort((a, b) => a - b);
  const drivers = [...new Set(data.map(d => d.driver))];

  const color = d3.scaleOrdinal()
    .domain(drivers)
    .range([
      "#3b82f6",
      "#ef4444",
      "#10b981",
      "#f59e0b",
      "#a855f7",
      "#ec4899",
      "#22c55e",
      "#f97316"
    ]);

  const title = svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", 24)
    .attr("font-weight", "bold")
    .text("2023 Formula 1 Driver Standings");

  const raceLabel = svg.append("text")
    .attr("x", width - 80)
    .attr("y", height - 20)
    .attr("text-anchor", "end")
    .attr("fill", "#9ca3af")
    .attr("font-size", 32)
    .attr("font-weight", "bold");

  function update(round) {
    const roundData = data
      .filter(d => d.race_round === round)
      .sort((a, b) => b.cumulative_points - a.cumulative_points)
      .slice(0, 8);

    const x = d3.scaleLinear()
      .domain([0, d3.max(roundData, d => d.cumulative_points)])
      .nice()
      .range([0, innerWidth]);

    const y = d3.scaleBand()
      .domain(roundData.map(d => d.driver))
      .range([0, innerHeight])
      .padding(0.15);

    g.selectAll(".x-axis").remove();
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0,0)")
      .call(d3.axisTop(x).ticks(5))
      .call(axis => {
        axis.selectAll("text").attr("fill", "#d1d5db");
        axis.selectAll("line, path").attr("stroke", "#4b5563");
      });

    const bars = g.selectAll(".bar")
      .data(roundData, d => d.driver);

    bars.join(
      enter => enter.append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d.driver))
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.cumulative_points))
        .attr("fill", d => color(d.driver)),
      update => update,
      exit => exit.remove()
    )
    .transition()
    .duration(800)
    .attr("y", d => y(d.driver))
    .attr("width", d => x(d.cumulative_points))
    .attr("height", y.bandwidth());

    const labels = g.selectAll(".driver-label")
      .data(roundData, d => d.driver);

    labels.join(
      enter => enter.append("text")
        .attr("class", "driver-label")
        .attr("x", -10)
        .attr("y", d => y(d.driver) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", "white")
        .attr("font-size", 14)
        .text(d => d.driver),
      update => update,
      exit => exit.remove()
    )
    .transition()
    .duration(800)
    .attr("y", d => y(d.driver) + y.bandwidth() / 2);

    const values = g.selectAll(".value-label")
      .data(roundData, d => d.driver);

    values.join(
      enter => enter.append("text")
        .attr("class", "value-label")
        .attr("x", d => x(d.cumulative_points) + 8)
        .attr("y", d => y(d.driver) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("fill", "#e5e7eb")
        .attr("font-size", 13)
        .text(d => d.cumulative_points),
      update => update,
      exit => exit.remove()
    )
    .transition()
    .duration(800)
    .attr("x", d => x(d.cumulative_points) + 8)
    .attr("y", d => y(d.driver) + y.bandwidth() / 2)
    .tween("text", function(d) {
      const that = d3.select(this);
      const current = +that.text() || 0;
      const i = d3.interpolateNumber(current, d.cumulative_points);
      return function(t) {
        that.text(Math.round(i(t)));
      };
    });

    const currentRace = roundData[0]?.race_name || `Round ${round}`;
    raceLabel.text(currentRace);
  }

  let index = 0;
  update(raceRounds[index]);

  setInterval(() => {
    index = (index + 1) % raceRounds.length;
    update(raceRounds[index]);
  }, 1400);
}