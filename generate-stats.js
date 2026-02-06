const axios = require("axios");
const { createCanvas } = require("canvas");
const fs = require("fs");

async function run() {
  const username = "AbhayKTS";
  const token = process.env.GITHUB_TOKEN;

  // Step 1: Get contribution years and repos
  const initQuery = `
    query {
      user(login: "${username}") {
        contributionsCollection {
          contributionYears
        }
        repositories(first: 100, ownerAffiliations: OWNER) {
          totalCount
          nodes {
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
  const totalRepos = user.repositories.totalCount;
  const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);

  // Step 2: Fetch ALL years for lifetime totals
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

  // Step 3: Last year (trailing 365 days)
  const now = new Date();
  const lastYearFrom = new Date(now.getTime() - 364 * 24 * 60 * 60 * 1000).toISOString();
  const lastYearTo = now.toISOString();

  const lastYearQuery = `
    query {
      user(login: "${username}") {
        contributionsCollection(from: "${lastYearFrom}", to: "${lastYearTo}") {
          contributionCalendar {
            totalContributions
          }
          totalCommitContributions
        }
      }
    }
  `;

  const lastYearRes = await axios.post(
    "https://api.github.com/graphql",
    { query: lastYearQuery },
    { headers: { Authorization: `bearer ${token}` } }
  );

  const lastYearContributions = lastYearRes.data.data.user.contributionsCollection.contributionCalendar.totalContributions;
  const lastYearCommits = lastYearRes.data.data.user.contributionsCollection.totalCommitContributions;

  // Power Level calculation
  const powerLevel = (totalContributionsAllTime + totalCommitsAllTime) * 6;
  const maxPower = 5000;
  const barFill = Math.min(powerLevel / maxPower, 1);

  // Canvas Drawing
  const width = 900;
  const height = 620;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, width, height);

  // Outer neon border
  const pad = 20;
  ctx.shadowColor = "#ff2e2e";
  ctx.shadowBlur = 20;
  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 4;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
  ctx.shadowBlur = 0;

  // Title
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 36px Sans-serif";
  const title = "Shadow Blade Status - S-Rank Developer";
  const titleWidth = ctx.measureText(title).width;
  ctx.fillText(title, (width - titleWidth) / 2, 70);

  // Stats
  ctx.font = "28px Sans-serif";

  const startX = 50;
  const valueX = 420;
  const startY = 130;
  const gap = 48;

  const stats = [
    { label: "Total Contributions:", value: totalContributionsAllTime },
    { label: "Last Year Contributions:", value: lastYearContributions },
    { label: "Total Commits:", value: totalCommitsAllTime },
    { label: "Last Year Commits:", value: lastYearCommits },
    { label: "Pull Requests:", value: totalPRsAllTime },
    { label: "Issues Opened:", value: totalIssuesAllTime },
    { label: "Stars Received:", value: totalStars },
    { label: "Public Repositories:", value: totalRepos },
  ];

  stats.forEach((stat, i) => {
    const y = startY + gap * i;
    ctx.fillStyle = "#d0d0d0";
    ctx.fillText(stat.label, startX, y);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Sans-serif";
    ctx.fillText(String(stat.value), valueX, y);
    ctx.font = "28px Sans-serif";
  });

  // Power Level title
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 32px Sans-serif";
  ctx.fillText("Power Level", startX, startY + gap * 8 + 20);

  // Power bar
  const barX = startX;
  const barY = startY + gap * 8 + 45;
  const barWidth = width - startX * 2 - 100;
  const barHeight = 40;

  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 3;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  const fillWidth = barWidth * barFill;
  const gradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
  gradient.addColorStop(0, "#330000");
  gradient.addColorStop(0.5, "#ff1e1e");
  gradient.addColorStop(1, "#ff4d4d");

  ctx.fillStyle = gradient;
  ctx.fillRect(barX + 2, barY + 2, fillWidth - 4, barHeight - 4);

  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 32px Sans-serif";
  ctx.fillText(String(powerLevel), barX + barWidth + 15, barY + 30);

  fs.writeFileSync("stats.png", canvas.toBuffer("image/png"));
  console.log("stats.png generated!");
  console.log("Total Contributions (all time):", totalContributionsAllTime);
  console.log("Last Year Contributions:", lastYearContributions);
  console.log("Total Commits (all time):", totalCommitsAllTime);
  console.log("Last Year Commits:", lastYearCommits);
  console.log("Stars:", totalStars);
  console.log("Repos:", totalRepos);
}

run().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
