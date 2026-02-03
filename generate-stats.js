const axios = require("axios");
const { createCanvas } = require("canvas");
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

  const stats = res.data.data.user;
  const total = stats.contributionsCollection.contributionCalendar.totalContributions;

  const canvas = createCanvas(1200, 300);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0D0D0D";
  ctx.fillRect(0, 0, 1200, 300);

  ctx.fillStyle = "#FF2E2E";
  ctx.font = "40px Arial";
  ctx.fillText(`Total Contributions: ${total}`, 50, 150);

  fs.writeFileSync("stats.png", canvas.toBuffer("image/png"));
}

run();
