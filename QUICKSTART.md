# 🚀 Quick Start Guide - Zero Configuration Deployment

This guide will help you deploy the Table-to-Image MCP Connector in under 2 minutes with **ZERO configuration required**.

## ✨ What "Zero Configuration" Means

- ✅ No API keys required
- ✅ No environment variables needed
- ✅ No secrets to set up
- ✅ No configuration files to edit
- ✅ Works immediately after deployment

The worker uses QuickChart.io's free tier by default, which requires no API key.

## 📋 Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is fine)
- That's it! No other setup needed.

## 🎯 Deployment Options

### Option 1: One-Click Deploy (Easiest - 30 seconds)

1. **Go to the repository**: https://github.com/clem109/cloudflare-workers-table-to-image-mcp

2. **Click the "Deploy to Cloudflare Workers" button** at the top of the README

3. **Authenticate** with your Cloudflare account (if not already logged in)

4. **Click "Deploy"** - that's it!

5. **Copy your worker URL** from the deployment success page (format: `https://table-to-image-mcp.your-subdomain.workers.dev`)

### Option 2: CLI Deploy (2 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/clem109/cloudflare-workers-table-to-image-mcp.git
cd cloudflare-workers-table-to-image-mcp

# 2. Install dependencies
npm install

# 3. Login to Cloudflare
npx wrangler login

# 4. Deploy (no configuration needed!)
npm run deploy
```

Your worker is now live! 🎉

## 🧪 Testing Your Deployment

### Test 1: Health Check

```bash
curl https://your-worker-url.workers.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "service": "table-to-image-mcp",
  "timestamp": "2026-02-17T21:00:00Z"
}
```

### Test 2: Convert a Table

```bash
curl -X POST https://your-worker-url.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{
    "table": {
      "headers": ["Name", "Score", "Grade"],
      "rows": [
        ["Alice", "95", "A"],
        ["Bob", "87", "B"],
        ["Charlie", "92", "A"]
      ]
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "imageUrl": "https://quickchart.io/chart?c=...",
  "format": "png",
  "timestamp": "2026-02-17T21:00:00Z"
}
```

### Test 3: MCP Integration

```bash
curl https://your-worker-url.workers.dev/mcp
```

Expected response:
```json
{
  "name": "table-to-image-mcp",
  "version": "1.0.0",
  "protocol": "mcp/1.0",
  "description": "Convert table data to images using QuickChart.io",
  "capabilities": ["convert_table", "format_support", "style_options"],
  "endpoints": {
    "convert": "/mcp/convert",
    "capabilities": "/mcp/capabilities",
    "schema": "/mcp/schema"
  }
}
```

## 🎨 Example Usage

### JavaScript/Node.js

```javascript
const workerUrl = 'https://your-worker-url.workers.dev';

async function convertTable() {
  const response = await fetch(`${workerUrl}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table: {
        headers: ['Product', 'Sales', 'Growth'],
        rows: [
          ['Widget A', '1000', '+15%'],
          ['Widget B', '2000', '+25%'],
          ['Widget C', '1500', '+10%']
        ]
      },
      format: 'png',
      width: 800,
      height: 600
    })
  });
  
  const result = await response.json();
  console.log('Image URL:', result.imageUrl);
  return result.imageUrl;
}

convertTable();
```

### Python

```python
import requests

worker_url = 'https://your-worker-url.workers.dev'

def convert_table():
    response = requests.post(
        f'{worker_url}/convert',
        json={
            'table': {
                'headers': ['Product', 'Sales', 'Growth'],
                'rows': [
                    ['Widget A', '1000', '+15%'],
                    ['Widget B', '2000', '+25%'],
                    ['Widget C', '1500', '+10%']
                ]
            },
            'format': 'png',
            'width': 800,
            'height': 600
        }
    )
    
    result = response.json()
    print(f"Image URL: {result['imageUrl']}")
    return result['imageUrl']

convert_table()
```

## 🔌 MCP Client Integration

### Configure with Claude Desktop / Poke

1. Find your MCP configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add your worker to the MCP servers:

```json
{
  "mcpServers": {
    "table-to-image": {
      "url": "https://your-worker-url.workers.dev/mcp",
      "name": "Table to Image Converter",
      "description": "Convert tables to images"
    }
  }
}
```

3. Restart your MCP client

4. Use in conversations:
```
Convert this sales data to an image:
Product | Sales | Growth
Widget A | 1000 | +15%
Widget B | 2000 | +25%
```

## 🎁 Optional Enhancements

While the worker works perfectly with zero configuration, you can optionally enhance it:

### Increase Rate Limits

Get a free QuickChart API key to increase rate limits:

1. Visit https://quickchart.io/pricing/
2. Sign up for free account
3. Copy your API key
4. Set it as a secret:

```bash
echo "your-api-key-here" | npx wrangler secret put QUICKCHART_API_KEY
```

### Add MCP Authentication

To require authentication for MCP endpoints:

```bash
echo "your-secret-key" | npx wrangler secret put MCP_API_KEY
```

### Customize Defaults

Edit `wrangler.toml` to change default values:

```toml
[vars]
MAX_TABLE_SIZE = "20000"
DEFAULT_IMAGE_WIDTH = "1200"
DEFAULT_IMAGE_HEIGHT = "800"
```

Then redeploy:
```bash
npm run deploy
```

## 🔍 Troubleshooting

### Deploy button asks for environment variables

This shouldn't happen with the latest version. If it does:

1. Clear your browser cache
2. Try the direct deployment link: https://deploy.workers.cloudflare.com/?url=https://github.com/clem109/cloudflare-workers-table-to-image-mcp
3. Or use CLI deploy: `npm run deploy`

### "Account ID not found" error

Solution:
```bash
npx wrangler login
npm run deploy
```

### "Module not found" error

Solution:
```bash
npm install
npm run deploy
```

### Worker deployed but not responding

1. Check deployment was successful
2. Wait 30 seconds for propagation
3. Verify the URL is correct
4. Check Cloudflare dashboard for logs

## 📚 Next Steps

- ✅ Read the [full documentation](README.md)
- ✅ Check out [usage examples](examples/)
- ✅ Join the [discussion forum](https://github.com/clem109/cloudflare-workers-table-to-image-mcp/discussions)
- ✅ Report issues on [GitHub](https://github.com/clem109/cloudflare-workers-table-to-image-mcp/issues)

## 💡 Pro Tips

1. **Bookmark your worker URL** for easy access
2. **Test with cURL first** before integrating
3. **Use the health endpoint** to verify deployment
4. **Check the MCP info endpoint** to see capabilities
5. **Star the repo** if you find it useful! ⭐

## 🆘 Need Help?

- 📖 [Full Documentation](README.md)
- 💬 [GitHub Discussions](https://github.com/clem109/cloudflare-workers-table-to-image-mcp/discussions)
- 🐛 [Report Issues](https://github.com/clem109/cloudflare-workers-table-to-image-mcp/issues)
- 📧 Email: Open an issue instead for faster response

---

**Built with ❤️ by Clement Venard**

**Deployed in under 2 minutes with ZERO configuration! 🚀**
