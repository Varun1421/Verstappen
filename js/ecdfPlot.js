// ECDF: cumulative fraction of events at finishing rank ≤ k, per athlete.
// X-axis is sqrt-scaled so ranks 1-5 (where the variation lives) get the canvas.

function drawEcdfPlot() {
  const tooltip = d3.select("#tooltip");

  const athletes = [
    {
      name: "Verstappen — F1 2023",
      sport: "Formula 1",
      events: 22,
      positions: [1,2,1,2,1,1,1,1,1,1,1,1,1,1,5,1,1,1,1,1,1,1],
      color: "#ff4d4d",
      highlight: true
    },
    {
      name: "Federer — ATP 2006",
      sport: "Tennis",
      events: 17,
      positions: [1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,4],
      color: "#10b981",
      highlight: false
    },
    {
      name: "Djokovic — ATP 2015",
      sport: "Tennis",
      events: 17,
      positions: [1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,4,8],
      color: "#3b82f6",
      highlight: false
    },
    {
      name: "Tiger Woods — PGA 2000",
      sport: "Golf",
      events: 20,
      positions: [1,1,1,1,1,1,1,1,1,2,2,3,5,5,5,7,8,11,15,21],
      color: "#f59e0b",
      highlight: false
    },
    {
      name: "Phelps — Beijing 2008",
      sport: "Swimming",
      events: 8,
      positions: [1,1,1,1,1,1,1,1],
      color: "#a855f7",
      highlight: false
    }
  ];

  const svg = d3.select("#ecdf-plot");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const margin = { top: 76, right: 270, bottom: 72, left: 78 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", 22)
    .attr("font-weight", "bold")
    .text("Dominance Curves: Verstappen vs Cross-Sport Greats");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .attr("fill", "#94a3b8")
    .attr("font-size", 12)
    .text("Each curve compares event finish rank: F1 race, tennis tournament, golf event, or swim final");

  const xMax = 22;

  function ecdf(positions) {
    const sorted = positions.slice().sort((a, b) => a - b);
    const n = sorted.length;
    const points = [{ rank: 0, frac: 0 }];
    for (let k = 1; k <= xMax; k++) {
      const count = sorted.filter(p => p <= k).length;
      points.push({ rank: k, frac: count / n });
    }
    return points;
  }

  const x = d3.scalePow()
    .exponent(0.55)
    .domain([0, xMax])
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([innerHeight, 0]);

  const refRanks = [1, 3, 5, 10, 22];
  g.append("g").attr("class", "v-grid")
    .selectAll("line")
    .data(refRanks)
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
        .tickValues([1, 2, 3, 5, 10, 15, 22])
        .tickFormat(d3.format("d"))
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
    .attr("y", innerHeight + 42)
    .attr("text-anchor", "middle")
    .attr("fill", "#dbe4ee")
    .attr("font-size", 13)
    .attr("font-weight", "600")
    .text("Finish rank threshold k (lower rank is better)");

  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 58)
    .attr("text-anchor", "middle")
    .attr("fill", "#8b95a3")
    .attr("font-size", 11)
    .attr("font-style", "italic")
    .text("(axis is sqrt-scaled: ranks 1-5 get the most space)");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -48)
    .attr("text-anchor", "middle")
    .attr("fill", "#dbe4ee")
    .attr("font-size", 13)
    .text("Share of events at or better than k");

  g.append("g").attr("class", "rank-tags")
    .selectAll("text")
    .data([
      { rank: 1, label: "Won" },
      { rank: 3, label: "Podium" },
      { rank: 5, label: "Top 5" },
      { rank: 10, label: "Top 10" }
    ])
    .join("text")
    .attr("x", d => x(d.rank))
    .attr("y", -8)
    .attr("text-anchor", "middle")
    .attr("fill", "#94a3b8")
    .attr("font-size", 10)
    .attr("letter-spacing", "0.5px")
    .text(d => d.label.toUpperCase());

  const line = d3.line()
    .x(d => x(d.rank))
    .y(d => y(d.frac))
    .curve(d3.curveStepAfter);

  const ordered = athletes.slice().sort((a, b) =>
    a.highlight ? 1 : b.highlight ? -1 : 0
  );

  function firstFullRank(positions) {
    const points = ecdf(positions);
    const hit = points.find(p => p.frac >= 1 - 1e-9);
    return hit ? hit.rank : xMax;
  }

  g.selectAll(".ecdf-path")
    .data(ordered)
    .join("path")
    .attr("class", "ecdf-path")
    .attr("d", d => line(ecdf(d.positions)))
    .attr("fill", "none")
    .attr("stroke", d => d.color)
    .attr("stroke-width", d => d.highlight ? 4 : 2.5)
    .attr("opacity", d => d.highlight ? 1 : 0.8)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      g.selectAll(".ecdf-path")
        .attr("opacity", p => p.name === d.name ? 1 : 0.12);
      g.selectAll(".knee-dot")
        .attr("opacity", p => p.name === d.name ? 1 : 0.12);

      const points = ecdf(d.positions);
      const top1 = points.find(p => p.rank === 1).frac;
      const top3 = points.find(p => p.rank === 3).frac;
      const top5 = points.find(p => p.rank === 5).frac;
      const knee = firstFullRank(d.positions);

      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.name}</strong><br>
          Sport: ${d.sport}<br>
          Events: ${d.events}<br>
          Won: ${(top1 * 100).toFixed(1)}%<br>
          Top-3: ${(top3 * 100).toFixed(1)}%<br>
          Top-5: ${(top5 * 100).toFixed(1)}%<br>
          First reached 100% at rank ${knee}
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
      g.selectAll(".ecdf-path")
        .attr("opacity", p => p.highlight ? 1 : 0.8);
      g.selectAll(".knee-dot")
        .attr("opacity", 1);
      tooltip.style("opacity", 0);
    });

  // Small dot at the rank where each curve first reaches 100% — labels removed
  // (they were colliding for athletes whose curves plateaued near each other).
  // The legend already carries the "won X%" stat.
  g.selectAll(".knee-dot")
    .data(ordered)
    .join("circle")
    .attr("class", "knee-dot")
    .attr("cx", d => x(firstFullRank(d.positions)))
    .attr("cy", y(1))
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

  athletes.forEach((a, i) => {
    const row = legend.append("g")
      .attr("transform", `translate(0, ${i * 30 + 8})`);

    row.append("rect")
      .attr("width", 18)
      .attr("height", 4)
      .attr("y", 6)
      .attr("fill", a.color);

    row.append("text")
      .attr("x", 26)
      .attr("y", 12)
      .attr("fill", a.highlight ? "#ff4d4d" : "#dbe4ee")
      .attr("font-size", 12)
      .attr("font-weight", a.highlight ? "700" : "500")
      .text(a.name);

    const points = ecdf(a.positions);
    const top1Pct = (points.find(p => p.rank === 1).frac * 100).toFixed(0);

    row.append("text")
      .attr("x", 26)
      .attr("y", 26)
      .attr("fill", "#8b95a3")
      .attr("font-size", 10)
      .text(`${a.sport} · ${a.events} events · won ${top1Pct}%`);
  });
}
