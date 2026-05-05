// Race-by-race championship standings with play/pause + scrubber.

function drawBarChartRace(data) {
  const tooltip = d3.select("#tooltip");
  const svg = d3.select("#bar-chart-race");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const margin = { top: 92, right: 140, bottom: 38, left: 180 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const raceRounds = [...new Set(data.map(d => d.race_round))].sort((a, b) => a - b);
  const drivers = [...new Set(data.map(d => d.driver))];

  const color = d3.scaleOrdinal()
    .domain([
      "Max Verstappen",
      "Sergio Perez",
      "Lewis Hamilton",
      "Fernando Alonso",
      "Charles Leclerc",
      "Lando Norris",
      "Carlos Sainz",
      "George Russell",
      "Oscar Piastri",
      "Lance Stroll"
    ])
    .range([
      "#ff4d4d",
      "#3b82f6",
      "#10b981",
      "#22c55e",
      "#ef4444",
      "#f97316",
      "#eab308",
      "#06b6d4",
      "#a855f7",
      "#ec4899"
    ]);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", 24)
    .attr("font-weight", "bold")
    .text("2023 Formula 1 Driver Standings");

  svg.append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", 64)
    .attr("text-anchor", "middle")
    .attr("fill", "#cbd5e1")
    .attr("font-size", 12)
    .attr("font-weight", "600")
    .text("Cumulative championship points");

  const raceLabel = svg.append("text")
    .attr("x", width - 80)
    .attr("y", height - 24)
    .attr("text-anchor", "end")
    .attr("fill", "#9ca3af")
    .attr("font-size", 32)
    .attr("font-weight", "bold");

  let focusedDriver = null;

  function update(round) {
    const roundData = data
      .filter(d => d.race_round === round)
      .sort((a, b) => b.cumulative_points - a.cumulative_points)
      .slice(0, 8);

    const x = d3.scaleLinear()
      .domain([0, d3.max(roundData, d => d.cumulative_points) || 1])
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

    function barOpacity(d) {
      if (!focusedDriver) return 1;
      return d.driver === focusedDriver ? 1 : 0.18;
    }

    const bars = g.selectAll(".bar")
      .data(roundData, d => d.driver);

    bars.join(
      enter => enter.append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d.driver))
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.cumulative_points))
        .attr("fill", d => color(d.driver))
        .attr("opacity", barOpacity)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          focusedDriver = d.driver;
          g.selectAll(".bar").attr("opacity", barOpacity);
          g.selectAll(".driver-label").attr("opacity", barOpacity);
          g.selectAll(".value-label").attr("opacity", barOpacity);
          tooltip
            .style("opacity", 1)
            .html(`
              <strong>${d.driver}</strong><br>
              ${d.race_name}<br>
              Points: ${d.cumulative_points}
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
          focusedDriver = null;
          g.selectAll(".bar").attr("opacity", 1);
          g.selectAll(".driver-label").attr("opacity", 1);
          g.selectAll(".value-label").attr("opacity", 1);
          tooltip.style("opacity", 0);
        }),
      update => update,
      exit => exit.remove()
    )
    .transition()
    .duration(700)
    .attr("y", d => y(d.driver))
    .attr("width", d => x(d.cumulative_points))
    .attr("height", y.bandwidth())
    .attr("opacity", barOpacity);

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
    .duration(700)
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
    .duration(700)
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

    const slider = document.getElementById("bar-race-slider");
    if (slider) slider.value = round;
    const stamp = document.getElementById("bar-race-round-stamp");
    if (stamp) stamp.textContent = `Round ${round} / ${raceRounds.length}`;
  }

  let index = 0;
  let timer = null;
  let playing = true;

  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      index = (index + 1) % raceRounds.length;
      update(raceRounds[index]);
    }, 1400);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  const playBtn = document.getElementById("bar-race-play");
  const slider = document.getElementById("bar-race-slider");

  if (slider) {
    slider.min = raceRounds[0];
    slider.max = raceRounds[raceRounds.length - 1];
    slider.value = raceRounds[0];
    slider.addEventListener("input", (e) => {
      playing = false;
      stopTimer();
      if (playBtn) playBtn.textContent = "▶ Play";
      const round = +e.target.value;
      index = raceRounds.indexOf(round);
      update(round);
    });
  }

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      playing = !playing;
      if (playing) {
        playBtn.textContent = "⏸ Pause";
        startTimer();
      } else {
        playBtn.textContent = "▶ Play";
        stopTimer();
      }
    });
  }

  update(raceRounds[index]);
  startTimer();
}
