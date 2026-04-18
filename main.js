Promise.all([
  d3.csv("data/verstappen_perez_2023_full.csv"),
  d3.csv("data/bar_chart_race_2023.csv")
]).then(([smallMultiplesData, raceData]) => {
  smallMultiplesData.forEach(d => {
    d.race_round = +d.race_round;
    d.points = +d.points;
    d.points_per_race = +d.points_per_race;
    d.cumulative_points = +d.cumulative_points;
    d.win = +d.win;
    d.podium = +d.podium;
    d.pole = +d.pole;
    d.fastest_lap = +d.fastest_lap;
    d.cumulative_wins = +d.cumulative_wins;
    d.cumulative_podiums = +d.cumulative_podiums;
    d.cumulative_poles = +d.cumulative_poles;
    d.cumulative_fastest_laps = +d.cumulative_fastest_laps;
  });

  raceData.forEach(d => {
    d.race_round = +d.race_round;
    d.cumulative_points = +d.cumulative_points;
  });

  drawSmallMultiples(smallMultiplesData);
  drawBarChartRace(raceData);
});