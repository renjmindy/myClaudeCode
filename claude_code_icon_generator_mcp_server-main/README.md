# Icon Generator MCP Server

Generates flat outlined PNG icons via OpenAI DALL-E 3, matching the ICON_STYLE.md style guide.

## Prerequisites

- Docker
- An OpenAI API key

## 1. Set your OpenAI API key

Add `OPENAI_API_KEY` to your shell environment (e.g. `~/.zshrc`):

```bash
export OPENAI_API_KEY=sk-...
source ~/.zshrc
```

## 2. Build and start the server

Run the custom slash command inside Claude Code:

```
claude
/rebuild_restart_docker_image
```

This will:
1. Build the Docker image (`docker build -t icon-generator-mcp .`)
2. Stop any existing container on port 8000
3. Start the container (`docker run -d -p 8000:8000 -e OPENAI_API_KEY icon-generator-mcp`)
4. Prompt you to reconnect via `/mcp` → find `icon-generator` → **Reconnect**

The MCP server runs as an **SSE over HTTP** server on `http://localhost:8000/sse`. The configuration in `.mcp.json` connects to it via URL. 

The generated icon is returned as base64 PNG directly in the MCP response and rendered inline by the MCP client.

## 3. Use the tool

In a Claude Code session:

```
Generate an icon of a person reading a book
```

Claude will call `generate_icon` with your description and return the PNG image inline.

## Tool reference

**`generate_icon(description: str)`**

- `description`: What the icon should depict (e.g. `"a single person"`, `"a team of three people"`, `"a house"`)
- Returns: the PNG image (base64 encoded via MCP ImageContent)

## MCP Python SDK

