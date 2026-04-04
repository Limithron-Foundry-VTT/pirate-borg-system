import { execSync } from "child_process";

export function checkGithubCLI() {
  try {
    execSync("gh --version", { stdio: "ignore" });
    return true;
  } catch (err) {
    throw new Error("GitHub CLI (gh) is not installed or not in PATH.\n" + "Install it from: https://cli.github.com/");
  }
}

export function validateGithubToken() {
  const token = process.env.GITHUB_TOKEN;

  if (!token || token === "ghp_XXX" || token.trim() === "") {
    try {
      execSync("gh auth status", { stdio: "ignore" });
      return null;
    } catch (err) {
      throw new Error(
        "GITHUB_TOKEN is not configured in .env file and gh CLI is not authenticated.\n" +
          "Either:\n" +
          "  1. Authenticate gh CLI: gh auth login\n" +
          "  2. Get a token from: https://github.com/settings/tokens\n" +
          "     Required scopes: repo (for private repos) or public_repo (for public only)\n" +
          "     Add it to your .env file: GITHUB_TOKEN=ghp_your_token_here"
      );
    }
  }

  return token;
}

export function getRepositoryInfo() {
  try {
    const remoteUrl = execSync("git config --get remote.origin.url", {
      encoding: "utf8",
    }).trim();

    let owner, repo;

    if (remoteUrl.startsWith("git@github.com:")) {
      const match = remoteUrl.match(/git@github\.com:(.+?)\/(.+?)\.git$/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }
    } else if (remoteUrl.startsWith("https://github.com/") || remoteUrl.startsWith("http://github.com/")) {
      const match = remoteUrl.match(/github\.com\/(.+?)\/(.+?)(\.git)?$/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }
    }

    if (!owner || !repo) {
      throw new Error(`Could not parse repository from remote URL: ${remoteUrl}`);
    }

    return { owner, repo, fullName: `${owner}/${repo}` };
  } catch (err) {
    throw new Error(`Failed to get repository information: ${err.message}`);
  }
}

export function listPullRequests(options = {}) {
  checkGithubCLI();
  const token = validateGithubToken();
  const repoInfo = getRepositoryInfo();

  try {
    const state = options.state || "open";
    const cmd = `gh pr list --repo ${repoInfo.fullName} --json number,title,author,headRefName --state ${state}`;

    const env = token ? { ...process.env, GH_TOKEN: token } : process.env;

    const output = execSync(cmd, {
      encoding: "utf8",
      env: env,
    });

    return JSON.parse(output);
  } catch (err) {
    if (err.message.includes("Could not resolve to a Repository")) {
      throw new Error(`Repository ${repoInfo.fullName} not found or not accessible. Check your GITHUB_TOKEN permissions.`);
    }
    throw new Error(`Failed to list pull requests: ${err.message}`);
  }
}

export function getPullRequestDetails(prNumber) {
  checkGithubCLI();
  const token = validateGithubToken();
  const repoInfo = getRepositoryInfo();

  try {
    const cmd = `gh pr view ${prNumber} --repo ${repoInfo.fullName} --json number,title,author,headRefName,baseRefName,url`;

    const env = token ? { ...process.env, GH_TOKEN: token } : process.env;

    const output = execSync(cmd, {
      encoding: "utf8",
      env: env,
    });

    return JSON.parse(output);
  } catch (err) {
    if (err.message.includes("could not find pull request")) {
      throw new Error(`Pull request #${prNumber} not found in ${repoInfo.fullName}`);
    }
    throw new Error(`Failed to get PR details: ${err.message}`);
  }
}

export function openPullRequest(prNumber) {
  checkGithubCLI();
  const token = validateGithubToken();
  const repoInfo = getRepositoryInfo();

  try {
    const env = token ? { ...process.env, GH_TOKEN: token } : process.env;

    execSync(`gh pr view ${prNumber} --repo ${repoInfo.fullName} --web`, {
      env: env,
      stdio: "inherit",
    });
  } catch (err) {
    if (err.message.includes("could not find pull request")) {
      throw new Error(`Pull request #${prNumber} not found in ${repoInfo.fullName}`);
    }
    throw new Error(`Failed to open pull request: ${err.message}`);
  }
}
