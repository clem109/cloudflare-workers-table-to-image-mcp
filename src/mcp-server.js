/**
 * Simple MCP Server Implementation
 * Provides AI assistant integration
 */

export async function handleMCPRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/mcp' || path === '/mcp/') {
    return mcpInfo();
  }
  
  if (path === '/mcp/convert' && request.method === 'POST') {
    return await mcpConvert(request, env);
  }

  return jsonResponse({ error: 'MCP endpoint not found' }, 404);
}

function mcpInfo() {
  return jsonResponse({
    name: 'table-to-image-mcp',
    version: '1.0.0',
    protocol: 'mcp/1.0',
    description: 'Convert table data to images',
    endpoints: {
      info: '/mcp',
      convert: '/mcp/convert'
    }
  });
}

async function mcpConvert(request, env) {
  try {
    const body = await request.json();

    if (body.method !== 'convert_table') {
      return jsonResponse({ error: 'Method must be "convert_table"' }, 400);
    }

    if (!body.params?.data) {
      return jsonResponse({ error: 'Missing params.data' }, 400);
    }

    // Use the main conversion logic
    const { normalizeTable, buildQuickChartUrl } = await import('./index.js');
    const table = normalizeTable(body.params.data);
    const options = body.params.options || {};
    const imageUrl = buildQuickChartUrl(table, options, env);

    return jsonResponse({
      result: {
        imageUrl,
        format: options.format || 'png',
        success: true
      }
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
