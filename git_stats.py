""""""

⚔️ CHAOS IMMORTAL — Shadow Blade GitHub Stats⚔️ CHAOS IMMORTAL — Real GitHub Stats

Fetches your REAL GitHub contribution data via the GraphQL API.Fetches your REAL GitHub contribution data via the GraphQL API.

Shows the exact same numbers as your GitHub profile calendar with Shadow Blade styling:Shows the exact same numbers as your GitHub profile calendar:

  - Total contributions (lifetime)  - Total contributions (lifetime)

  - Last year contributions    - Last year contributions

  - Total commits (lifetime & last year)  - Total commits (lifetime & last year)

  - Current streak & longest streak  - Current streak & longest streak

  - Top repositories by commits  - Top repositories by commits

""""""



import jsonimport json

import sysimport sys

import osimport os

from datetime import datetime, timedeltafrom datetime import datetime, timedelta

from urllib.request import Request, urlopenfrom urllib.request import Request, urlopen

from urllib.error import HTTPError, URLErrorfrom urllib.error import HTTPError, URLError



# ─── CONFIGURATION ───────────────────────────────────────────# ─── CONFIGURATION ───────────────────────────────────────────

GITHUB_USERNAME = os.environ.get("GITHUB_USERNAME", "AbhayKTS")GITHUB_USERNAME = os.environ.get("GITHUB_USERNAME", "AbhayKTS")

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")  # Set via env var or paste hereGITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")  # Set via env var or paste here

# ─────────────────────────────────────────────────────────────# ─────────────────────────────────────────────────────────────



GRAPHQL_URL = "https://api.github.com/graphql"GRAPHQL_URL = "https://api.github.com/graphql"





def graphql_request(query, token):def graphql_request(query, token):

    """Send a GraphQL request to GitHub API."""    """Send a GraphQL request to GitHub API."""

    headers = {    headers = {

        "Authorization": f"bearer {token}",        "Authorization": f"bearer {token}",

        "Content-Type": "application/json",        "Content-Type": "application/json",

    }    }

    data = json.dumps({"query": query}).encode("utf-8")    data = json.dumps({"query": query}).encode("utf-8")

    req = Request(GRAPHQL_URL, data=data, headers=headers, method="POST")    req = Request(GRAPHQL_URL, data=data, headers=headers, method="POST")

    try:    try:

        with urlopen(req, timeout=30) as resp:        with urlopen(req, timeout=30) as resp:

            return json.loads(resp.read().decode("utf-8"))            return json.loads(resp.read().decode("utf-8"))

    except HTTPError as e:    except HTTPError as e:

        body = e.read().decode("utf-8")        body = e.read().decode("utf-8")

        print(f"  ❌ GitHub API error {e.code}: {body}")        print(f"  ❌ GitHub API error {e.code}: {body}")

        sys.exit(1)        sys.exit(1)

    except URLError as e:    except URLError as e:

        print(f"  ❌ Network error: {e.reason}")        print(f"  ❌ Network error: {e.reason}")

        sys.exit(1)        sys.exit(1)





def fetch_contribution_years(username, token):def fetch_contribution_years(username, token):

    """Fetch all years the user has contributions."""    """Fetch all years the user has contributions."""

    query = f"""    query = f"""

    {{    {{

      user(login: "{username}") {{      user(login: "{username}") {{

        contributionsCollection {{        contributionsCollection {{

          contributionYears          contributionYears

        }}        }}

      }}      }}

    }}    }}

    """    """

    result = graphql_request(query, token)    result = graphql_request(query, token)

    if "errors" in result:    if "errors" in result:

        print(f"  ❌ API Error: {result['errors'][0]['message']}")        print(f"  ❌ API Error: {result['errors'][0]['message']}")

        sys.exit(1)        sys.exit(1)

    return result["data"]["user"]["contributionsCollection"]["contributionYears"]    return result["data"]["user"]["contributionsCollection"]["contributionYears"]





