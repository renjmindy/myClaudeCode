Deploy this project to Vercel and return the live URL.

Follow these steps in order:

## Step 1 — Check Vercel CLI
Run `which vercel` to check if Vercel CLI is installed.
- If not found, install it globally: `npm install -g vercel`
- Verify installation: `vercel --version`

## Step 2 — Check Vercel authentication
Run `vercel whoami` to check if the user is logged in.
- If not authenticated, run `vercel login` and wait for the user to complete browser-based login before continuing.

## Step 3 — Build the project
Run `npm run build` from the project root.
- The build output goes to the `build/` directory (configured in `vite.config.ts`).
- If the build fails, show the error output and stop.

## Step 4 — Deploy to Vercel
Run the following command from the project root:

```
vercel --yes --prod \
  --build-env NODE_ENV=production \
  --local-config vercel.json 2>/dev/null || \
vercel build/ --yes --prod
```

Use this simplified deploy if no `vercel.json` exists:
```
vercel --yes --prod
```

Capture the full output. The deployment URL will appear at the end (format: `https://<project>.vercel.app`).

## Step 5 — Report the result
After a successful deployment:
1. Extract and display the production URL prominently.
2. Tell the user they can open it in a browser to see their live project.

If deployment fails, show the error and suggest:
- Running `vercel login` if it's an auth error.
- Checking build output if it's a build error.
- Running `vercel link` to connect to an existing project if prompted.

## Notes
- This is a static frontend (Vite/React build). The Express backend (`server/server.js`) runs locally and is **not** deployed — Vercel only hosts the frontend.
- The `/api` proxy defined in `vite.config.ts` only works in local dev; in production, API calls will need a backend deployed separately (e.g., Railway, Render).
- Inform the user if any backend-dependent features (auth, score saving) won't work on the deployed version.
