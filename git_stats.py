"""
⚔️ CHAOS IMMORTAL — Real GitHub Stats
Fetches your REAL GitHub contribution data via the GraphQL API.
Shows the exact same numbers as your GitHub profile calendar:
  - Total contributions (lifetime)
  - Last year contributions
  - Total commits (lifetime & last year)
  - Current streak & longest streak
  - Top repositories by commits
"""

import json
import sys
import os
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# ─── CONFIGURATION ───────────────────────────────────────────
GITHUB_USERNAME = os.environ.get("GITHUB_USERNAME", "AbhayKTS")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")  # Set via env var or paste here
# ─────────────────────────────────────────────────────────────

GRAPHQL_URL = "https://api.github.com/graphql"


def graphql_request(query, token):
    """Send a GraphQL request to GitHub API."""
    headers = {
        "Authorization": f"bearer {token}",
        "Content-Type": "application/json",
    }
    data = json.dumps({"query": query}).encode("utf-8")
    req = Request(GRAPHQL_URL, data=data, headers=headers, method="POST")
    try:
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        body = e.read().decode("utf-8")
        print(f"  ❌ GitHub API error {e.code}: {body}")
        sys.exit(1)
    except URLError as e:
        print(f"  ❌ Network error: {e.reason}")
        sys.exit(1)


def fetch_contribution_years(username, token):
    """Fetch all years the user has contributions."""
    query = f"""
    {{
      user(login: "{username}") {{
        contributionsCollection {{
          contributionYears
        }}
      }}
    }}
    """
    result = graphql_request(query, token)
    if "errors" in result:
        print(f"  ❌ API Error: {result['errors'][0]['message']}")
        sys.exit(1)
    return result["data"]["user"]["contributionsCollection"]["contributionYears"]


def fetch_contributions_for_year(username, token, from_date, to_date):
    """Fetch contribution calendar data for a specific date range."""
    query = f"""
    {{
      user(login: "{username}") {{
        contributionsCollection(from: "{from_date}", to: "{to_date}") {{
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalRepositoryContributions
          restrictedContributionsCount
          contributionCalendar {{
            totalContributions
            weeks {{
              contributionDays {{
                date
                contributionCount
              }}
            }}
          }}
        }}
      }}
    }}
    """
    return graphql_request(query, token)


def fetch_top_repos(username, token, top_n=10):
    """Fetch top repositories by commit contributions (last year)."""
    query = f"""
    {{
      user(login: "{username}") {{
        contributionsCollection {{
          commitContributionsByRepository(maxRepositories: {top_n}) {{
            repository {{
              name
              isPrivate
              stargazerCount
            }}
            contributions {{
              totalCount
            }}
          }}
        }}
      }}
    }}
    """
    result = graphql_request(query, token)
    return result["data"]["user"]["contributionsCollection"]["commitContributionsByRepository"]


def calculate_streaks(daily_counts):
    """
    Calculate current streak and longest streak from daily contribution data.
    daily_counts: dict of {date_str: count}
    """
    if not daily_counts:
        return 0, 0

    today = datetime.utcnow().date()
    sorted_dates = sorted(daily_counts.keys())

    # Parse all active dates (days with >= 1 contribution)
    active_dates = set()
    for d_str, count in daily_counts.items():
        if count > 0:
            active_dates.add(datetime.strptime(d_str, "%Y-%m-%d").date())

    if not active_dates:
        return 0, 0

    # Current streak: consecutive days ending at today or yesterday
    current_streak = 0
    check = today
    if check not in active_dates:
        check = today - timedelta(days=1)
    while check in active_dates:
        current_streak += 1
        check -= timedelta(days=1)

    # Longest streak
    sorted_active = sorted(active_dates)
    longest = 1
    current = 1
    for i in range(1, len(sorted_active)):
        diff = (sorted_active[i] - sorted_active[i - 1]).days
        if diff == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1

    return current_streak, longest