def fetch_contributions_for_year(username, token, from_date, to_date):def fetch_contributions_for_year(username, token, from_date, to_date):

    """Fetch contribution calendar data for a specific date range."""    """Fetch contribution calendar data for a specific date range."""

    query = f"""    query = f"""

    {{    {{

      user(login: "{username}") {{      user(login: "{username}") {{

        contributionsCollection(from: "{from_date}", to: "{to_date}") {{        contributionsCollection(from: "{from_date}", to: "{to_date}") {{

          totalCommitContributions          totalCommitContributions

          totalIssueContributions          totalIssueContributions

          totalPullRequestContributions          totalPullRequestContributions

          totalPullRequestReviewContributions          totalPullRequestReviewContributions

          totalRepositoryContributions          totalRepositoryContributions

          restrictedContributionsCount          restrictedContributionsCount

          contributionCalendar {{          contributionCalendar {{

            totalContributions            totalContributions

            weeks {{            weeks {{

              contributionDays {{              contributionDays {{

                date                date

                contributionCount                contributionCount

              }}              }}

            }}            }}

          }}          }}

        }}        }}

      }}      }}

    }}    }}

    """    """

    return graphql_request(query, token)    return graphql_request(query, token)





def fetch_top_repos(username, token, top_n=10):def fetch_top_repos(username, token, top_n=10):

    """Fetch top repositories by commit contributions (last year)."""    """Fetch top repositories by commit contributions (last year)."""

    query = f"""    query = f"""

    {{    {{

      user(login: "{username}") {{      user(login: "{username}") {{

        contributionsCollection {{        contributionsCollection {{

          commitContributionsByRepository(maxRepositories: {top_n}) {{          commitContributionsByRepository(maxRepositories: {top_n}) {{

            repository {{            repository {{

              name              name

              isPrivate              isPrivate

              stargazerCount              stargazerCount

            }}            }}

            contributions {{            contributions {{

              totalCount              totalCount

            }}            }}

          }}          }}

        }}        }}

      }}      }}

    }}    }}

    """    """

    result = graphql_request(query, token)    result = graphql_request(query, token)

    return result["data"]["user"]["contributionsCollection"]["commitContributionsByRepository"]    return result["data"]["user"]["contributionsCollection"]["commitContributionsByRepository"]





def calculate_streaks(daily_counts):def calculate_streaks(daily_counts):

    """    """

    Calculate current streak and longest streak from daily contribution data.    Calculate current streak and longest streak from daily contribution data.

    daily_counts: dict of {date_str: count}    daily_counts: dict of {date_str: count}

    """    """

    if not daily_counts:    if not daily_counts:

        return 0, 0        return 0, 0



    today = datetime.utcnow().date()    today = datetime.utcnow().date()

    sorted_dates = sorted(daily_counts.keys())    sorted_dates = sorted(daily_counts.keys())



    # Parse all active dates (days with >= 1 contribution)    # Parse all active dates (days with >= 1 contribution)

    active_dates = set()    active_dates = set()

    for d_str, count in daily_counts.items():    for d_str, count in daily_counts.items():

        if count > 0:        if count > 0:

            active_dates.add(datetime.strptime(d_str, "%Y-%m-%d").date())            active_dates.add(datetime.strptime(d_str, "%Y-%m-%d").date())



    if not active_dates:    if not active_dates:

        return 0, 0        return 0, 0



    # Current streak: consecutive days ending at today or yesterday    # Current streak: consecutive days ending at today or yesterday

    current_streak = 0    current_streak = 0

    check = today    check = today

    if check not in active_dates:    if check not in active_dates:

        check = today - timedelta(days=1)        check = today - timedelta(days=1)

    while check in active_dates:    while check in active_dates:

        current_streak += 1        current_streak += 1

        check -= timedelta(days=1)        check -= timedelta(days=1)



    # Longest streak    # Longest streak

    sorted_active = sorted(active_dates)    sorted_active = sorted(active_dates)

    longest = 1    longest = 1

    current = 1    current = 1

    for i in range(1, len(sorted_active)):    for i in range(1, len(sorted_active)):

        diff = (sorted_active[i] - sorted_active[i - 1]).days        diff = (sorted_active[i] - sorted_active[i - 1]).days

        if diff == 1:        if diff == 1:

            current += 1            current += 1

            longest = max(longest, current)            longest = max(longest, current)

        else:        else:

            current = 1            current = 1



    return current_streak, longest    return current_streak, longest





