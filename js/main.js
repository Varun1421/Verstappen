// main.js
// Loads all data sources and dispatches to each visualization module.
// Each module is responsible for its own DOM target so they're independent.

Promise.all([
  d3.csv("data/verstappen_perez_2023_full.csv"),
  d3.csv("data/bar_chart_race_2023.csv"),
  d3.csv("data/dominant_seasons.csv")
]).then(([smallMultiplesData, raceData, dominantSeasonsData]) => {
  // Coerce numeric columns for the small-multiples grid
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

  // Order matters here only for the small-multiples + statsComparison row,
  // because they share the focus toolbar in the same section. The other
  // modules render independently.
  drawSmallMultiples(smallMultiplesData);
  drawStatsComparison();
  drawBarChartRace(raceData);
  drawParallelCoordinates(dominantSeasonsData);
  drawEcdfPlot();
});
