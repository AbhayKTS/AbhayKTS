const axios = require("axios");
const { createCanvas } = require("canvas");
const fs = require("fs");

async function run() {
  const query = `
    query {
      user(login: "AbhayKTS") {
        contributionsCollection {
          contributionCalendar {
            totalContributions
          }
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
        }
        repositories(first: 100) {
          totalCount
        }
        starredRepositories {
          totalCount
        }
      }
    }
  `;

  const res = await axios.post(
    "https://api.github.com/graphql",
    { query },
    { headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}` } }
  );

  const user = res.data.data.user;

  // Stats
  const totalContributions = user.contributionsCollection.contributionCalendar.totalContributions;
  const totalCommits = user.contributionsCollection.totalCommitContributions;
  const totalPRs = user.contributionsCollection.totalPullRequestContributions;
  const totalIssues = user.contributionsCollection.totalIssueContributions;
  const totalStars = user.starredRepositories.totalCount;
  const totalRepos = user.repositories.totalCount;

  // === POWER LEVEL ===
  const powerLevel = totalContributions * 8;  // dynamic anime-style formula
  const maxPower = 3000; // bar max (can scale as you grow)
  const barFill = Math.min(powerLevel / maxPower, 1); // cap at 100%

  // Canvas
  const width = 1300;
  const height = 550;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, width, height);

  // Outer neon border
  ctx.shadowColor = "#ff2e2e";
  ctx.shadowBlur = 25;
  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 6;
  ctx.strokeRect(25, 25, width - 50, height - 50);

  ctx.shadowBlur = 0;

  // Title
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 50px Sans-serif";
  ctx.fillText("Shadow Blade GitHub Stats", 60, 120);

  // Divider
  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 140);
  ctx.lineTo(width - 60, 140);
  ctx.stroke();

  // === Stats ===
  ctx.fillStyle = "#c7c7c7";
  ctx.font = "32px Sans-serif";

  const startY = 200;
  const gap = 60;

  ctx.fillText(`🔥 Total Contributions:     ${totalContributions}`, 60, startY);
  ctx.fillText(`🖥️ Total Commits:           ${totalCommits}`, 60, startY + gap);
  ctx.fillText(`⚔️ Pull Requests:           ${totalPRs}`, 60, startY + gap * 2);
  ctx.fillText(`🐞 Issues Opened:           ${totalIssues}`, 60, startY + gap * 3);
  ctx.fillText(`⭐ Stars Received:          ${totalStars}`, 60, startY + gap * 4);
  ctx.fillText(`📦 Public Repositories:     ${totalRepos}`, 60, startY + gap * 5);

  // === POWER LEVEL BAR TITLE ===
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 40px Sans-serif";
  ctx.fillText("Power Level", 60, startY + gap * 6 + 50);

  // === POWER BAR OUTLINE ===
  const barX = 60;
  const barY = startY + gap * 6 + 80;
  const barWidth = 1100;
  const barHeight = 45;

  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 4;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // === POWER BAR FILL ===
  const fillWidth = barWidth * barFill;

  const gradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
  gradient.addColorStop(0, "#330000");
  gradient.addColorStop(0.5, "#ff1e1e");
  gradient.addColorStop(1, "#ff4d4d");

  ctx.fillStyle = gradient;
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  // === POWER LEVEL NUMBER ===
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 38px Sans-serif";
  ctx.fillText(`${powerLevel}`, barX + barWidth + 20, barY + 38);

  // Save file
  fs.writeFileSync("stats.png", canvas.toBuffer("image/png"));
}

run();