def main():def main():

    token = GITHUB_TOKEN    token = GITHUB_TOKEN

    username = GITHUB_USERNAME    username = GITHUB_USERNAME



    # Allow command-line overrides    # Allow command-line overrides

    if len(sys.argv) > 1:    if len(sys.argv) > 1:

        username = sys.argv[1]        username = sys.argv[1]

    if len(sys.argv) > 2:    if len(sys.argv) > 2:

        token = sys.argv[2]        token = sys.argv[2]



    if not token:    if not token:

        print()        print()

        print("  ❌ GitHub token required!")        print("  ❌ GitHub token required!")

        print()        print()

        print("  Set it via environment variable:")        print("  Set it via environment variable:")

        print('     $env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxx"')        print('     $env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxx"')

        print()        print()

        print("  Or pass as argument:")        print("  Or pass as argument:")

        print(f"     python git_stats.py {username} ghp_xxxxxxxxxxxx")        print(f"     python git_stats.py {username} ghp_xxxxxxxxxxxx")

        print()        print()

        print("  Create a token at: https://github.com/settings/tokens")        print("  Create a token at: https://github.com/settings/tokens")

        print("  Required scope: read:user")        print("  Required scope: read:user")

        sys.exit(1)        sys.exit(1)



    print()    print()

    print("🩸" + "=" * 58 + "🩸")    print("=" * 60)

    print("    🩸 Shadow Blade GitHub Stats")    print("  ⚔️  CHAOS IMMORTAL — Real GitHub Stats")

    print("🩸" + "=" * 58 + "🩸")    print("=" * 60)

    print(f"    👤 Shadow Blade: {username}")    print(f"  � User: {username}")

    print(f"    📅 Blood Moon Date: {datetime.utcnow().strftime('%Y-%m-%d')}")    print(f"  📅 Date: {datetime.utcnow().strftime('%Y-%m-%d')}")

    print()    print()



    # ── Step 1: Get all contribution years ──    # ── Step 1: Get all contribution years ──

    print("    🔍 Scanning battlefield for contribution years...")    print("  🔍 Fetching contribution years...")

    years = fetch_contribution_years(username, token)    years = fetch_contribution_years(username, token)

    years.sort()    years.sort()

    print(f"    📆 Active since: {min(years)} ({len(years)} years of dominance)")    print(f"  📆 Active since: {min(years)} ({len(years)} years)")

    print()    print()



    # ── Step 2: Fetch data for EVERY year ──    # ── Step 2: Fetch data for EVERY year ──

    all_daily = {}  # date_str -> count (across all years)    all_daily = {}  # date_str -> count (across all years)

    total_contributions_all_time = 0    total_contributions_all_time = 0

    total_commits_all_time = 0    total_commits_all_time = 0

    total_prs_all_time = 0    total_prs_all_time = 0

    total_issues_all_time = 0    total_issues_all_time = 0

    total_reviews_all_time = 0    total_reviews_all_time = 0

    total_repos_all_time = 0    total_repos_all_time = 0



    # Last year range (GitHub uses trailing 365 days from now)    # Last year range (GitHub uses trailing 365 days from now)

    now = datetime.utcnow()    now = datetime.utcnow()

    last_year_from = (now - timedelta(days=364)).strftime("%Y-%m-%dT00:00:00Z")    last_year_from = (now - timedelta(days=364)).strftime("%Y-%m-%dT00:00:00Z")

    last_year_to = now.strftime("%Y-%m-%dT23:59:59Z")    last_year_to = now.strftime("%Y-%m-%dT23:59:59Z")



    last_year_contributions = 0    last_year_contributions = 0

    last_year_commits = 0    last_year_commits = 0



    for year in years:    for year in years:

        from_dt = f"{year}-01-01T00:00:00Z"        from_dt = f"{year}-01-01T00:00:00Z"

        to_dt = f"{year}-12-31T23:59:59Z"        to_dt = f"{year}-12-31T23:59:59Z"



        # Clamp to not go into the future        # Clamp to not go into the future

        if year == now.year:        if year == now.year:

            to_dt = now.strftime("%Y-%m-%dT23:59:59Z")            to_dt = now.strftime("%Y-%m-%dT23:59:59Z")



        print(f"    📥 Harvesting {year}...", end=" ", flush=True)        print(f"  � Fetching {year}...", end=" ", flush=True)

        result = fetch_contributions_for_year(username, token, from_dt, to_dt)        result = fetch_contributions_for_year(username, token, from_dt, to_dt)

        cc = result["data"]["user"]["contributionsCollection"]        cc = result["data"]["user"]["contributionsCollection"]

        cal = cc["contributionCalendar"]        cal = cc["contributionCalendar"]



        year_total = cal["totalContributions"]        year_total = cal["totalContributions"]

        year_commits = cc["totalCommitContributions"]        year_commits = cc["totalCommitContributions"]

        year_prs = cc["totalPullRequestContributions"]        year_prs = cc["totalPullRequestContributions"]

        year_issues = cc["totalIssueContributions"]        year_issues = cc["totalIssueContributions"]

        year_reviews = cc["totalPullRequestReviewContributions"]        year_reviews = cc["totalPullRequestReviewContributions"]

        year_repos = cc["totalRepositoryContributions"]        year_repos = cc["totalRepositoryContributions"]

        year_private = cc["restrictedContributionsCount"]        year_private = cc["restrictedContributionsCount"]



        total_contributions_all_time += year_total        total_contributions_all_time += year_total

        total_commits_all_time += year_commits        total_commits_all_time += year_commits

        total_prs_all_time += year_prs        total_prs_all_time += year_prs

        total_issues_all_time += year_issues        total_issues_all_time += year_issues

        total_reviews_all_time += year_reviews        total_reviews_all_time += year_reviews

        total_repos_all_time += year_repos        total_repos_all_time += year_repos



        # Collect daily data        # Collect daily data

        for week in cal["weeks"]:        for week in cal["weeks"]:

            for day in week["contributionDays"]:            for day in week["contributionDays"]:

                d = day["date"]                d = day["date"]

                c = day["contributionCount"]                c = day["contributionCount"]

                all_daily[d] = all_daily.get(d, 0) + c                all_daily[d] = all_daily.get(d, 0) + c



        print(f"{year_total:,} souls ({year_commits:,} kills)")        print(f"{year_total:,} contributions ({year_commits:,} commits)")



    # ── Step 3: Fetch last year specifically (trailing 365 days) ──    # ── Step 3: Fetch last year specifically (trailing 365 days) ──

    print(f"\n    📥 Harvesting last 365 days...", end=" ", flush=True)    print(f"\n  📥 Fetching last 365 days...", end=" ", flush=True)

    result_ly = fetch_contributions_for_year(username, token, last_year_from, last_year_to)    result_ly = fetch_contributions_for_year(username, token, last_year_from, last_year_to)

    cc_ly = result_ly["data"]["user"]["contributionsCollection"]    cc_ly = result_ly["data"]["user"]["contributionsCollection"]

    last_year_contributions = cc_ly["contributionCalendar"]["totalContributions"]    last_year_contributions = cc_ly["contributionCalendar"]["totalContributions"]

    last_year_commits = cc_ly["totalCommitContributions"]    last_year_commits = cc_ly["totalCommitContributions"]

    print(f"{last_year_contributions:,} souls ({last_year_commits:,} kills)")    print(f"{last_year_contributions:,} contributions ({last_year_commits:,} commits)")



    # ── Step 4: Calculate streaks ──    # ── Step 4: Calculate streaks ──

    current_streak, longest_streak = calculate_streaks(all_daily)    current_streak, longest_streak = calculate_streaks(all_daily)



    # ── Step 5: Top repos ──    # ── Step 5: Top repos ──

    print(f"\n    📥 Scanning shadow arsenal...")    print(f"\n  📥 Fetching top repositories...")

    top_repos = fetch_top_repos(username, token)    top_repos = fetch_top_repos(username, token)



    # ── Step 6: Count active days ──    # ── Step 6: Count active days ──

    active_days = sum(1 for c in all_daily.values() if c > 0)    active_days = sum(1 for c in all_daily.values() if c > 0)



    # ══════════════════════════════════════════════════════════    # ══════════════════════════════════════════════════════════

    #                    SHADOW BLADE STATUS    #                      OUTPUT

    # ══════════════════════════════════════════════════════════    # ══════════════════════════════════════════════════════════

    print()    print()

    print("┌" + "─" * 58 + "┐")    print("━" * 60)

    print("│ Shadow Blade Status — S-Rank Developer              │")    print("  🔥 CONTRIBUTION STATS (same as GitHub profile)")

    print("└" + "─" * 58 + "┘")    print("━" * 60)

    print()    print()

    print(f"🔥 Total Contributions:               {total_contributions_all_time:,}")    print(f"  📊 Total Contributions (all time):   {total_contributions_all_time:,}")

    print(f"💀 Real Total Commits:                {total_commits_all_time:,}")    print(f"  📊 Last Year Contributions:           {last_year_contributions:,}")

    print(f"🗡️  Pull Requests:                    {total_prs_all_time:,}")    print()

    print(f"🛡️  Issues Opened:                    {total_issues_all_time:,}")    print("━" * 60)

    total_stars = sum(repo['repository']['stargazerCount'] for repo in top_repos)    print("  � COMMIT STATS")

    public_repos = len([r for r in top_repos if not r['repository']['isPrivate']])    print("━" * 60)

    print(f"⭐ Stars Received:                   {total_stars:,}")    print()

    print(f"📦 Public Repositories:              {public_repos:,}")    print(f"  🔢 Total Commits (all time):          {total_commits_all_time:,}")

    print()    print(f"  � Last Year Commits:                 {last_year_commits:,}")

    print("⚡Power Level")    print()

    print()    print("━" * 60)

    print("┌" + "─" * 58 + "┐")    print("  🔥 STREAK STATS")

    print("│ Contribution Graph — Bloodline of Code              │")    print("━" * 60)

    print("└" + "─" * 58 + "┘")    print()

    print()    print(f"  🔥 Current Streak:                    {current_streak} day(s)")

    print(f"🔥 Current Streak:                    {current_streak} day(s)")    print(f"  🏆 Longest Streak:                    {longest_streak} day(s)")

    print(f"🏆 Longest Streak:                    {longest_streak} day(s)")    print(f"  � Active Days (all time):            {active_days:,}")

    print(f"📅 Last Year Contributions:           {last_year_contributions:,}")    print()

    print(f"💀 Last Year Commits:                 {last_year_commits:,}")    print("━" * 60)

    print(f"📊 Active Days (immortal):            {active_days:,}")    print("  📋 BREAKDOWN (all time)")

    print()    print("━" * 60)

    print("🩸" + "═" * 58 + "🩸")    print()

    print("  🏆 SHADOW ARSENAL (top repos by kills)")    print(f"  � Commits:          {total_commits_all_time:,}")

    print("🩸" + "═" * 58 + "🩸")    print(f"  🔀 Pull Requests:    {total_prs_all_time:,}")

    print()    print(f"  🐛 Issues:           {total_issues_all_time:,}")

    for i, repo in enumerate(top_repos[:10], 1):    print(f"  👀 Reviews:          {total_reviews_all_time:,}")

        name = repo["repository"]["name"]    print(f"  📦 Repos Created:    {total_repos_all_time:,}")

        private = "🔒" if repo["repository"]["isPrivate"] else "🌐"    print()

        stars = repo["repository"]["stargazerCount"]    print("━" * 60)

        commits = repo["contributions"]["totalCount"]    print("  🏆 TOP REPOSITORIES (by commits, last year)")

        print(f"  {i:2}. {private} {name:<25} {commits:>4} kills  ⭐ {stars}")    print("━" * 60)

    print()    print()

    print("🩸" + "═" * 58 + "🩸")    for repo in top_repos:

    print("  ⚔️  CHAOS IMMORTAL — Shadow Blade dominance confirmed")        name = repo["repository"]["name"]

    print("🩸" + "═" * 58 + "🩸")        private = "🔒" if repo["repository"]["isPrivate"] else "🌐"

    print()        stars = repo["repository"]["stargazerCount"]

        commits = repo["contributions"]["totalCount"]

        print(f"  {private} {name:<30} {commits:>5} commits  ⭐ {stars}")

if __name__ == "__main__":    print()

    main()    print("━" * 60)
    print("  ⚔️  CHAOS IMMORTAL — stats pulled directly from GitHub")
    print("━" * 60)
    print()


if __name__ == "__main__":
    main()
