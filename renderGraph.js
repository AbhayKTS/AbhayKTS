import { getGitHubContributions } from "./fetchContrib.js";
import { convertToChartData } from "./convertContrib.js";

async function renderContributionGraph() {
  const raw = await getGitHubContributions("AbhayKTS", GITHUB_TOKEN);

  const chartData = convertToChartData(raw);

  const ctx = document.getElementById("contributionGraphCanvas").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: [{
        label: "Contributions",
        data: chartData.values,
        borderColor: "red",
        backgroundColor: "rgba(255,0,0,0.2)",
        pointBackgroundColor: "white",
        tension: 0.3,
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: "white" }
        },
        y: {
          ticks: { color: "white" },
          grid: { color: "rgba(255,0,0,0.2)" }
        }
      }
    }
  });
}

renderContributionGraph();