def main():
    token = GITHUB_TOKEN
    username = GITHUB_USERNAME

    # Allow command-line overrides
    if len(sys.argv) > 1:
        username = sys.argv[1]
    if len(sys.argv) > 2:
        token = sys.argv[2]

    if not token:
        print()
        print("  ❌ GitHub token required!")
        print()
        print("  Set it via environment variable:")
        print('     $env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxx"')
        print()
        print("  Or pass as argument:")
        print(f"     python git_stats.py {username} ghp_xxxxxxxxxxxx")
        print()
        print("  Create a token at: https://github.com/settings/tokens")
        print("  Required scope: read:user")
        sys.exit(1)

    print()
    print("=" * 60)
    print("  ⚔️  CHAOS IMMORTAL — Real GitHub Stats")
    print("=" * 60)
    print(f"  � User: {username}")
    print(f"  📅 Date: {datetime.utcnow().strftime('%Y-%m-%d')}")
    print()

    # ── Step 1: Get all contribution years ──
    print("  🔍 Fetching contribution years...")
    years = fetch_contribution_years(username, token)
    years.sort()
    print(f"  📆 Active since: {min(years)} ({len(years)} years)")
    print()

    # ── Step 2: Fetch data for EVERY year ──
    all_daily = {}  # date_str -> count (across all years)
    total_contributions_all_time = 0
    total_commits_all_time = 0
    total_prs_all_time = 0
    total_issues_all_time = 0
    total_reviews_all_time = 0
    total_repos_all_time = 0

    # Last year range (GitHub uses trailing 365 days from now)
    now = datetime.utcnow()
    last_year_from = (now - timedelta(days=364)).strftime("%Y-%m-%dT00:00:00Z")
    last_year_to = now.strftime("%Y-%m-%dT23:59:59Z")

    last_year_contributions = 0
    last_year_commits = 0

    for year in years:
        from_dt = f"{year}-01-01T00:00:00Z"
        to_dt = f"{year}-12-31T23:59:59Z"

        # Clamp to not go into the future
        if year == now.year:
            to_dt = now.strftime("%Y-%m-%dT23:59:59Z")

        print(f"  � Fetching {year}...", end=" ", flush=True)
        result = fetch_contributions_for_year(username, token, from_dt, to_dt)
        cc = result["data"]["user"]["contributionsCollection"]
        cal = cc["contributionCalendar"]

        year_total = cal["totalContributions"]
        year_commits = cc["totalCommitContributions"]
        year_prs = cc["totalPullRequestContributions"]
        year_issues = cc["totalIssueContributions"]
        year_reviews = cc["totalPullRequestReviewContributions"]
        year_repos = cc["totalRepositoryContributions"]
        year_private = cc["restrictedContributionsCount"]

        total_contributions_all_time += year_total
        total_commits_all_time += year_commits
        total_prs_all_time += year_prs
        total_issues_all_time += year_issues
        total_reviews_all_time += year_reviews
        total_repos_all_time += year_repos

        # Collect daily data
        for week in cal["weeks"]:
            for day in week["contributionDays"]:
                d = day["date"]
                c = day["contributionCount"]
                all_daily[d] = all_daily.get(d, 0) + c

        print(f"{year_total:,} contributions ({year_commits:,} commits)")

    # ── Step 3: Fetch last year specifically (trailing 365 days) ──
    print(f"\n  📥 Fetching last 365 days...", end=" ", flush=True)
    result_ly = fetch_contributions_for_year(username, token, last_year_from, last_year_to)
    cc_ly = result_ly["data"]["user"]["contributionsCollection"]
    last_year_contributions = cc_ly["contributionCalendar"]["totalContributions"]
    last_year_commits = cc_ly["totalCommitContributions"]
    print(f"{last_year_contributions:,} contributions ({last_year_commits:,} commits)")

    # ── Step 4: Calculate streaks ──
    current_streak, longest_streak = calculate_streaks(all_daily)

    # ── Step 5: Top repos ──
    print(f"\n  📥 Fetching top repositories...")
    top_repos = fetch_top_repos(username, token)

    # ── Step 6: Count active days ──
    active_days = sum(1 for c in all_daily.values() if c > 0)

    # ══════════════════════════════════════════════════════════
    #                      OUTPUT
    # ══════════════════════════════════════════════════════════
    print()
    print("━" * 60)
    print("  🔥 CONTRIBUTION STATS (same as GitHub profile)")
    print("━" * 60)
    print()
    print(f"  📊 Total Contributions (all time):   {total_contributions_all_time:,}")
    print(f"  📊 Last Year Contributions:           {last_year_contributions:,}")
    print()
    print("━" * 60)
    print("  � COMMIT STATS")
    print("━" * 60)
    print()
    print(f"  🔢 Total Commits (all time):          {total_commits_all_time:,}")
    print(f"  � Last Year Commits:                 {last_year_commits:,}")
    print()
    print("━" * 60)
    print("  🔥 STREAK STATS")
    print("━" * 60)
    print()
    print(f"  🔥 Current Streak:                    {current_streak} day(s)")
    print(f"  🏆 Longest Streak:                    {longest_streak} day(s)")
    print(f"  � Active Days (all time):            {active_days:,}")
    print()
    print("━" * 60)
    print("  📋 BREAKDOWN (all time)")
    print("━" * 60)
    print()
    print(f"  � Commits:          {total_commits_all_time:,}")
    print(f"  🔀 Pull Requests:    {total_prs_all_time:,}")
    print(f"  🐛 Issues:           {total_issues_all_time:,}")
    print(f"  👀 Reviews:          {total_reviews_all_time:,}")
    print(f"  📦 Repos Created:    {total_repos_all_time:,}")
    print()
    print("━" * 60)
    print("  🏆 TOP REPOSITORIES (by commits, last year)")
    print("━" * 60)
    print()
    for repo in top_repos:
        name = repo["repository"]["name"]
        private = "🔒" if repo["repository"]["isPrivate"] else "🌐"
        stars = repo["repository"]["stargazerCount"]
        commits = repo["contributions"]["totalCount"]
        print(f"  {private} {name:<30} {commits:>5} commits  ⭐ {stars}")
    print()
    print("━" * 60)
    print("  ⚔️  CHAOS IMMORTAL — stats pulled directly from GitHub")
    print("━" * 60)
    print()


if __name__ == "__main__":
    main()
