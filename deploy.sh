#!/bin/bash

# Cloudflare Workers Table-to-Image MCP Deployment Script
# Author: Clement Venard
# License: MIT

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Table-to-Image MCP Deployment${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: Wrangler CLI is not installed${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
echo -e "${YELLOW}Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in. Starting login process...${NC}"
    wrangler login
else
    echo -e "${GREEN}✓ Already authenticated${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}Error: package.json not found${NC}"
    exit 1
fi

# Check for environment variables
echo -e "\n${YELLOW}Checking environment configuration...${NC}"
if [ -f ".env" ]; then
    source .env
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${YELLOW}⚠ No .env file found. Using defaults.${NC}"
    echo -e "${YELLOW}Create .env from .env.example for custom configuration.${NC}"
fi

# Set secrets if provided
if [ ! -z "$QUICKCHART_API_KEY" ]; then
    echo -e "\n${YELLOW}Setting QuickChart API key...${NC}"
    echo "$QUICKCHART_API_KEY" | wrangler secret put QUICKCHART_API_KEY
    echo -e "${GREEN}✓ API key configured${NC}"
fi

if [ ! -z "$MCP_API_KEY" ]; then
    echo -e "\n${YELLOW}Setting MCP API key...${NC}"
    echo "$MCP_API_KEY" | wrangler secret put MCP_API_KEY
    echo -e "${GREEN}✓ MCP API key configured${NC}"
fi

# Select environment
echo -e "\n${YELLOW}Select deployment environment:${NC}"
echo "1) Development"
echo "2) Staging"
echo "3) Production"
read -p "Enter choice (1-3): " env_choice

case $env_choice in
    1)
        ENV="development"
        ;;
    2)
        ENV="staging"
        ;;
    3)
        ENV="production"
        ;;
    *)
        echo -e "${RED}Invalid choice. Using development.${NC}"
        ENV="development"
        ;;
esac

echo -e "${GREEN}Deploying to: $ENV${NC}"

# Deploy
echo -e "\n${YELLOW}Deploying to Cloudflare Workers...${NC}"
if [ "$ENV" = "development" ]; then
    wrangler deploy
else
    wrangler deploy --env $ENV
fi

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}================================${NC}"
    echo -e "${GREEN}✓ Deployment Successful!${NC}"
    echo -e "${GREEN}================================${NC}"
    
    # Get worker URL
    echo -e "\n${YELLOW}Your worker is now live at:${NC}"
    if [ "$ENV" = "production" ]; then
        echo -e "${GREEN}https://table-to-image-mcp-prod.your-subdomain.workers.dev${NC}"
    elif [ "$ENV" = "staging" ]; then
        echo -e "${GREEN}https://table-to-image-mcp-staging.your-subdomain.workers.dev${NC}"
    else
        echo -e "${GREEN}https://table-to-image-mcp.your-subdomain.workers.dev${NC}"
    fi
    
    echo -e "\n${YELLOW}Available endpoints:${NC}"
    echo "  GET  /health       - Health check"
    echo "  POST /convert      - Convert table to image"
    echo "  GET  /mcp          - MCP server info"
    echo "  POST /mcp/convert  - MCP convert endpoint"
    
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Test the health endpoint"
    echo "2. Try converting a table"
    echo "3. Integrate with your MCP client"
    echo "4. Monitor logs: wrangler tail"
    
    echo -e "\n${YELLOW}Documentation:${NC}"
    echo "https://github.com/clem109/cloudflare-workers-table-to-image-mcp"
    
else
    echo -e "\n${RED}================================${NC}"
    echo -e "${RED}✗ Deployment Failed${NC}"
    echo -e "${RED}================================${NC}"
    echo -e "\n${YELLOW}Troubleshooting:${NC}"
    echo "1. Check wrangler.toml configuration"
    echo "2. Verify account_id is set"
    echo "3. Ensure you have permissions"
    echo "4. Check for syntax errors in code"
    exit 1
fi

# Offer to tail logs
echo -e "\n${YELLOW}Would you like to tail logs? (y/n)${NC}"
read -p "Choice: " tail_choice

if [ "$tail_choice" = "y" ] || [ "$tail_choice" = "Y" ]; then
    echo -e "${GREEN}Tailing logs (Ctrl+C to stop)...${NC}"
    if [ "$ENV" = "development" ]; then
        wrangler tail
    else
        wrangler tail --env $ENV
    fi
fi

echo -e "\n${GREEN}Thank you for using Table-to-Image MCP!${NC}"
echo -e "${GREEN}Built with ❤️  by Clement Venard${NC}\n"