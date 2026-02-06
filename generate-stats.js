const axios = require("axios");const axios = require("axios");

const { createCanvas } = require("canvas");const { createCanvas } = require("canvas");

const fs = require("fs");const fs = require("fs");



async function run() {async function run() {

  // Query for all-time stats + contribution years  const query = `

  const query = `    query {

    query {      user(login: "AbhayKTS") {

      user(login: "AbhayKTS") {        name

        name        contributionsCollection {

        contributionsCollection {          contributionCalendar {

          contributionCalendar {            totalContributions

            totalContributions          }

          }          totalCommitContributions

          totalCommitContributions          totalIssueContributions

          totalIssueContributions          totalPullRequestContributions

          totalPullRequestContributions        }

          contributionYears        repositories(first: 100) {

        }          totalCount

        repositories(first: 100, ownerAffiliations: OWNER) {        }

          totalCount        starredRepositories {

          nodes {          totalCount

            stargazerCount        }

          }      }

        }    }

      }  `;

    }

  `;  const res = await axios.post(

    "https://api.github.com/graphql",

  const res = await axios.post(    { query },

    "https://api.github.com/graphql",    { headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}` } }

    { query },  );

    { headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}` } }

  );  const user = res.data.data.user;



  const user = res.data.data.user;  const totalContributions = user.contributionsCollection.contributionCalendar.totalContributions;

  const years = user.contributionsCollection.contributionYears;  const totalCommits = user.contributionsCollection.totalCommitContributions;

  const totalPRs = user.contributionsCollection.totalPullRequestContributions;

  // Fetch ALL years' contributions for lifetime total  const totalIssues = user.contributionsCollection.totalIssueContributions;

  let totalContributionsAllTime = 0;  const totalStars = user.starredRepositories.totalCount;

  let totalCommitsAllTime = 0;  const totalRepos = user.repositories.totalCount;



  for (const year of years) {  // Power Level

    const fromDt = `${year}-01-01T00:00:00Z`;  const powerLevel = (totalContributions + totalCommits) * 6; // anime scaling

    let toDt = `${year}-12-31T23:59:59Z`;  const maxPower = 3000;

      const barFill = Math.min(powerLevel / maxPower, 1);

    // Clamp current year to now

    const now = new Date();  // Canvas

    if (year === now.getFullYear()) {  const width = 1300;

      toDt = now.toISOString();  const height = 650;

    }  const canvas = createCanvas(width, height);

  const ctx = canvas.getContext("2d");

    const yearQuery = `

      query {  // Background

        user(login: "AbhayKTS") {  ctx.fillStyle = "#090909";

          contributionsCollection(from: "${fromDt}", to: "${toDt}") {  ctx.fillRect(0, 0, width, height);

            contributionCalendar {

              totalContributions  // Outer neon border

            }  ctx.shadowColor = "#ff2e2e";

            totalCommitContributions  ctx.shadowBlur = 30;

          }  ctx.strokeStyle = "#ff2e2e";

        }  ctx.lineWidth = 7;

      }  ctx.strokeRect(25, 25, width - 50, height - 50);

    `;  ctx.shadowBlur = 0;



    const yearRes = await axios.post(  // Title

      "https://api.github.com/graphql",  ctx.fillStyle = "#ff2e2e";

      { query: yearQuery },  ctx.font = "bold 55px Sans-serif";

      { headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}` } }  ctx.fillText("Shadow Blade Status — S-Rank Developer", 60, 120);

    );

  // Divider

    totalContributionsAllTime += yearRes.data.data.user.contributionsCollection.contributionCalendar.totalContributions;  ctx.strokeStyle = "#ff2e2e";

    totalCommitsAllTime += yearRes.data.data.user.contributionsCollection.totalCommitContributions;  ctx.lineWidth = 3;

  }  ctx.beginPath();

  ctx.moveTo(60, 140);

  // Last year (trailing 365 days) stats  ctx.lineTo(width - 60, 140);

  const now = new Date();  ctx.stroke();

  const lastYearFrom = new Date(now.getTime() - 364 * 24 * 60 * 60 * 1000).toISOString();

  const lastYearTo = now.toISOString();  // Stats

  ctx.fillStyle = "#c7c7c7";

  const lastYearQuery = `  ctx.font = "35px Sans-serif";

    query {

      user(login: "AbhayKTS") {  const startY = 200;

        contributionsCollection(from: "${lastYearFrom}", to: "${lastYearTo}") {  const gap = 60;

          contributionCalendar {

            totalContributions  ctx.fillText(`🔥 Total Contributions:     ${totalContributions}`, 60, startY);

          }  ctx.fillText(`🖥️ Real Total Commits:     ${totalCommits}`, 60, startY + gap);

          totalCommitContributions  ctx.fillText(`⚔️ Pull Requests:           ${totalPRs}`, 60, startY + gap * 2);

        }  ctx.fillText(`🐞 Issues Opened:           ${totalIssues}`, 60, startY + gap * 3);

      }  ctx.fillText(`⭐ Stars Received:          ${totalStars}`, 60, startY + gap * 4);

    }  ctx.fillText(`📦 Public Repositories:     ${totalRepos}`, 60, startY + gap * 5);

  `;

  // Power level title

  const lastYearRes = await axios.post(  ctx.fillStyle = "#ff2e2e";

    "https://api.github.com/graphql",  ctx.font = "bold 45px Sans-serif";

    { query: lastYearQuery },  ctx.fillText("⚡ Power Level", 60, startY + gap * 6 + 40);

    { headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}` } }

  );  // Power bar

  const barX = 60;

  const lastYearContributions = lastYearRes.data.data.user.contributionsCollection.contributionCalendar.totalContributions;  const barY = startY + gap * 6 + 80;

  const lastYearCommits = lastYearRes.data.data.user.contributionsCollection.totalCommitContributions;  const barWidth = 1100;

  const barHeight = 50;

  // Other stats

  const totalPRs = user.contributionsCollection.totalPullRequestContributions;  ctx.strokeStyle = "#ff2e2e";

  const totalIssues = user.contributionsCollection.totalIssueContributions;  ctx.lineWidth = 4;

  const totalRepos = user.repositories.totalCount;  ctx.strokeRect(barX, barY, barWidth, barHeight);

  const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);

  // Gradient fill

  // Power Level  const fillWidth = barWidth * barFill;

  const powerLevel = (totalContributionsAllTime + totalCommitsAllTime) * 6;  const gradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);

  const maxPower = 5000;  gradient.addColorStop(0, "#330000");

  const barFill = Math.min(powerLevel / maxPower, 1);  gradient.addColorStop(0.5, "#ff1e1e");

  gradient.addColorStop(1, "#ff4d4d");

  // Canvas

  const width = 1100;  ctx.fillStyle = gradient;

  const height = 700;  ctx.fillRect(barX, barY, fillWidth, barHeight);

  const canvas = createCanvas(width, height);

  const ctx = canvas.getContext("2d");  // Power number

  ctx.fillStyle = "#ff2e2e";

  // Background  ctx.font = "bold 40px Sans-serif";

  ctx.fillStyle = "#0d0d0d";  ctx.fillText(`${powerLevel}`, barX + barWidth + 20, barY + 40);

  ctx.fillRect(0, 0, width, height);

  fs.writeFileSync("stats.png", canvas.toBuffer("image/png"));

  // Outer neon border with padding}

  const borderPadding = 30;

  ctx.shadowColor = "#ff2e2e";run();

  ctx.shadowBlur = 25;
  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 5;
  ctx.strokeRect(borderPadding, borderPadding, width - borderPadding * 2, height - borderPadding * 2);
  ctx.shadowBlur = 0;

  // Title - centered and within box
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 42px Sans-serif";
  const title = "Shadow Blade Status — S-Rank Developer";
  const titleWidth = ctx.measureText(title).width;
  ctx.fillText(title, (width - titleWidth) / 2, 90);

  // Divider
  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 115);
  ctx.lineTo(width - 60, 115);
  ctx.stroke();

  // Stats - Left Column
  ctx.fillStyle = "#e0e0e0";
  ctx.font = "32px Sans-serif";

  const startX = 70;
  const startY = 175;
  const gap = 55;

  // Main stats with proper alignment
  const stats = [
    { icon: "🔥", label: "Total Contributions:", value: totalContributionsAllTime },
    { icon: "📅", label: "Last Year Contributions:", value: lastYearContributions },
    { icon: "💀", label: "Total Commits:", value: totalCommitsAllTime },
    { icon: "📅", label: "Last Year Commits:", value: lastYearCommits },
    { icon: "⚔️", label: "Pull Requests:", value: totalPRs },
    { icon: "🛡️", label: "Issues Opened:", value: totalIssues },
    { icon: "⭐", label: "Stars Received:", value: totalStars },
    { icon: "📦", label: "Public Repositories:", value: totalRepos },
  ];

  stats.forEach((stat, i) => {
    const y = startY + gap * i;
    ctx.fillStyle = "#e0e0e0";
    ctx.fillText(`${stat.icon} ${stat.label}`, startX, y);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${stat.value}`, startX + 450, y);
  });

  // Power Level title
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 38px Sans-serif";
  ctx.fillText("⚡ Power Level", startX, startY + gap * 8 + 30);

  // Power bar
  const barX = startX;
  const barY = startY + gap * 8 + 60;
  const barWidth = width - startX * 2 - 120;
  const barHeight = 45;

  // Bar border
  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 3;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Gradient fill
  const fillWidth = barWidth * barFill;
  const gradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
  gradient.addColorStop(0, "#330000");
  gradient.addColorStop(0.5, "#ff1e1e");
  gradient.addColorStop(1, "#ff4d4d");

  ctx.fillStyle = gradient;
  ctx.fillRect(barX + 2, barY + 2, fillWidth - 4, barHeight - 4);

  // Power number
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 36px Sans-serif";
  ctx.fillText(`${powerLevel}`, barX + barWidth + 15, barY + 35);

  fs.writeFileSync("stats.png", canvas.toBuffer("image/png"));
  console.log("✅ stats.png generated successfully!");
  console.log(`📊 Total Contributions (all time): ${totalContributionsAllTime}`);
  console.log(`📊 Last Year Contributions: ${lastYearContributions}`);
  console.log(`💀 Total Commits (all time): ${totalCommitsAllTime}`);
  console.log(`💀 Last Year Commits: ${lastYearCommits}`);
}

run();
