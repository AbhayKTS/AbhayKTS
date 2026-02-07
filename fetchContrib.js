export async function getGitHubContributions(username, token) {
  const query = `
    query {
      user(login: "${username}") {
        contributionsCollection {
          contributionCalendar {
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

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query })
  });

  const json = await res.json();

  return json.data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap(week => week.contributionDays)
    .map(day => ({
      date: day.date,
      count: day.contributionCount
    }));
}
