// Race-by-race championship standings with play/pause + scrubber.

function drawBarChartRace(data) {
  const tooltip = d3.select("#tooltip");
  const svg = d3.select("#bar-chart-race");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const margin = { top: 102, right: 140, bottom: 38, left: 180 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const raceRounds = [...new Set(data.map(d => d.race_round))].sort((a, b) => a - b);

  // Records shown below the animation at the round where they first become
  // relevant. The tracker always displays the latest milestone reached.
  const recordMilestones = [
    {
      round: 13,
      label: "9 wins",
      kicker: "After Dutch GP",
      title: "9 wins in a row",
      detail: "Ties Vettel's all-time consecutive wins record."
    },
    {
      round: 14,
      label: "10 wins",
      kicker: "After Italian GP",
      title: "10 consecutive wins",
      detail: "New Formula 1 record for consecutive race wins."
    },
    {
      round: 17,
      label: "Title",
      kicker: "After Qatar GP",
      title: "World championship sealed",
      detail: "The title is clinched with six grands prix still remaining."
    },
    {
      round: 18,
      label: "454 pts",
      kicker: "After United States GP",
      title: "Previous points record passed",
      detail: "466 points clears Verstappen's own 454-point benchmark from 2022."
    },
    {
      round: 21,
      label: "18 wins",
      kicker: "After Las Vegas GP",
      title: "18 wins",
      detail: "Extends the single-season wins record even further."
    },
    {
      round: 22,
      label: "19 wins",
      kicker: "After Abu Dhabi GP",
      title: "19 wins / 575 points / 86.4% win rate",
      detail: "A statistically historic season reaches its final form."
    }
  ];

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

  const x = d3.scaleLinear()
    .range([0, innerWidth]);

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
    .attr("y", 68)
    .attr("text-anchor", "middle")
    .attr("fill", "#cbd5e1")
    .attr("font-size", 12)
    .attr("font-weight", "600")
    .text("Cumulative championship points");

  const xAxis = g.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0,0)");

  // Marks the old single-season points record once the leader's padded axis
  // has enough room for the reference line to be readable.
  const previousPointsRecord = g.append("g")
    .attr("class", "previous-points-record")
    .attr("opacity", 0)
    .style("pointer-events", "none");

  previousPointsRecord.append("line")
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", "#94a3b8")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4 5")
    .attr("opacity", 0.75);

  previousPointsRecord.append("text")
    .attr("y", innerHeight + 24)
    .attr("text-anchor", "middle")
    .attr("fill", "#cbd5e1")
    .attr("font-size", 11)
    .attr("font-weight", "700")
    .text("454-point record");

  const raceLabel = svg.append("text")
    .attr("x", width - 80)
    .attr("y", height - 24)
    .attr("text-anchor", "end")
    .attr("fill", "#9ca3af")
    .attr("font-size", 32)
    .attr("font-weight", "bold");

  // Delta-vs-P2 sub-label: how far the leader is ahead of second place each round.
  // Lives in the top-right near the chart subtitle so it doesn't crowd the race label.
  const deltaLabel = svg.append("text")
    .attr("x", width - 40)
    .attr("y", 68)
    .attr("text-anchor", "end")
    .attr("fill", "#ff4d4d")
    .attr("font-size", 13)
    .attr("font-weight", "700")
    .attr("letter-spacing", "1.2px")
    .attr("text-transform", "uppercase");

  let focusedDriver = null;

  function milestoneForRound(round) {
    return recordMilestones
      .filter(m => m.round <= round)
      .sort((a, b) => b.round - a.round)[0];
  }

  function updateRecordTracker(round) {
    const tracker = document.getElementById("record-tracker");
    const kicker = document.getElementById("record-kicker");
    const title = document.getElementById("record-title");
    const detail = document.getElementById("record-detail");
    if (!tracker || !kicker || !title || !detail) return;

    const milestone = milestoneForRound(round);
    tracker.classList.toggle("active", Boolean(milestone));

    if (!milestone) {
      kicker.textContent = "Record tracker";
      title.textContent = "Records unlock as the season progresses";
      detail.textContent = "Use play or drag the timeline to see when Verstappen bent the record book.";
      return;
    }

    kicker.textContent = milestone.kicker;
    title.textContent = milestone.title;
    detail.textContent = milestone.detail;
  }

  function setupRecordTimeline() {
    const timeline = document.getElementById("record-timeline");
    if (!timeline) return;

    recordMilestones.forEach(milestone => {
      const marker = document.createElement("div");
      marker.className = "record-marker";
      marker.dataset.round = milestone.round;
      marker.style.left = `${((milestone.round - raceRounds[0]) / (raceRounds[raceRounds.length - 1] - raceRounds[0])) * 100}%`;
      marker.innerHTML = `
        <span class="record-marker-dot"></span>
        <span>${milestone.label}</span>
      `;
      timeline.appendChild(marker);
    });
  }

  function updateRecordTimeline(round) {
    document.querySelectorAll(".record-marker").forEach(marker => {
      marker.classList.toggle("active", +marker.dataset.round <= round);
    });
  }

  function update(round) {
    const roundData = data
      .filter(d => d.race_round === round)
      .sort((a, b) => b.cumulative_points - a.cumulative_points)
      .slice(0, 8);

    const leaderPoints = roundData[0]?.cumulative_points || 1;

    // Option B scale: rescale around the current leader with padding. It keeps
    // early rounds legible without making the leader touch the right edge.
    x.domain([0, leaderPoints * 1.22]).nice();

    xAxis.transition()
      .duration(700)
      .call(d3.axisTop(x).ticks(5))
      .call(axis => {
        axis.selectAll("text")
          .attr("fill", "#d1d5db")
          .attr("dy", "-0.55em");
        axis.selectAll("line, path").attr("stroke", "#4b5563");
      });

    previousPointsRecord.transition()
      .duration(700)
      .attr("opacity", leaderPoints >= 454 ? 1 : 0)
      .attr("transform", `translate(${x(454)},0)`);

    const y = d3.scaleBand()
      .domain(roundData.map(d => d.driver))
      .range([0, innerHeight])
      .padding(0.15);

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

    // Gap from leader to P2 — quantifies separation in a single number
    const leader = roundData[0];
    const second = roundData[1];
    if (leader && second) {
      const gap = leader.cumulative_points - second.cumulative_points;
      const surname = leader.driver.split(" ").pop().toUpperCase();
      deltaLabel.text(gap > 0
        ? `${surname} +${gap} PTS AHEAD OF P2`
        : "TIED FOR THE LEAD");
    } else {
      deltaLabel.text("");
    }

    const slider = document.getElementById("bar-race-slider");
    if (slider) slider.value = round;
    const stamp = document.getElementById("bar-race-round-stamp");
    if (stamp) stamp.textContent = `Round ${round} / ${raceRounds.length}`;
    updateRecordTracker(round);
    updateRecordTimeline(round);
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

  // Scrubbing pauses autoplay so the user stays in control after dragging.
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

  setupRecordTimeline();
  update(raceRounds[index]);
  startTimer();
}
