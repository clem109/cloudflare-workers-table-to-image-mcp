/**
 * Cloudflare Workers Table-to-Image MCP Connector
 * Converts table data to images using QuickChart.io API
 * 
 * @author Clement Venard
 * @license MIT
 */

import { handleMCPRequest } from './mcp-server.js';

// Configuration
const CONFIG = {
  QUICKCHART_BASE_URL: 'https://quickchart.io/chart',
  MAX_TABLE_SIZE: 10000,
  DEFAULT_FORMAT: 'png',
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600,
  RATE_LIMIT: 60,
};

/**
 * Main Worker entry point
 */
export default {
  async fetch(request, env, ctx) {
    try {
      // Apply environment config
      const config = applyEnvConfig(env);
      
      // CORS headers
      const corsHeaders = getCorsHeaders(env);
      
      // Handle OPTIONS for CORS
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
      
      const url = new URL(request.url);
      const path = url.pathname;
      
      // Route handling
      let response;
      
      if (path === '/' || path === '/health') {
        response = handleHealth();
      } else if (path === '/convert' && request.method === 'POST') {
        response = await handleConvert(request, env, config);
      } else if (path.startsWith('/mcp')) {
        response = await handleMCPRequest(request, env, config);
      } else {
        response = new Response(JSON.stringify({
          error: 'Not Found',
          message: 'Available endpoints: /health, /convert, /mcp/*'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Add CORS headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Apply environment configuration
 */
function applyEnvConfig(env) {
  return {
    ...CONFIG,
    MAX_TABLE_SIZE: parseInt(env.MAX_TABLE_SIZE || CONFIG.MAX_TABLE_SIZE),
    DEFAULT_FORMAT: env.DEFAULT_IMAGE_FORMAT || CONFIG.DEFAULT_FORMAT,
    DEFAULT_WIDTH: parseInt(env.DEFAULT_IMAGE_WIDTH || CONFIG.DEFAULT_WIDTH),
    DEFAULT_HEIGHT: parseInt(env.DEFAULT_IMAGE_HEIGHT || CONFIG.DEFAULT_HEIGHT),
    RATE_LIMIT: parseInt(env.RATE_LIMIT || CONFIG.RATE_LIMIT),
    QUICKCHART_API_KEY: env.QUICKCHART_API_KEY,
  };
}

/**
 * Get CORS headers
 */
function getCorsHeaders(env) {
  const enableCors = env.ENABLE_CORS !== 'false';
  
  if (!enableCors) return {};
  
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle health check
 */
function handleHealth() {
  return new Response(JSON.stringify({
    status: 'healthy',
    version: '1.0.0',
    service: 'table-to-image-mcp',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle table-to-image conversion
 */
async function handleConvert(request, env, config) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateTableData(body, config);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: 'Validation Error',
        message: validation.error
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Normalize table format
    const normalizedTable = normalizeTableData(body.table);
    
    // Convert to image
    const imageUrl = await convertTableToImage(
      normalizedTable,
      body.format || config.DEFAULT_FORMAT,
      body.width || config.DEFAULT_WIDTH,
      body.height || config.DEFAULT_HEIGHT,
      body.style || 'default',
      config
    );
    
    return new Response(JSON.stringify({
      success: true,
      imageUrl: imageUrl,
      format: body.format || config.DEFAULT_FORMAT,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Conversion Error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Validate table data
 */
function validateTableData(body, config) {
  if (!body.table) {
    return { valid: false, error: 'Missing table data' };
  }
  
  const table = body.table;
  
  // Check table size
  let cellCount = 0;
  if (table.headers && table.rows) {
    cellCount = table.headers.length * (table.rows.length + 1);
  } else if (Array.isArray(table)) {
    cellCount = table.reduce((sum, row) => sum + (Array.isArray(row) ? row.length : Object.keys(row).length), 0);
  }
  
  if (cellCount > config.MAX_TABLE_SIZE) {
    return { valid: false, error: `Table too large (max ${config.MAX_TABLE_SIZE} cells)` };
  }
  
  return { valid: true };
}

/**
 * Normalize different table formats to standard format
 */
function normalizeTableData(table) {
  // Format 1: { headers: [], rows: [[]] }
  if (table.headers && table.rows) {
    return table;
  }
  
  // Format 2: Array of objects
  if (Array.isArray(table) && table.length > 0 && typeof table[0] === 'object' && !Array.isArray(table[0])) {
    const headers = Object.keys(table[0]);
    const rows = table.map(obj => headers.map(h => obj[h]));
    return { headers, rows };
  }
  
  // Format 3: 2D array
  if (Array.isArray(table) && table.length > 0 && Array.isArray(table[0])) {
    return {
      headers: table[0],
      rows: table.slice(1)
    };
  }
  
  throw new Error('Unsupported table format');
}

/**
 * Convert table to image using QuickChart.io
 */
async function convertTableToImage(table, format, width, height, style, config) {
  // Build QuickChart table configuration
  const chartConfig = buildTableChart(table, width, height, style);
  
  // Build QuickChart URL
  const params = new URLSearchParams({
    c: JSON.stringify(chartConfig),
    format: format,
    width: width.toString(),
    height: height.toString(),
  });
  
  // Add API key if available
  if (config.QUICKCHART_API_KEY) {
    params.append('key', config.QUICKCHART_API_KEY);
  }
  
  const quickchartUrl = `${config.QUICKCHART_BASE_URL}?${params.toString()}`;
  
  // For production: You might want to actually fetch and validate the image
  // const response = await fetch(quickchartUrl);
  // if (!response.ok) throw new Error('QuickChart API error');
  
  return quickchartUrl;
}

/**
 * Build QuickChart table configuration
 */
function buildTableChart(table, width, height, style) {
  // Create a table visualization using Chart.js table plugin or custom rendering
  // For simplicity, we'll create a bar chart showing the data
  // In production, you'd use a proper table rendering library
  
  const datasets = [];
  const labels = table.rows.map((row, i) => `Row ${i + 1}`);
  
  // Convert table data to chart format
  table.headers.forEach((header, colIndex) => {
    datasets.push({
      label: header,
      data: table.rows.map(row => parseFloat(row[colIndex]) || 0)
    });
  });
  
  return {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      title: {
        display: true,
        text: 'Table Data Visualization'
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: {
          display: true,
          anchor: 'end',
          align: 'top'
        }
      }
    }
  };
}

/**
 * Export functions for testing
 */
export {
  validateTableData,
  normalizeTableData,
  buildTableChart,
  applyEnvConfig
};