This server is built on the **official Anthropic MCP SDK for Python** ([`modelcontextprotocol/python-sdk`](https://github.com/modelcontextprotocol/python-sdk)), installed via the `mcp` PyPI package.

```
mcp>=1.0.0   # requirements.txt
```

### FastMCP vs low-level Server

| | FastMCP | Server (low-level) |
|---|---|---|
| **API style** | High-level, decorator-based (`@mcp.tool()`) | Verbose, manual registration |
| **Boilerplate** | Minimal | More code needed |
| **Transport** | Handled automatically (`mcp.run()`) | You wire it manually (stdio, SSE, etc.) |
| **Flexibility** | Less control | Full control over transport, responses |
| **Best for** | Simple tools returning text/strings | Custom response types (e.g. `ImageContent`) |

This project uses the low-level `Server` because it needs to return `ImageContent` (binary PNG as base64), which `FastMCP` doesn't support natively — it's designed around tools that return plain text/strings.

Use `FastMCP` when tools return text; use low-level `Server` when you need richer response types like images.

### Key imports used in `server.py`:

```python
from mcp.server import Server          # core MCP server class
from mcp.server.stdio import stdio_server  # stdio transport (used by Claude Code)
from mcp import types                  # MCP type definitions (ImageContent, etc.)
```

The SDK handles the MCP wire protocol (JSON-RPC over stdio), tool registration (`@server.list_tools` / `@server.call_tool`), and structured response types like `types.ImageContent` that let Claude render the PNG image inline.

To learn more: https://github.com/modelcontextprotocol/python-sdk

## Deep Dive: How It All Works

### The full communication route

There are three ways Claude Code can communicate with an MCP server. Notice how the structure is nearly identical — only the transport adapter changes. `app.run()` is completely unaware of which transport is in use.

---

#### Route 1 — Local via stdio (previous approach)

```
Claude Code (MCP client)
    │  writes JSON-RPC request to Docker's stdin
    ▼
docker run --rm -i ...
    │  -i keeps stdin open and forwards it into the container
    ▼
container stdin
    │
    ▼
stdio_server()                        ← transport adapter (server.py line 124)
    │  wraps stdin  → read_stream  (async)
    │  wraps stdout ← write_stream (async)
    ▼
app.run(read_stream, write_stream)    ← same in all three routes
    │  deserializes request, dispatches to @app.call_tool()
    │  serializes response back to write_stream
    ▼
stdio_server()
    │  writes response to container stdout
    ▼
docker run -i ...
    │  forwards stdout back to Claude Code
    ▼
Claude Code (MCP client)
    reads JSON-RPC response, renders result (image, text, etc.)
```

The `-i` flag on `docker run` is critical — without it, Docker closes the container's stdin immediately and the server exits before receiving any messages.

---

#### Route 2 — SSE over HTTP (this project — local Docker + Vercel)

```
Claude Code (MCP client)
    │  HTTP POST (JSON-RPC request body)
    ▼
HTTP server (FastAPI, Express, etc.)
    │  parses HTTP body → JSON-RPC message
    ▼
MCP SSE handler (from SDK)            ← transport adapter
    │  wraps HTTP request/response → read_stream / write_stream
    ▼
app.run(read_stream, write_stream)    ← same in all three routes
    │  deserializes request, dispatches to @app.call_tool()
    │  serializes response back to write_stream
    ▼
MCP SSE handler
    │  Server-Sent Events stream back to Claude Code
    ▼
Claude Code (MCP client)
    reads SSE stream, parses JSON-RPC responses
```

---

#### Route 3 — Remote via WebSocket

```
Claude Code (MCP client)
    │  WebSocket handshake + JSON-RPC frames
    ▼
WebSocket handler (from SDK)          ← transport adapter
    │  wraps WS frames → read_stream / write_stream
    ▼
app.run(read_stream, write_stream)    ← same in all three routes
    │  deserializes request, dispatches to @app.call_tool()
    │  serializes response back to write_stream
    ▼
WebSocket handler
    │  frames response back over the persistent WS connection
    ▼
Claude Code (MCP client)
```

---

**Summary — only the adapter changes:**

| | Route 1 (stdio) | Route 2 (SSE — this project) | Route 3 (WebSocket) |
|---|---|---|---|
| Transport adapter | `stdio_server()` | `SseServerTransport` | `websocket_server()` |
| Carrier | OS pipe via Docker | HTTP + Server-Sent Events | WebSocket |
| `app.run()` | unchanged | unchanged | unchanged |
| Registration | `claude mcp add ... -- docker run` | `claude mcp add --url` / `.mcp.json` url | `claude mcp add --url` |

SSE is preferred over WebSocket for remote MCP today because it works over plain HTTP and is simpler to deploy behind standard infrastructure (load balancers, API gateways). WebSocket requires sticky sessions or a connection-aware proxy.

---

### stdio_server — the transport adapter

`app.run()` is **transport-agnostic**: it only knows how to speak the MCP protocol over abstract async streams. It has no knowledge of stdin, stdout, sockets, or HTTP.

`stdio_server()` is the **adapter** that bridges the gap:

```
stdin  (raw bytes) → stdio_server() → read_stream  (async) → app.run()
stdout (raw bytes) ← stdio_server() ← write_stream (async) ← app.run()
```

This separation is intentional. If you wanted to run the same `app` over a WebSocket or TCP socket, you'd just swap out `stdio_server()` for a different adapter — the `app` itself wouldn't change at all.

---

### What the MCP SDK abstracts away

Because the project uses the official Anthropic MCP SDK, all JSON-RPC protocol machinery is handled automatically. You just declare tools with decorators:

```python
@app.list_tools()
async def list_tools(): ...

@app.call_tool()
async def call_tool(): ...
```

The SDK handles everything underneath:
- Serializing/deserializing JSON-RPC messages
- Routing `tools/list` requests → your `list_tools()`
- Routing `tools/call` requests → your `call_tool()`
- Reading from `read_stream`, writing to `write_stream`

Without the SDK you'd manually parse raw bytes from stdin, pattern-match on method names, format response envelopes, and write it all back to stdout. The SDK reduces that to pure business logic.

---

### JSON-RPC — the wire protocol

**JSON-RPC** is a lightweight standard for structuring request/response messages. Every message follows a fixed envelope:

```json
// request
{ "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { ... } }

// response
{ "jsonrpc": "2.0", "id": 1, "result": { ... } }

// error
{ "jsonrpc": "2.0", "id": 1, "error": { "code": -32600, "message": "..." } }
```

The `id` field ties a response back to its request, which matters when multiple calls are in-flight simultaneously.

**JSON-RPC is transport-agnostic** — "transport" in the OSI sense means the layer responsible for moving bytes from A to B. JSON-RPC makes no assumptions about which layer carries it:

| Transport | OSI layer |
|---|---|
| stdio (this project) | Not even network — OS pipes between processes |
| TCP socket | Layer 4 |
| WebSocket | Layer 7 (over TCP) |
| HTTP body | Layer 7 |

The JSON-RPC message is identical in all cases. Only the carrier changes. This means no HTTP server is required — Claude Code just spawns `docker run` as a child process and communicates through the pipe it already owns.

**Why Anthropic chose JSON-RPC for MCP:**

MCP is an open interoperability standard meant to be implemented by thousands of independent tool authors. That changes the calculus vs. a SaaS API:

- **Low barrier to entry** — any developer can write an MCP server in any language, without learning Protobuf or gRPC toolchains
- **Human-readable** — easy to debug, inspect, and learn from; critical for adoption
- **Transport flexibility** — the same protocol works over stdio, WebSocket, or HTTP without changing the message format
- **No central authority** — there's no single server to optimize; raw performance between independent tools is irrelevant

Anthropic optimized for **ecosystem breadth over runtime performance**. A complicated binary protocol would have killed adoption before it started. Think of it like HTTP itself — not the most efficient protocol, but it won because simplicity and openness beat technical perfection when building a standard.

**Protocol comparison:**

X = optional or not built-in by default.

| | JSON-RPC | gRPC | HTTP/REST |
|---|---|---|---|
| **Transport** | Any (stdio, HTTP, WS) | HTTP/2 only | HTTP/1.1 or HTTP/2 |
| **Message format** | JSON | Binary (Protobuf) | JSON / XML / any |
| **Schema / contract** | X (Though, Anthropic define one) | Protobuf (required) | X |
| **Code generation** | X | Required | X |
| **Type safety** | X | Compile time | X |
| **Streaming** | Via SSE or WS | Native (HTTP/2 streams) | Via SSE |
| **Performance** | Medium | High | Medium |
| **Tooling ecosystem** | Minimal | Extensive | Extensive (Swagger, Postman...) |
| **Human readable** | Yes | No (binary) | Yes |
| **Learning curve** | Low | High | Low |
| **LLM streaming** | SSE on response side | Native streaming | SSE on response side |
| **Best for** | Simple point-to-point IPC, open standards (MCP, Ethereum) | High-throughput microservices, polyglot teams | Public APIs, web services |

REST requests are typically larger than JSON-RPC because they encode meaning in HTTP verbs, URL paths, and repeated headers. However, this rarely matters in practice: HTTP/2 (used by gRPC) compresses headers with HPACK, eliminating most of that overhead. That's one reason gRPC beats both REST and JSON-RPC on raw efficiency at scale.

**Key terminology:**

**Transport layer (OSI Layer 4)**
The layer responsible for establishing a connection and reliably moving bytes between two endpoints. TCP is the dominant protocol here. When we say gRPC requires HTTP/2 "at the transport level", we mean gRPC depends on HTTP/2's binary framing and multiplexing features which sit directly above TCP:

```
gRPC         (Layer 7 — application)
  └─ HTTP/2  (Layer 7 — application)
       └─ TLS (Layer 6 — presentation)
            └─ TCP (Layer 4 — transport)
```

**Why gRPC doesn't work natively in browsers — and why most apps still use REST**

This is a common question: "gRPC has so many benefits — why don't people just use it?"

The answer is the browser. Browsers expose `fetch` and `XMLHttpRequest` as their HTTP interfaces, but these APIs sit *above* the raw TCP connection. The browser controls the connection itself and doesn't expose the HTTP/2 frame layer to JavaScript. So you can't do raw HTTP/2 streaming calls from a browser — the browser simply doesn't give you that access:

```
Browser JS (fetch/XHR)       ← you only get access here
    └─ browser HTTP/2 engine ← gRPC needs to control this layer
         └─ TCP
```

SSE and REST work fine because they only need what `fetch` already exposes — standard HTTP request/response with a kept-open body stream. No special HTTP/2 frame access needed.

So "transport level" in this context really means: **the HTTP/2 framing layer that browsers hide from you**.

To use gRPC from a browser you need grpc-web + a proxy like Envoy to translate between browser HTTP and raw gRPC HTTP/2 — extra infrastructure most teams don't want to maintain. For internal microservice-to-microservice communication (no browser involved), gRPC is an excellent choice. But for any public-facing API, REST wins on reach and simplicity.

**SSE (Server-Sent Events)**
A browser/HTTP standard where the server keeps an HTTP connection open and pushes data to the client as a stream, one event at a time. The client sends a normal HTTP request, but instead of getting a single response and closing, the connection stays open and the server pushes chunks as they're ready. Critical for LLMs because the model generates tokens incrementally — there's no single moment when "the response is ready". SSE is a workaround over HTTP; gRPC handles this natively via server streaming defined in the `.proto` file.

**gRPC streaming modes**
gRPC has four streaming modes built into the protocol, defined in `.proto`:

| Mode | Definition | Use case |
|---|---|---|
| Unary | `rpc Get(Request) returns (Response)` | Standard request/response, like REST |
| Server streaming | `rpc Stream(Request) returns (stream Response)` | LLM token streaming |
| Client streaming | `rpc Upload(stream Request) returns (Response)` | Chunked uploads |
| Bidirectional | `rpc Chat(stream Message) returns (stream Message)` | Real-time chat, live collaboration |

For LLMs, OpenAI and Anthropic use SSE over HTTP/REST rather than gRPC primarily for browser compatibility and developer adoption — every developer knows how to `curl` a REST endpoint, while gRPC requires Protobuf schemas, `protoc`, and generated client stubs.

---

### JSON Schema — the type contract

Each tool declares an `inputSchema` (see `server.py` lines 46–59):

```python
inputSchema={
    "type": "object",
    "properties": {
        "description": {
            "type": "string",
            "description": "What the icon should depict."
        }
    },
    "required": ["description"],
}
```

**JSON Schema** is a standard for describing the shape of a JSON object — a lightweight type contract. It can express types, constraints, enums, arrays, and nested objects:

```json
{
  "type": "object",
  "properties": {
    "name":  { "type": "string", "minLength": 1 },
    "age":   { "type": "integer", "minimum": 0 },
    "role":  { "type": "string", "enum": ["admin", "user", "guest"] },
    "tags":  { "type": "array", "items": { "type": "string" } }
  },
  "required": ["name"]
}
```

When Claude Code calls `tools/list`, your server returns the `inputSchema` for each tool. Claude Code uses it to:
- Know what arguments the tool expects
- Validate arguments before sending
- Help Claude reason about how to call the tool correctly
- Generate the tool call UI shown in the Claude interface

**JSON Schema vs Protobuf (gRPC):**

| | JSON Schema | Protobuf |
|---|---|---|
| Format | JSON (human-readable) | Binary (compiled) |
| Code generation | Optional | Required |
| Catch type errors | At runtime | At compile time |
| Add a new field | Add a key to the dict | Edit `.proto` → run `protoc` → update generated files |
| Cross-language contracts | Each language validates independently | All clients generated from the same `.proto`, always in sync |
| CI/CD overhead | Nothing extra needed | Needs `protoc` in the build pipeline |

Protobuf's mandatory code generation is what makes it robust at scale — every client in every language is guaranteed to match the schema. But for MCP, where any developer needs to ship a working server quickly, JSON Schema's "just write a dict" approach wins.

---

## Style

Icons follow ICON_STYLE.md:
- White background, no transparency
- Flat / minimalist, zero gradients or shadows
- Thick dark gray outline
- Medium blue fill (~#5B9BD5), beige skin (~#F5CBA7)
- 1024×1024, centered subject with ~10% padding
# claude_code_icon_generator_mcp_server
