# 📊 Table to Image MCP Server

**One-click deploy** a Cloudflare Worker that converts table data to images. Works out of the box with **zero configuration**.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/clem109/cloudflare-workers-table-to-image-mcp)

## 🚀 Quick Deploy

### Option 1: One-Click Deploy (Recommended)
Click the button above and follow the prompts. That's it!

### Option 2: Manual Deploy
```bash
git clone https://github.com/clem109/cloudflare-workers-table-to-image-mcp.git
cd cloudflare-workers-table-to-image-mcp
npm install
npx wrangler deploy
```

## ✨ Features

- 🎯 **Zero Configuration** - Works immediately after deploy
- 🆓 **Free QuickChart Tier** - No API key required
- ⚡ **Fast Edge Deployment** - Runs on Cloudflare's global network
- 🤖 **MCP Protocol** - Ready for AI assistants like Claude
- 🌍 **CORS Enabled** - Use from any client

## 📡 Usage

After deploying, your worker will be available at: `https://table-to-image-mcp.YOUR-SUBDOMAIN.workers.dev`

### Convert a Table

```bash
curl -X POST https://table-to-image-mcp.YOUR-SUBDOMAIN.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{
    "table": {
      "headers": ["Product", "Sales"],
      "rows": [
        ["Widget A", "$1000"],
        ["Widget B", "$2000"]
      ]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://quickchart.io/chart?...",
  "format": "png"
}
```

### Health Check

```bash
curl https://table-to-image-mcp.YOUR-SUBDOMAIN.workers.dev/health
```

## 🤖 MCP Integration

Use with AI assistants that support the Model Context Protocol:

```json
{
  "mcpServers": {
    "table-to-image": {
      "url": "https://table-to-image-mcp.YOUR-SUBDOMAIN.workers.dev"
    }
  }
}
```

Then simply ask your AI assistant: *"Convert this table to an image"*

## 📋 Supported Table Formats

### Format 1: Headers + Rows
```json
{
  "headers": ["Name", "Value"],
  "rows": [["Item 1", "100"], ["Item 2", "200"]]
}
```

### Format 2: Array of Objects
```json
[
  {"name": "John", "age": 30},
  {"name": "Jane", "age": 25}
]
```

### Format 3: 2D Array
```json
[
  ["Name", "Age"],
  ["John", "30"],
  ["Jane", "25"]
]
```

## 🎨 Customization (Optional)

By default, the worker uses QuickChart's free tier. For higher rate limits, add your API key:

```bash
npx wrangler secret put QUICKCHART_API_KEY
```

Get a free API key at [quickchart.io](https://quickchart.io/pricing/)

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/convert` | POST | Convert table to image |
| `/mcp` | GET | MCP server info |
| `/mcp/convert` | POST | MCP-compatible conversion |

## 📦 What's Inside

```
├── src/
│   ├── index.js       # Main worker code
│   └── mcp-server.js  # MCP protocol handler
├── wrangler.toml      # Minimal Cloudflare config
├── package.json       # Dependencies
└── README.md          # You are here!
```

## 🐛 Troubleshooting

**Deploy fails?** Make sure you're logged in:
```bash
npx wrangler login
```

**Need help?** [Open an issue](https://github.com/clem109/cloudflare-workers-table-to-image-mcp/issues)

## 📄 License

MIT - see [LICENSE](LICENSE)

## 🙏 Credits

- [QuickChart.io](https://quickchart.io/) - Chart generation
- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge deployment

---

**Made with ❤️ by [Clement Venard](https://github.com/clem109)**
