const axios = require("axios");const axios = require("axios");const axios = require("axios");

const { createCanvas } = require("canvas");

const fs = require("fs");const { createCanvas } = require("canvas");const { createCanvas } = require("canvas");



async function run() {const fs = require("fs");const fs = require("fs");

  const username = "AbhayKTS";

  const token = process.env.GITHUB_TOKEN;



  // Step 1: Get contribution yearsasync function run() {async function run() {

  const yearsQuery = `

    query {  // Query for all-time stats + contribution years  const query = `

      user(login: "${username}") {

        contributionsCollection {  const query = `    query {

          contributionYears

        }    query {      user(login: "AbhayKTS") {

        repositories(first: 100, ownerAffiliations: OWNER) {

          totalCount      user(login: "AbhayKTS") {        name

          nodes {

            stargazerCount        name        contributionsCollection {

          }

        }        contributionsCollection {          contributionCalendar {

      }

    }          contributionCalendar {            totalContributions

  `;

            totalContributions          }

  const yearsRes = await axios.post(

    "https://api.github.com/graphql",          }          totalCommitContributions

    { query: yearsQuery },

    { headers: { Authorization: `bearer ${token}` } }          totalCommitContributions          totalIssueContributions

  );

          totalIssueContributions          totalPullRequestContributions

  const user = yearsRes.data.data.user;

  const years = user.contributionsCollection.contributionYears;          totalPullRequestContributions        }

  const totalRepos = user.repositories.totalCount;

  const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);          contributionYears        repositories(first: 100) {



  // Step 2: Fetch ALL years for lifetime totals        }          totalCount

  let totalContributionsAllTime = 0;

  let totalCommitsAllTime = 0;        repositories(first: 100, ownerAffiliations: OWNER) {        }

  let totalPRsAllTime = 0;

  let totalIssuesAllTime = 0;          totalCount        starredRepositories {



  for (const year of years) {          nodes {          totalCount

    const fromDt = `${year}-01-01T00:00:00Z`;

    let toDt = `${year}-12-31T23:59:59Z`;            stargazerCount        }



    const now = new Date();          }      }

    if (year === now.getFullYear()) {

      toDt = now.toISOString();        }    }

    }

      }  `;

    const yearQuery = `

      query {    }

        user(login: "${username}") {

          contributionsCollection(from: "${fromDt}", to: "${toDt}") {  `;  const res = await axios.post(

            contributionCalendar {

              totalContributions    "https://api.github.com/graphql",

            }

            totalCommitContributions  const res = await axios.post(    { query },

            totalPullRequestContributions

            totalIssueContributions    "https://api.github.com/graphql",    { headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}` } }

          }

        }    { query },  );

      }

    `;    { headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}` } }



    const yearRes = await axios.post(  );  const user = res.data.data.user;

      "https://api.github.com/graphql",

      { query: yearQuery },

      { headers: { Authorization: `bearer ${token}` } }

    );  const user = res.data.data.user;  const totalContributions = user.contributionsCollection.contributionCalendar.totalContributions;



    const cc = yearRes.data.data.user.contributionsCollection;  const years = user.contributionsCollection.contributionYears;  const totalCommits = user.contributionsCollection.totalCommitContributions;

    totalContributionsAllTime += cc.contributionCalendar.totalContributions;

    totalCommitsAllTime += cc.totalCommitContributions;  const totalPRs = user.contributionsCollection.totalPullRequestContributions;

    totalPRsAllTime += cc.totalPullRequestContributions;

    totalIssuesAllTime += cc.totalIssueContributions;  // Fetch ALL years' contributions for lifetime total  const totalIssues = user.contributionsCollection.totalIssueContributions;

  }

  let totalContributionsAllTime = 0;  const totalStars = user.starredRepositories.totalCount;

  // Step 3: Last year (trailing 365 days)

  const now = new Date();  let totalCommitsAllTime = 0;  const totalRepos = user.repositories.totalCount;

  const lastYearFrom = new Date(now.getTime() - 364 * 24 * 60 * 60 * 1000).toISOString();

  const lastYearTo = now.toISOString();



  const lastYearQuery = `  for (const year of years) {  // Power Level

    query {

      user(login: "${username}") {    const fromDt = `${year}-01-01T00:00:00Z`;  const powerLevel = (totalContributions + totalCommits) * 6; // anime scaling

        contributionsCollection(from: "${lastYearFrom}", to: "${lastYearTo}") {

          contributionCalendar {    let toDt = `${year}-12-31T23:59:59Z`;  const maxPower = 3000;

            totalContributions

          }      const barFill = Math.min(powerLevel / maxPower, 1);

          totalCommitContributions

        }    // Clamp current year to now

      }

    }    const now = new Date();  // Canvas

  `;

    if (year === now.getFullYear()) {  const width = 1300;

  const lastYearRes = await axios.post(

    "https://api.github.com/graphql",      toDt = now.toISOString();  const height = 650;

    { query: lastYearQuery },

    { headers: { Authorization: `bearer ${token}` } }    }  const canvas = createCanvas(width, height);

  );

  const ctx = canvas.getContext("2d");

  const lastYearContributions = lastYearRes.data.data.user.contributionsCollection.contributionCalendar.totalContributions;

  const lastYearCommits = lastYearRes.data.data.user.contributionsCollection.totalCommitContributions;    const yearQuery = `



  // Power Level calculation      query {  // Background

  const powerLevel = (totalContributionsAllTime + totalCommitsAllTime) * 6;

  const maxPower = 5000;        user(login: "AbhayKTS") {  ctx.fillStyle = "#090909";

  const barFill = Math.min(powerLevel / maxPower, 1);

          contributionsCollection(from: "${fromDt}", to: "${toDt}") {  ctx.fillRect(0, 0, width, height);

  // ═══════════════════════════════════════════════════════════

  //                    CANVAS DRAWING            contributionCalendar {

  // ═══════════════════════════════════════════════════════════

              totalContributions  // Outer neon border

  const width = 900;

  const height = 620;            }  ctx.shadowColor = "#ff2e2e";

  const canvas = createCanvas(width, height);

  const ctx = canvas.getContext("2d");            totalCommitContributions  ctx.shadowBlur = 30;



  // Background          }  ctx.strokeStyle = "#ff2e2e";

  ctx.fillStyle = "#0d0d0d";

  ctx.fillRect(0, 0, width, height);        }  ctx.lineWidth = 7;



  // Outer neon border      }  ctx.strokeRect(25, 25, width - 50, height - 50);

  const pad = 20;

  ctx.shadowColor = "#ff2e2e";    `;  ctx.shadowBlur = 0;

  ctx.shadowBlur = 20;

  ctx.strokeStyle = "#ff2e2e";

  ctx.lineWidth = 4;

  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);    const yearRes = await axios.post(  // Title

  ctx.shadowBlur = 0;

      "https://api.github.com/graphql",  ctx.fillStyle = "#ff2e2e";

  // Title - INSIDE the box, centered

  ctx.fillStyle = "#ff2e2e";      { query: yearQuery },  ctx.font = "bold 55px Sans-serif";

  ctx.font = "bold 36px Sans-serif";

  const title = "Shadow Blade Status — S-Rank Developer";      { headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}` } }  ctx.fillText("Shadow Blade Status — S-Rank Developer", 60, 120);

  const titleWidth = ctx.measureText(title).width;

  ctx.fillText(title, (width - titleWidth) / 2, 70);    );



  // Stats section  // Divider

  ctx.fillStyle = "#d0d0d0";

  ctx.font = "28px Sans-serif";    totalContributionsAllTime += yearRes.data.data.user.contributionsCollection.contributionCalendar.totalContributions;  ctx.strokeStyle = "#ff2e2e";



  const startX = 50;    totalCommitsAllTime += yearRes.data.data.user.contributionsCollection.totalCommitContributions;  ctx.lineWidth = 3;

  const valueX = 420;

  const startY = 130;  }  ctx.beginPath();

  const gap = 48;

  ctx.moveTo(60, 140);

  const stats = [

    { icon: "🔥", label: "Total Contributions:", value: totalContributionsAllTime },  // Last year (trailing 365 days) stats  ctx.lineTo(width - 60, 140);

    { icon: "📅", label: "Last Year Contributions:", value: lastYearContributions },

    { icon: "💀", label: "Total Commits:", value: totalCommitsAllTime },  const now = new Date();  ctx.stroke();

    { icon: "📅", label: "Last Year Commits:", value: lastYearCommits },

    { icon: "⚔️", label: "Pull Requests:", value: totalPRsAllTime },  const lastYearFrom = new Date(now.getTime() - 364 * 24 * 60 * 60 * 1000).toISOString();

    { icon: "🛡️", label: "Issues Opened:", value: totalIssuesAllTime },

    { icon: "⭐", label: "Stars Received:", value: totalStars },  const lastYearTo = now.toISOString();  // Stats

    { icon: "📦", label: "Public Repositories:", value: totalRepos },

  ];  ctx.fillStyle = "#c7c7c7";



  stats.forEach((stat, i) => {  const lastYearQuery = `  ctx.font = "35px Sans-serif";

    const y = startY + gap * i;

    ctx.fillStyle = "#d0d0d0";    query {

    ctx.fillText(`${stat.icon} ${stat.label}`, startX, y);

    ctx.fillStyle = "#ffffff";      user(login: "AbhayKTS") {  const startY = 200;

    ctx.font = "bold 28px Sans-serif";

    ctx.fillText(`${stat.value}`, valueX, y);        contributionsCollection(from: "${lastYearFrom}", to: "${lastYearTo}") {  const gap = 60;

    ctx.font = "28px Sans-serif";

  });          contributionCalendar {



  // Power Level title            totalContributions  ctx.fillText(`🔥 Total Contributions:     ${totalContributions}`, 60, startY);

  ctx.fillStyle = "#ff2e2e";

  ctx.font = "bold 32px Sans-serif";          }  ctx.fillText(`🖥️ Real Total Commits:     ${totalCommits}`, 60, startY + gap);

  ctx.fillText("⚡ Power Level", startX, startY + gap * 8 + 20);

          totalCommitContributions  ctx.fillText(`⚔️ Pull Requests:           ${totalPRs}`, 60, startY + gap * 2);

  // Power bar

  const barX = startX;        }  ctx.fillText(`🐞 Issues Opened:           ${totalIssues}`, 60, startY + gap * 3);

  const barY = startY + gap * 8 + 45;

  const barWidth = width - startX * 2 - 100;      }  ctx.fillText(`⭐ Stars Received:          ${totalStars}`, 60, startY + gap * 4);

  const barHeight = 40;

    }  ctx.fillText(`📦 Public Repositories:     ${totalRepos}`, 60, startY + gap * 5);

  // Bar border

  ctx.strokeStyle = "#ff2e2e";  `;

  ctx.lineWidth = 3;

  ctx.strokeRect(barX, barY, barWidth, barHeight);  // Power level title



  // Gradient fill  const lastYearRes = await axios.post(  ctx.fillStyle = "#ff2e2e";

  const fillWidth = barWidth * barFill;

  const gradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);    "https://api.github.com/graphql",  ctx.font = "bold 45px Sans-serif";

  gradient.addColorStop(0, "#330000");

  gradient.addColorStop(0.5, "#ff1e1e");    { query: lastYearQuery },  ctx.fillText("⚡ Power Level", 60, startY + gap * 6 + 40);

  gradient.addColorStop(1, "#ff4d4d");

    { headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}` } }

  ctx.fillStyle = gradient;

  ctx.fillRect(barX + 2, barY + 2, fillWidth - 4, barHeight - 4);  );  // Power bar



  // Power number  const barX = 60;

  ctx.fillStyle = "#ff2e2e";

  ctx.font = "bold 32px Sans-serif";  const lastYearContributions = lastYearRes.data.data.user.contributionsCollection.contributionCalendar.totalContributions;  const barY = startY + gap * 6 + 80;

  ctx.fillText(`${powerLevel}`, barX + barWidth + 15, barY + 30);

  const lastYearCommits = lastYearRes.data.data.user.contributionsCollection.totalCommitContributions;  const barWidth = 1100;

  // Save image

  fs.writeFileSync("stats.png", canvas.toBuffer("image/png"));  const barHeight = 50;

  

  console.log("✅ stats.png generated!");  // Other stats

  console.log(`🔥 Total Contributions: ${totalContributionsAllTime}`);

  console.log(`📅 Last Year Contributions: ${lastYearContributions}`);  const totalPRs = user.contributionsCollection.totalPullRequestContributions;  ctx.strokeStyle = "#ff2e2e";

  console.log(`💀 Total Commits: ${totalCommitsAllTime}`);

  console.log(`📅 Last Year Commits: ${lastYearCommits}`);  const totalIssues = user.contributionsCollection.totalIssueContributions;  ctx.lineWidth = 4;

  console.log(`⚡ Power Level: ${powerLevel}`);

}  const totalRepos = user.repositories.totalCount;  ctx.strokeRect(barX, barY, barWidth, barHeight);



run().catch(err => {  const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);

  console.error("❌ Error:", err.message);

  process.exit(1);  // Gradient fill

});

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
