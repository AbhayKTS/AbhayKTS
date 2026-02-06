const axios = require("axios");
const { createCanvas } = require("canvas");
const fs = require("fs");

async function run() {
  const username = "AbhayKTS";
  const token = process.env.GITHUB_TOKEN;

  // Get contribution years, repos, and commit counts from all repos
  const initQuery = `
    query {
      user(login: "${username}") {
        contributionsCollection {
          contributionYears
          contributionCalendar {
            totalContributions
          }
        }
        repositories(first: 100, privacy: PUBLIC, ownerAffiliations: OWNER) {
          totalCount
          nodes {
            name
            stargazerCount
            defaultBranchRef {
              target {
                ... on Commit {
                  history {
                    totalCount
                  }
                }
              }
            }
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
  
  // Calculate total stars from all repos
  const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);
  
  // Calculate total commits from all repos (actual commit count)
  let totalCommitsFromRepos = 0;
  for (const repo of user.repositories.nodes) {
    if (repo.defaultBranchRef && repo.defaultBranchRef.target && repo.defaultBranchRef.target.history) {
      totalCommitsFromRepos += repo.defaultBranchRef.target.history.totalCount;
    }
  }

  // Fetch ALL years for lifetime contribution totals
  let totalContributionsAllTime = 0;
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
    totalPRsAllTime += cc.totalPullRequestContributions;
    totalIssuesAllTime += cc.totalIssueContributions;
  }

  // Canvas Drawing - NO POWER LEVEL
  const width = 900;
  const height = 420;
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
  const valueX = 450;
  const startY = 130;
  const gap = 50;

  const stats = [
    { label: "Total Contributions:", value: totalContributionsAllTime },
    { label: "Total Commits:", value: totalCommitsFromRepos },
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

  fs.writeFileSync("stats.png", canvas.toBuffer("image/png"));
  console.log("stats.png generated!");
  console.log("Total Contributions:", totalContributionsAllTime);
  console.log("Total Commits (from repos):", totalCommitsFromRepos);
  console.log("Stars:", totalStars);
  console.log("Repos:", totalRepos);
}

run().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
