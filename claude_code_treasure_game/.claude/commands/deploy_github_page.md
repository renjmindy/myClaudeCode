Deploy the Treasure Hunt Game to GitHub Pages with automatic repository setup and authentication handling.

Follow these steps in order:

## Step 1 — Check GitHub CLI

Run `which gh` to check if the GitHub CLI is installed.
- If not found, install it: `npm install -g gh` or instruct the user to install from https://cli.github.com
- Verify installation: `gh --version`

## Step 2 — Check GitHub authentication

Run `gh auth status` to check if the user is logged in.
- If not authenticated, run `gh auth login` and wait for the user to complete the browser-based login before continuing.
- After login, confirm with `gh auth status` again.

## Step 3 — Determine repository info

Run the following to get the current GitHub username and detect the repo:

```bash
gh api user --jq '.login'
```

Then check if the project already has a remote GitHub repo:

```bash
git remote get-url origin 2>/dev/null
```

- If a remote exists, extract the repo name from the URL (e.g., `git@github.com:user/repo.git` → repo name is `repo`).
- If no remote exists, use the current directory name as the default repo name: `basename $(pwd)`.
- Ask the user to confirm or provide a custom repo name if the default looks wrong.

## Step 4 — Create GitHub repository if needed

If no remote origin exists, create the repo on GitHub:

```bash
gh repo create <repo-name> --public --source=. --remote=origin --push
```

- Use `--public` by default. If the user prefers private, use `--private` (note: GitHub Pages requires a paid plan for private repos).
- If the repo already exists on GitHub but has no remote set locally, link it:

```bash
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

## Step 5 — Configure Vite base path for GitHub Pages

GitHub Pages serves the site from `https://<username>.github.io/<repo-name>/`, so Vite must be built with the correct `base` path.

Set the base at build time using the `--base` flag — **do NOT permanently modify `vite.config.ts`**:

```bash
npx vite build --base=/<repo-name>/
```

This produces a `build/` directory with all asset paths prefixed correctly.

## Step 6 — Install and run gh-pages deployer

Install `gh-pages` as a dev dependency if not already present:

```bash
npm list gh-pages 2>/dev/null | grep gh-pages || npm install --save-dev gh-pages
```

Then deploy the `build/` directory to the `gh-pages` branch:

```bash
npx gh-pages -d build
```

This pushes the contents of `build/` to a `gh-pages` branch on origin, creating it if it doesn't exist.

## Step 7 — Enable GitHub Pages on the repository

Run the following to configure GitHub Pages to serve from the `gh-pages` branch:

```bash
gh api repos/<username>/<repo-name>/pages \
  --method POST \
  -f source[branch]=gh-pages \
  -f source[path]=/ 2>/dev/null || \
gh api repos/<username>/<repo-name>/pages \
  --method PUT \
  -f source[branch]=gh-pages \
  -f source[path]=/
```

- The POST creates the Pages config for the first time; the PUT updates it if it already exists. Both attempts are expected — ignore errors from whichever one doesn't apply.

## Step 8 — Report the result

After a successful deployment:

1. Display the live URL prominently:
   ```
   https://<username>.github.io/<repo-name>/
   ```
2. Note that GitHub Pages may take **1–2 minutes** to go live after the first deployment.
3. Tell the user they can check deployment status at:
   ```
   https://github.com/<username>/<repo-name>/actions
   ```

If deployment fails, diagnose and suggest:
- `gh auth login` — if it's an authentication error.
- Check `git remote -v` — if push fails due to missing remote.
- `gh repo view` — to confirm the repo exists and is accessible.
- Re-run `npx gh-pages -d build` — if only the Pages push step failed.

## Notes

- This is a **static frontend deployment only**. The Express backend (`server/server.js`) is not deployed — backend-dependent features (sign in, sign up, score saving/history) will not work on the GitHub Pages version.
- Guest play (no account required) will work fine on the deployed version.
- The `build/` output directory is gitignored locally and only pushed to the remote `gh-pages` branch by the `gh-pages` tool.
- If the user wants a custom domain, they can add a `CNAME` file to `public/` before building, then configure it in repo Settings → Pages.
