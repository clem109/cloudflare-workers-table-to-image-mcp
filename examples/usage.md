# Usage Examples

Complete examples for using the Table-to-Image MCP Connector.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Advanced Examples](#advanced-examples)
- [Language Examples](#language-examples)
- [MCP Integration](#mcp-integration)
- [Error Handling](#error-handling)

## Basic Usage

### Simple Table Conversion

```bash
curl -X POST https://your-worker.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{
    "table": {
      "headers": ["Name", "Score"],
      "rows": [
        ["Alice", "95"],
        ["Bob", "87"],
        ["Carol", "92"]
      ]
    },
    "format": "png",
    "width": 600,
    "height": 400
  }'
```

### Financial Report

```bash
curl -X POST https://your-worker.workers.dev/convert \
  -H "Content-Type: application/json" \
  -d '{
    "table": {
      "headers": ["Quarter", "Revenue", "Expenses", "Profit"],
      "rows": [
        ["Q1 2026", "$250K", "$150K", "$100K"],
        ["Q2 2026", "$300K", "$180K", "$120K"],
        ["Q3 2026", "$350K", "$200K", "$150K"]
      ]
    },
    "format": "png",
    "width": 800,
    "height": 500,
    "style": "default"
  }'
```

## Advanced Examples

### Array of Objects Format

```javascript
const tableData = [
  { product: 'Widget A', sales: 1000, region: 'North' },
  { product: 'Widget B', sales: 1500, region: 'South' },
  { product: 'Widget C', sales: 1200, region: 'East' }
];

const response = await fetch('https://your-worker.workers.dev/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: tableData,
    format: 'png',
    width: 900,
    height: 600
  })
});

const result = await response.json();
console.log('Image URL:', result.imageUrl);
```

### 2D Array Format

```python
import requests
import json

table_data = [
    ['Country', 'Population', 'GDP'],
    ['USA', '331M', '$23T'],
    ['China', '1.4B', '$17T'],
    ['India', '1.4B', '$3.5T']
]

response = requests.post(
    'https://your-worker.workers.dev/convert',
    json={
        'table': table_data,
        'format': 'png',
        'width': 800,
        'height': 600,
        'style': 'striped'
    }
)

result = response.json()
print(f"Image URL: {result['imageUrl']}")
```

### Complex Table with Styling

```javascript
const complexTable = {
  headers: ['Metric', 'Current', 'Target', 'Status', 'Trend'],
  rows: [
    ['Response Time', '120ms', '100ms', '⚠️', '↓'],
    ['Uptime', '99.9%', '99.99%', '✓', '→'],
    ['Error Rate', '0.1%', '0.05%', '⚠️', '↓'],
    ['Throughput', '5K/s', '10K/s', '✓', '↑']
  ]
};

const response = await fetch('https://your-worker.workers.dev/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: complexTable,
    format: 'png',
    width: 1000,
    height: 600,
    style: 'dark'
  })
});
```

## Language Examples

### JavaScript / Node.js

```javascript
const axios = require('axios');

async function convertTable(tableData) {
  try {
    const response = await axios.post(
      'https://your-worker.workers.dev/convert',
      {
        table: tableData,
        format: 'png',
        width: 800,
        height: 600
      }
    );
    
    return response.data.imageUrl;
  } catch (error) {
    console.error('Conversion failed:', error.message);
    throw error;
  }
}

// Usage
const table = {
  headers: ['Name', 'Value'],
  rows: [['Item 1', '100'], ['Item 2', '200']]
};

convertTable(table)
  .then(url => console.log('Image created:', url))
  .catch(err => console.error(err));
```

### Python

```python
import requests
from typing import Dict, List, Any

def convert_table(
    table_data: Dict[str, List],
    format: str = 'png',
    width: int = 800,
    height: int = 600
) -> str:
    """Convert table data to image."""
    
    response = requests.post(
        'https://your-worker.workers.dev/convert',
        json={
            'table': table_data,
            'format': format,
            'width': width,
            'height': height
        }
    )
    
    response.raise_for_status()
    result = response.json()
    return result['imageUrl']

# Usage
table = {
    'headers': ['Product', 'Sales'],
    'rows': [
        ['Widget A', '$1000'],
        ['Widget B', '$2000']
    ]
}

image_url = convert_table(table)
print(f'Image created: {image_url}')
```

### Go

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type TableData struct {
	Headers []string   `json:"headers"`
	Rows    [][]string `json:"rows"`
}

type ConvertRequest struct {
	Table  TableData `json:"table"`
	Format string    `json:"format"`
	Width  int       `json:"width"`
	Height int       `json:"height"`
}

type ConvertResponse struct {
	Success  bool   `json:"success"`
	ImageURL string `json:"imageUrl"`
}

func convertTable(table TableData) (string, error) {
	req := ConvertRequest{
		Table:  table,
		Format: "png",
		Width:  800,
		Height: 600,
	}
	
	jsonData, err := json.Marshal(req)
	if err != nil {
		return "", err
	}
	
	resp, err := http.Post(
		"https://your-worker.workers.dev/convert",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	
	var result ConvertResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	
	return result.ImageURL, nil
}

func main() {
	table := TableData{
		Headers: []string{"Name", "Value"},
		Rows: [][]string{
			{"Item 1", "100"},
			{"Item 2", "200"},
		},
	}
	
	imageURL, err := convertTable(table)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	
	fmt.Println("Image URL:", imageURL)
}
```

### Ruby

```ruby
require 'net/http'
require 'json'
require 'uri'

def convert_table(table_data, format: 'png', width: 800, height: 600)
  uri = URI('https://your-worker.workers.dev/convert')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri.path, 'Content-Type' => 'application/json')
  request.body = {
    table: table_data,
    format: format,
    width: width,
    height: height
  }.to_json
  
  response = http.request(request)
  result = JSON.parse(response.body)
  result['imageUrl']
end

# Usage
table = {
  headers: ['Product', 'Sales'],
  rows: [
    ['Widget A', '$1000'],
    ['Widget B', '$2000']
  ]
}

image_url = convert_table(table)
puts "Image created: #{image_url}"
```

## MCP Integration

### Basic MCP Request

```json
POST /mcp/convert

{
  "method": "convert_table",
  "params": {
    "data": {
      "headers": ["Name", "Score"],
      "rows": [["Alice", "95"], ["Bob", "87"]]
    },
    "options": {
      "format": "png",
      "width": 800,
      "height": 600
    }
  }
}
```

### MCP Response

```json
{
  "result": {
    "imageUrl": "https://quickchart.io/chart?...",
    "format": "png",
    "success": true
  },
  "metadata": {
    "timestamp": "2026-02-17T20:44:00Z",
    "provider": "quickchart",
    "mcp_version": "1.0"
  }
}
```

### Poke Integration Example

```javascript
// In your Poke configuration
const mcpConfig = {
  mcpServers: {
    'table-to-image': {
      url: 'https://your-worker.workers.dev/mcp',
      apiKey: process.env.MCP_API_KEY
    }
  }
};

// Usage in AI conversation
// "Convert this sales data to an image: ..."
```

## Error Handling

### Handle API Errors

```javascript
async function safeConvertTable(tableData) {
  try {
    const response = await fetch('https://your-worker.workers.dev/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: tableData,
        format: 'png'
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }
    
    const result = await response.json();
    return result.imageUrl;
    
  } catch (error) {
    if (error.name === 'TypeError') {
      console.error('Network error:', error.message);
    } else {
      console.error('Conversion error:', error.message);
    }
    throw error;
  }
}
```

### Retry Logic

```javascript
async function convertWithRetry(tableData, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await safeConvertTable(tableData);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Validation

```javascript
function validateTableData(table) {
  if (!table.headers || !Array.isArray(table.headers)) {
    throw new Error('Invalid headers');
  }
  
  if (!table.rows || !Array.isArray(table.rows)) {
    throw new Error('Invalid rows');
  }
  
  const expectedColumns = table.headers.length;
  for (const row of table.rows) {
    if (row.length !== expectedColumns) {
      throw new Error('Row length mismatch');
    }
  }
  
  return true;
}
```

## Performance Tips

1. **Batch Requests**: Convert multiple tables in parallel
2. **Cache Results**: Store image URLs to avoid redundant conversions
3. **Optimize Size**: Use appropriate width/height for your use case
4. **Format Selection**: Use JPG for smaller files when quality isn't critical

## Best Practices

1. Always validate input data before sending
2. Implement proper error handling
3. Use appropriate image dimensions
4. Cache generated images when possible
5. Monitor API usage and rate limits
6. Use API keys for production deployments

---

For more examples and documentation, visit the [GitHub repository](https://github.com/clem109/cloudflare-workers-table-to-image-mcp).