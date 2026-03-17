Deploy this project to Vercel and return the live URL.

Follow these steps carefully:

## Step 1 — Check Vercel CLI

Run `vercel --version` to check if the Vercel CLI is installed.
- If not found, install it globally: `npm install -g vercel`

## Step 2 — Check login status

Run `vercel whoami`.
- If not logged in, run `vercel login` and wait for the user to complete authentication in the browser.

## Step 3 — Verify `vercel.json` and `server.py`

This project is a Python MCP server using Starlette/uvicorn with SSE transport.

Ensure `vercel.json` at the project root contains:

```json
{
  "builds": [
    {
      "src": "server.py",
      "use": "@vercel/python",
      "config": {
        "maxLambdaSize": "15mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.py"
    }
  ]
}
```

Ensure `server.py` exports `app` for the Vercel Python runtime. At the bottom of `server.py`, after `starlette_app = MCPApp()`, add:

```python
app = starlette_app  # Vercel Python runtime expects `app`
```

## Step 4 — Deploy to Vercel

Run:
```
vercel --prod --yes
```

Capture the output. The aliased production URL appears on the `Aliased:` line (e.g., `https://icon-generator-mcp.vercel.app`).

## Step 5 — Set environment variables

After the first deploy, add all required credentials:
```
echo "$OPENAI_API_KEY" | vercel env add OPENAI_API_KEY production
echo "$AWS_ACCESS_KEY_ID" | vercel env add AWS_ACCESS_KEY_ID production
echo "$AWS_SECRET_ACCESS_KEY" | vercel env add AWS_SECRET_ACCESS_KEY production
```

For each of the following environment variables, check if it is set. If it is not set, use AskUserQuestion to prompt the user to provide the value, then export it into the shell using `export VAR=value` before continuing. Check them one at a time in this order:

1. `OPENAI_API_KEY`
2. `AWS_ACCESS_KEY_ID`
3. `AWS_SECRET_ACCESS_KEY`

note: Alternatively, you can /exit the current claude code session first; set the environment variable in your shell; then restart claude code to have those environment variables available automatically.

Then redeploy to pick them up:
```
vercel --prod --yes
```

## Step 6 — Update .mcp.json for remote use

Update `.mcp.json` to point to the remote SSE endpoint:

```json
{
  "mcpServers": {
    "icon-generator": {
      "url": "https://icon-generator-mcp.vercel.app/sse"
    }
  }
}
```

Then use `/mcp` in Claude Code to reconnect to the remote server.

## Step 7 — Report results

Tell the user:
1. The live production URL (make it a clickable link)
2. The SSE endpoint URL (`<base-url>/sse`)
3. Any errors encountered and how they were resolved

**Note:** Vercel serverless functions have a max execution timeout. SSE connections (which MCP requires) may be limited in duration. For a fully persistent MCP server, Railway or Fly.io are more reliable alternatives.
