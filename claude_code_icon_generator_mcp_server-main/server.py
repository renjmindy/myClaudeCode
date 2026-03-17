#!/usr/bin/env python3
import base64
import os
import uuid

import boto3
from starlette.responses import Response

import httpx
from mcp.server import Server
from mcp.server.sse import SseServerTransport
from mcp import types

S3_BUCKET = "claude-code-mcp-0307-2026"
S3_REGION = "us-east-1"

ICON_STYLE_PROMPT = """
Style guide for this icon (follow strictly):
- Format: PNG, white background (#FFFFFF), no transparency
- Look: minimalist flat vector / UI icon (like macOS or iOS system icons)
- Shading: NONE — no gradients, no drop shadows, no inner shadows, no textures
- Geometry: simple rounded shapes, clean smooth curves
- Stroke: thick consistent dark gray outline (#333333 or similar) across entire icon
- Edges: smooth anti-aliased, NOT pixel art
- Canvas: square 1024x1024, subject centered with ~10% padding on all sides
- Colors:
    - Primary fill (clothing/main shape): medium cornflower blue (~#5B9BD5)
    - Skin fill: light warm beige (~#F5CBA7)
    - Outline: dark gray (~#333333)
- Keep details minimal — legible at 24px
- Solid fills ONLY — absolutely no gradients or shadows
"""

PROMPT_TEMPLATE = (
    "Create a simple flat outlined PNG icon of: {description}.\n"
    + ICON_STYLE_PROMPT
)

mcp_server = Server("icon-generator")


@mcp_server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="generate_icon",
            description=(
                "Generate a flat outlined PNG icon in the established style "
                "(white bg, beige skin, blue fill, dark gray outline, no gradients). "
                "Returns the PNG image."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "description": {
                        "type": "string",
                        "description": (
                            "What the icon should depict. "
                            "Examples: 'a single person', 'a team of three people', "
                            "'a person holding a book', 'a house'"
                        ),
                    }
                },
                "required": ["description"],
            },
        ),
        types.Tool(
            name="list_icons",
            description="List all existing icons stored in S3. Returns their public URLs.",
            inputSchema={"type": "object", "properties": {}},
        ),
        types.Tool(
            name="delete_all",
            description="Delete all icons stored in S3. This is irreversible.",
            inputSchema={"type": "object", "properties": {}},
        ),
    ]


@mcp_server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.ContentBlock]:
    if name == "delete_all":
        s3 = boto3.client(
            "s3",
            region_name=S3_REGION,
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        )
        paginator = s3.get_paginator("list_objects_v2")
        keys = []
        for page in paginator.paginate(Bucket=S3_BUCKET, Prefix="icons/"):
            for obj in page.get("Contents", []):
                keys.append({"Key": obj["Key"]})
        if not keys:
            return [types.TextContent(type="text", text="No icons to delete.")]
        s3.delete_objects(Bucket=S3_BUCKET, Delete={"Objects": keys})
        return [types.TextContent(type="text", text=f"Deleted {len(keys)} icon(s).")]

    if name == "list_icons":
        s3 = boto3.client(
            "s3",
            region_name=S3_REGION,
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        )
        paginator = s3.get_paginator("list_objects_v2")
        urls = []
        for page in paginator.paginate(Bucket=S3_BUCKET, Prefix="icons/"):
            for obj in page.get("Contents", []):
                urls.append(f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{obj['Key']}")
        if not urls:
            return [types.TextContent(type="text", text="No icons found.")]
        return [types.TextContent(type="text", text="\n".join(urls))]

    if name != "generate_icon":
        raise ValueError(f"Unknown tool: {name}")

    description = arguments.get("description", "").strip()
    if not description:
        return [types.TextContent(type="text", text="Error: description must not be empty.")]

    s3 = boto3.client(
        "s3",
        region_name=S3_REGION,
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )
    result = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix="icons/", MaxKeys=6)
    icon_count = result.get("KeyCount", 0)
    if icon_count > 5:
        return [
            types.TextContent(
                type="text",
                text=(
                    f"Icon creation blocked: you have {icon_count} icons stored in S3 (limit is 5). "
                    "Please say `delete all icons` to clean up first."
                ),
            )
        ]

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        return [
            types.TextContent(
                type="text",
                text="Error: OPENAI_API_KEY environment variable is not set.",
            )
        ]

    prompt = PROMPT_TEMPLATE.format(description=description)

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/images/generations",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "dall-e-3",
                "prompt": prompt,
                "n": 1,
                "size": "1024x1024",
                "response_format": "b64_json",
                "quality": "standard",
            },
        )

    if resp.status_code != 200:
        return [
            types.TextContent(
                type="text",
                text=f"OpenAI API error {resp.status_code}: {resp.text}",
            )
        ]

    data = resp.json()
    b64_data = data["data"][0]["b64_json"]
    revised_prompt = data["data"][0].get("revised_prompt", "")

    # Upload to S3 and return public URL
    png_bytes = base64.b64decode(b64_data)
    s3_key = f"icons/{uuid.uuid4().hex}.png"

    s3 = boto3.client(
        "s3",
        region_name=S3_REGION,
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=png_bytes,
        ContentType="image/png",
    )
    public_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{s3_key}"

    return [
        types.TextContent(
            type="text",
            text=f"Icon generated for: {description}\nRevised prompt: {revised_prompt}\nDownload URL: {public_url}",
        ),
    ]


sse = SseServerTransport("/messages/")


async def handle_sse(scope, receive, send):
    async with sse.connect_sse(scope, receive, send) as streams:
        await mcp_server.run(streams[0], streams[1], mcp_server.create_initialization_options())


class MCPApp:
    async def __call__(self, scope, receive, send):
        if scope["type"] == "lifespan":
            await receive()
            await send({"type": "lifespan.startup.complete"})
            await receive()
            await send({"type": "lifespan.shutdown.complete"})
            return
        path = scope.get("path", "")
        if path.rstrip("/") == "/sse":
            await handle_sse(scope, receive, send)
        elif path.startswith("/messages/"):
            await sse.handle_post_message(scope, receive, send)
        else:
            await Response("Not found", status_code=404)(scope, receive, send)


starlette_app = MCPApp()
app = starlette_app  # Vercel Python runtime expects `app`
