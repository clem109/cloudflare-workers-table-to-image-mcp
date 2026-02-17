/**
 * Simple Table-to-Image MCP Server
 * Converts tables to images using QuickChart.io (free tier)
 */

import { handleMCPRequest } from './mcp-server.js';

const QUICKCHART_URL = 'https://quickchart.io/chart';

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      let response;

      // Route requests
      if (path === '/' || path === '/health') {
        response = handleHealth();
      } else if (path === '/convert' && request.method === 'POST') {
        response = await handleConvert(request, env);
      } else if (path.startsWith('/mcp')) {
        response = await handleMCPRequest(request, env);
      } else {
        response = jsonResponse({ error: 'Not Found' }, 404);
      }

      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }
};

function handleHealth() {
  return jsonResponse({
    status: 'healthy',
    service: 'table-to-image-mcp',
    version: '1.0.0'
  });
}

async function handleConvert(request, env) {
  try {
    const body = await request.json();

    if (!body.table) {
      return jsonResponse({ error: 'Missing table data' }, 400);
    }

    // Normalize table format
    const table = normalizeTable(body.table);
    
    // Convert to image URL
    const imageUrl = buildQuickChartUrl(table, body, env);

    return jsonResponse({
      success: true,
      imageUrl,
      format: body.format || 'png'
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }
}

function normalizeTable(table) {
  // Handle { headers: [], rows: [[]] }
  if (table.headers && table.rows) {
    return table;
  }

  // Handle array of objects
  if (Array.isArray(table) && table[0] && !Array.isArray(table[0])) {
    const headers = Object.keys(table[0]);
    const rows = table.map(obj => headers.map(h => obj[h]));
    return { headers, rows };
  }

  // Handle 2D array
  if (Array.isArray(table) && Array.isArray(table[0])) {
    return {
      headers: table[0],
      rows: table.slice(1)
    };
  }

  throw new Error('Unsupported table format');
}

function buildQuickChartUrl(table, options, env) {
  // Simple bar chart representation
  const chartConfig = {
    type: 'bar',
    data: {
      labels: table.rows.map((_, i) => `Row ${i + 1}`),
      datasets: table.headers.map((header, colIndex) => ({
        label: header,
        data: table.rows.map(row => parseFloat(row[colIndex]) || 0)
      }))
    },
    options: {
      title: {
        display: true,
        text: 'Table Data'
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'top'
        }
      }
    }
  };

  const params = new URLSearchParams({
    c: JSON.stringify(chartConfig),
    format: options.format || 'png',
    width: options.width || '800',
    height: options.height || '600'
  });

  // Add API key if available (optional)
  if (env.QUICKCHART_API_KEY) {
    params.append('key', env.QUICKCHART_API_KEY);
  }

  return `${QUICKCHART_URL}?${params.toString()}`;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export { normalizeTable, buildQuickChartUrl };
