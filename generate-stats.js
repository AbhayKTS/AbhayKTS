const axios = require("axios");
const { createCanvas } = require("canvas");
const fs = require("fs");

async function run() {
  const username = "AbhayKTS";
  const token = process.env.GITHUB_TOKEN;

  // Get contribution years and repos
  const initQuery = `
    query {
      user(login: "${username}") {
        contributionsCollection {
          contributionYears
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          restrictedContributionsCount
        }
        repositories(first: 100, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
          totalCount
          nodes {
            name
            isPrivate
            stargazerCount
          }
        }
      }
    }
  `;

  const initRes = await axios.post(
    "https://api.github.com/graphql",
    { query: initQuery },
    { headers: { Authorization: `bearer ${token}` } }
  );

  const user = initRes.data.data.user;
  const years = user.contributionsCollection.contributionYears;
  const publicRepos = user.repositories.nodes.filter(r => !r.isPrivate).length;
  const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);

  // Fetch ALL years for lifetime contribution totals
  let totalContributionsAllTime = 0;
  let totalCommitsAllTime = 0;
  let totalPRsAllTime = 0;
  let totalIssuesAllTime = 0;

  for (const year of years) {
    const fromDt = `${year}-01-01T00:00:00Z`;
    let toDt = `${year}-12-31T23:59:59Z`;
    const now = new Date();
    if (year === now.getFullYear()) {
      toDt = now.toISOString();
    }

    const yearQuery = `
      query {
        user(login: "${username}") {
          contributionsCollection(from: "${fromDt}", to: "${toDt}") {
            contributionCalendar {
              totalContributions
            }
            totalCommitContributions
            totalPullRequestContributions
            totalIssueContributions
          }
        }
      }
    `;

    const yearRes = await axios.post(
      "https://api.github.com/graphql",
      { query: yearQuery },
      { headers: { Authorization: `bearer ${token}` } }
    );

    const cc = yearRes.data.data.user.contributionsCollection;
    totalContributionsAllTime += cc.contributionCalendar.totalContributions;
    totalCommitsAllTime += cc.totalCommitContributions;
    totalPRsAllTime += cc.totalPullRequestContributions;
    totalIssuesAllTime += cc.totalIssueContributions;
  }

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

  // ================== GENERATE STATS IMAGE ==================
  const statsWidth = 900;
  const statsHeight = 420;
  const statsCanvas = createCanvas(statsWidth, statsHeight);
  const statsCtx = statsCanvas.getContext("2d");

  statsCtx.fillStyle = "#0d0d0d";
  statsCtx.fillRect(0, 0, statsWidth, statsHeight);

  const pad = 20;
  statsCtx.shadowColor = "#ff2e2e";
  statsCtx.shadowBlur = 20;
  statsCtx.strokeStyle = "#ff2e2e";
  statsCtx.lineWidth = 4;
  statsCtx.strokeRect(pad, pad, statsWidth - pad * 2, statsHeight - pad * 2);
  statsCtx.shadowBlur = 0;

  statsCtx.fillStyle = "#ff2e2e";
  statsCtx.font = "bold 36px Sans-serif";
  const title = "Shadow Blade Status - S-Rank Developer";
  const titleWidth = statsCtx.measureText(title).width;
  statsCtx.fillText(title, (statsWidth - titleWidth) / 2, 70);

  statsCtx.font = "28px Sans-serif";
  const startX = 50;
  const valueX = 450;
  const startY = 130;
  const gap = 50;

  const stats = [
    { label: "Total Contributions:", value: totalContributionsAllTime },
    { label: "Total Commits:", value: totalCommitsAllTime },
    { label: "Pull Requests:", value: totalPRsAllTime },
    { label: "Issues Opened:", value: totalIssuesAllTime },
    { label: "Stars Received:", value: totalStars },
    { label: "Public Repositories:", value: publicRepos },
  ];

  stats.forEach((stat, i) => {
    const y = startY + gap * i;
    statsCtx.fillStyle = "#d0d0d0";
    statsCtx.fillText(stat.label, startX, y);
    statsCtx.fillStyle = "#ffffff";
    statsCtx.font = "bold 28px Sans-serif";
    statsCtx.fillText(String(stat.value), valueX, y);
    statsCtx.font = "28px Sans-serif";
  });

  fs.writeFileSync("stats.png", statsCanvas.toBuffer("image/png"));
  console.log("stats.png generated!");

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
  console.log("Last 31 days data:", last31Days.map(d => d.date + ": " + d.count).join(", "));
}

run().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
