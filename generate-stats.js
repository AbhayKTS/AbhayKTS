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
        }
      }
    }
  `;

  const res = await axios.post(
    "https://api.github.com/graphql",
    { query },
    { headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}` } }
  );

  const total = res.data.data.user.contributionsCollection.contributionCalendar.totalContributions;

  // Canvas size
  const width = 1300;
  const height = 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // === Outer Background (Dark King) ===
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, width, height);

  // === Glowing Blood Red Border ===
  ctx.shadowColor = "#ff2e2e";
  ctx.shadowBlur = 25;
  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 6;
  ctx.strokeRect(25, 25, width - 50, height - 50);

  // === Title ===
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 48px Sans-serif";
  ctx.fillText("Shadow Blade GitHub Stats", 60, 120);

  // === Horizontal Divider ===
  ctx.strokeStyle = "#ff2e2e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 140);
  ctx.lineTo(width - 60, 140);
  ctx.stroke();

  // === Subtext ===
  ctx.fillStyle = "#c7c7c7";
  ctx.font = "32px Sans-serif";
  ctx.fillText(`Total Contributions:`, 60, 210);

  // === Big Red Number ===
  ctx.fillStyle = "#ff2e2e";
  ctx.font = "bold 70px Sans-serif";
  ctx.fillText(`${total}`, 460, 215);

  fs.writeFileSync("stats.png", canvas.toBuffer("image/png"));
}

run();
