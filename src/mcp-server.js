/**
 * Model Context Protocol (MCP) Server Implementation
 * Provides AI assistant integration for table-to-image conversion
 * 
 * @author Clement Venard
 * @license MIT
 */

/**
 * Handle MCP requests
 */
export async function handleMCPRequest(request, env, config) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // MCP endpoint routing
  if (path === '/mcp' || path === '/mcp/') {
    return handleMCPInfo();
  } else if (path === '/mcp/convert' && request.method === 'POST') {
    return handleMCPConvert(request, env, config);
  } else if (path === '/mcp/capabilities') {
    return handleMCPCapabilities();
  } else if (path === '/mcp/schema') {
    return handleMCPSchema();
  }
  
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: 'MCP endpoint not found'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * MCP info endpoint
 */
function handleMCPInfo() {
  return new Response(JSON.stringify({
    name: 'table-to-image-mcp',
    version: '1.0.0',
    protocol: 'mcp/1.0',
    description: 'Convert table data to images using QuickChart.io',
    capabilities: [
      'convert_table',
      'format_support',
      'style_options'
    ],
    endpoints: {
      convert: '/mcp/convert',
      capabilities: '/mcp/capabilities',
      schema: '/mcp/schema'
    },
    author: 'Clement Venard',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * MCP capabilities endpoint
 */
function handleMCPCapabilities() {
  return new Response(JSON.stringify({
    capabilities: [
      {
        name: 'convert_table',
        description: 'Convert table data to image',
        input: {
          type: 'object',
          properties: {
            data: { type: 'array', description: 'Table data in various formats' },
            options: { type: 'object', description: 'Conversion options' }
          }
        },
        output: {
          type: 'object',
          properties: {
            imageUrl: { type: 'string', description: 'URL of generated image' },
            format: { type: 'string', description: 'Image format (png, jpg)' }
          }
        }
      },
      {
        name: 'format_support',
        description: 'Get supported table formats',
        output: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    ],
    formats: {
      input: ['headers_rows', 'array_of_objects', '2d_array'],
      output: ['png', 'jpg', 'svg']
    },
    limits: {
      maxCells: 10000,
      maxWidth: 4096,
      maxHeight: 4096
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * MCP schema endpoint
 */
function handleMCPSchema() {
  return new Response(JSON.stringify({
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Table to Image MCP',
    type: 'object',
    properties: {
      method: {
        type: 'string',
        enum: ['convert_table', 'format_support'],
        description: 'MCP method to invoke'
      },
      params: {
        type: 'object',
        properties: {
          data: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  headers: { type: 'array', items: { type: 'string' } },
                  rows: { type: 'array', items: { type: 'array' } }
                }
              },
              {
                type: 'array',
                items: { type: 'object' }
              },
              {
                type: 'array',
                items: { type: 'array' }
              }
            ]
          },
          options: {
            type: 'object',
            properties: {
              format: { type: 'string', enum: ['png', 'jpg', 'svg'] },
              width: { type: 'number', minimum: 100, maximum: 4096 },
              height: { type: 'number', minimum: 100, maximum: 4096 },
              style: { type: 'string', enum: ['default', 'minimal', 'dark', 'light'] },
              theme: { type: 'string' }
            }
          }
        }
      }
    },
    required: ['method']
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle MCP convert request
 */
async function handleMCPConvert(request, env, config) {
  try {
    const body = await request.json();
    
    // Validate MCP request format
    if (!body.method || body.method !== 'convert_table') {
      return new Response(JSON.stringify({
        error: 'Invalid Request',
        message: 'Method must be "convert_table"'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!body.params || !body.params.data) {
      return new Response(JSON.stringify({
        error: 'Invalid Request',
        message: 'Missing params.data'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Extract parameters
    const tableData = body.params.data;
    const options = body.params.options || {};
    
    // Convert to standard format and call main conversion logic
    const { normalizeTableData } = await import('./index.js');
    const normalizedTable = normalizeTableData(tableData);
    
    // Build conversion request
    const convertRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: normalizedTable,
        format: options.format || config.DEFAULT_FORMAT,
        width: options.width || config.DEFAULT_WIDTH,
        height: options.height || config.DEFAULT_HEIGHT,
        style: options.style || 'default'
      })
    });
    
    // Import and use conversion logic
    const { default: worker } = await import('./index.js');
    const response = await worker.fetch(convertRequest, env, {});
    const result = await response.json();
    
    // Return MCP-formatted response
    return new Response(JSON.stringify({
      result: {
        imageUrl: result.imageUrl,
        format: result.format,
        success: result.success
      },
      metadata: {
        timestamp: result.timestamp,
        provider: 'quickchart',
        mcp_version: '1.0'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'MCP Conversion Error',
      message: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Authenticate MCP request (if API key required)
 */
function authenticateMCPRequest(request, env) {
  const apiKey = env.MCP_API_KEY;
  if (!apiKey) return true; // No auth required
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  return token === apiKey;
}

export {
  handleMCPInfo,
  handleMCPCapabilities,
  handleMCPSchema,
  handleMCPConvert
};