const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

async function run() {
  const query = `
    query {
      user(login: "AbhayKTS") {
        name
        contributionsCollection {
          contributionCalendar {
            totalContributions
          }
        }
        repositories {
          totalCount
        }
      }
    }
  `;

  const res = await axios.post(
    "https://api.github.com/graphql",
    { query },
    {
      headers: {
        Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
      },
    }
  );

  const user = res.data.data.user;
  const total = user.contributionsCollection.contributionCalendar.totalContributions;

  // Canvas setup
  const width = 1400;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // === BACKGROUND (Dark King Black) ===
  ctx.fillStyle = "#0a0a0a";  // pure dark background
  ctx.fillRect(0, 0, width, height);

  // === BLOOD RED BORDER ===
  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 8;
  ctx.roundRect(20, 20, width - 40, height - 40, 25);
  ctx.stroke();

  // === TITLE ===
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 50px Sans-serif";
  ctx.fillText("CHAOS IMMORTAL — SHADOW BLADE STATS", 50, 100);

  // === SUBTEXT (anime hacker style) ===
  ctx.fillStyle = "#c7c7c7";
  ctx.font = "28px Sans-serif";
  ctx.fillText(`Total Contributions: ${total}`, 50, 180);

  ctx.fillStyle = "#999";
  ctx.font = "24px Sans-serif";
  ctx.fillText("Powered by GitHub GraphQL — Rendered by Chaos Engine", 50, 300);

  // Save output
  fs.writeFileSync("stats.png", canvas.toBuffer("image/png"));
}

run();
