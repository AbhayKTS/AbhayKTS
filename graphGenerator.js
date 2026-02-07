import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { getGitHubContributions } from "./fetchContrib.js";
import { convertToChartData } from "./convertContrib.js";
import fs from 'fs';

const width = 1200;
const height = 500;

const canvas = new ChartJSNodeCanvas({ width, height });

async function generateGraph() {
  const raw = await getGitHubContributions("AbhayKTS", process.env.GITHUB_TOKEN);
  const chartData = convertToChartData(raw);

  const config = {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: [{
        label: "Contributions",
        data: chartData.values,
        borderColor: "red",
        backgroundColor: "rgba(255,0,0,0.2)",
        borderWidth: 2,
        pointBackgroundColor: "white",
        tension: 0.3
      }]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: "white" }},
        y: { ticks: { color: "white" }}
      }
    }
  };

  const buffer = await canvas.renderToBuffer(config);
  fs.writeFileSync("./stats.png", buffer);
}

generateGraph();
