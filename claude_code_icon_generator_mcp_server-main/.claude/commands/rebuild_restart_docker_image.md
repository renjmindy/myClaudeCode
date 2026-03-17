### Check whether docker service is running
Use the command below to check whether docker is running.
```bash
docker --version
```

If not, remind the user to start the Docker service first and abort the command execution here.

### Rebuild Docker Image to reflect changes in python code
```bash
docker build -t icon-generator-mcp .
```

### Stop any existing container on port 8000
```bash
docker rm -f icon-generator-mcp-local 2>/dev/null || true
```

### Set Credentials
For each of the following environment variables, check if it is set. If it is not set, use AskUserQuestion to prompt the user to provide the value, then export it into the shell using `export VAR=value` before continuing. Check them one at a time in this order:

1. `OPENAI_API_KEY` — required for image generation
2. `AWS_ACCESS_KEY_ID` — required for S3 upload
3. `AWS_SECRET_ACCESS_KEY` — required for S3 upload

note: Alternatively, you can /exit the current claude code session first; set the environment variable in your shell; then restart claude code to have those environment variables available automatically.

### Start the container
```bash
docker run -d --name icon-generator-mcp-local -p 8000:8000 \
  -e OPENAI_API_KEY \
  -e AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY \
  icon-generator-mcp
```

### Switch .mcp.json to local
Update `.mcp.json` to point to the local container:
```json
{
  "mcpServers": {
    "icon-generator": {
      "url": "http://localhost:8000/sse"
    }
  }
}
```

### Restart the MCP server
Remind the user to use the `/mcp` command, look for `icon-generator` and reconnect.

### Typical workflow
Test locally with `/rebuild_restart_docker_image` → switch `.mcp.json` to `localhost:8000` → verify → then `/deploy_vercel` to ship it → switch `.mcp.json` back to the Vercel URL.
