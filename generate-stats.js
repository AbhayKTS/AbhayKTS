const axios = require("axios");
const { createCanvas } = require("canvas");
const fs = require("fs");

async function run() {
  const username = "AbhayKTS";
  const token = process.env.GITHUB_TOKEN;

  // Fetch last 31 days of contributions for the graph
  const now = new Date();
  const thirtyOneDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fromDate = thirtyOneDaysAgo.toISOString();
  const toDate = now.toISOString();

  const calendarQuery = `
    query {
      user(login: "${username}") {
        contributionsCollection(from: "${fromDate}", to: "${toDate}") {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const calendarRes = await axios.post(
    "https://api.github.com/graphql",
    { query: calendarQuery },
    { headers: { Authorization: `bearer ${token}` } }
  );

  const calendar = calendarRes.data.data.user.contributionsCollection.contributionCalendar;

  // Extract daily contributions
  const dailyData = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      dailyData.push({
        date: day.date,
        count: day.contributionCount
      });
    }
  }

  // Sort by date and take last 31 days
  dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));
  const last31Days = dailyData.slice(-31);

  console.log("Fetched contribution data:");
  last31Days.forEach(d => console.log(`  ${d.date}: ${d.count}`));

  // ================== GENERATE CONTRIBUTION GRAPH ==================
  const graphWidth = 900;
  const graphHeight = 400;
  const graphCanvas = createCanvas(graphWidth, graphHeight);
  const ctx = graphCanvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, graphWidth, graphHeight);

  // Title
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 24px Sans-serif";
  ctx.fillText(username + "'s Contribution Graph", graphWidth / 2 - 180, 35);

  // Graph area
  const graphLeft = 60;
  const graphRight = graphWidth - 30;
  const graphTop = 70;
  const graphBottom = graphHeight - 80;
  const graphAreaWidth = graphRight - graphLeft;
  const graphAreaHeight = graphBottom - graphTop;

  // Find max value for scaling
  const maxCount = Math.max(...last31Days.map(d => d.count), 1);
  const yAxisMax = Math.ceil(maxCount / 10) * 10 || 10;

  // Draw grid lines and Y-axis labels
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#888888";
  ctx.font = "12px Sans-serif";

  for (let i = 0; i <= 5; i++) {
    const y = graphBottom - (i / 5) * graphAreaHeight;
    ctx.beginPath();
    ctx.moveTo(graphLeft, y);
    ctx.lineTo(graphRight, y);
    ctx.stroke();
    const label = Math.round((i / 5) * yAxisMax);
    ctx.fillText(String(label), graphLeft - 30, y + 4);
  }

  // Y-axis label
  ctx.save();
  ctx.translate(15, graphHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#888888";
  ctx.font = "14px Sans-serif";
  ctx.fillText("Contributions", -50, 0);
  ctx.restore();

  // Draw the area fill
  ctx.beginPath();
  ctx.moveTo(graphLeft, graphBottom);

  last31Days.forEach((day, i) => {
    const x = graphLeft + (i / (last31Days.length - 1)) * graphAreaWidth;
    const y = graphBottom - (day.count / yAxisMax) * graphAreaHeight;
    ctx.lineTo(x, y);
  });

  ctx.lineTo(graphRight, graphBottom);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, graphTop, 0, graphBottom);
  gradient.addColorStop(0, "rgba(255, 46, 46, 0.4)");
  gradient.addColorStop(1, "rgba(255, 46, 46, 0.05)");
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw the line
  ctx.beginPath();
  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 3;

  last31Days.forEach((day, i) => {
    const x = graphLeft + (i / (last31Days.length - 1)) * graphAreaWidth;
    const y = graphBottom - (day.count / yAxisMax) * graphAreaHeight;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw data points
  last31Days.forEach((day, i) => {
    const x = graphLeft + (i / (last31Days.length - 1)) * graphAreaWidth;
    const y = graphBottom - (day.count / yAxisMax) * graphAreaHeight;

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#ff2e2e";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // X-axis labels (dates)
  ctx.fillStyle = "#888888";
  ctx.font = "11px Sans-serif";

  const labelInterval = Math.ceil(last31Days.length / 10);
  last31Days.forEach((day, i) => {
    if (i % labelInterval === 0 || i === last31Days.length - 1) {
      const x = graphLeft + (i / (last31Days.length - 1)) * graphAreaWidth;
      const dateObj = new Date(day.date);
      const label = String(dateObj.getDate());
      ctx.fillText(label, x - 5, graphBottom + 20);
    }
  });

  // X-axis title
  ctx.fillStyle = "#888888";
  ctx.font = "14px Sans-serif";
  ctx.fillText("Days", graphWidth / 2 - 15, graphHeight - 20);

  fs.writeFileSync("contribution-graph.png", graphCanvas.toBuffer("image/png"));
  console.log("contribution-graph.png generated!");
}

run().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
