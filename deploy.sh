#!/bin/bash

# Cloudflare Workers Table-to-Image MCP Deployment Script
# Author: Clement Venard
# License: MIT

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}================================${NC}"
echo -e "${CYAN}Table-to-Image MCP Deployment${NC}"
echo -e "${CYAN}================================${NC}"
echo ""
echo -e "${GREEN}✨ ZERO-CONFIG DEPLOYMENT ✨${NC}"
echo -e "${GREEN}No environment variables required!${NC}"
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

# Check for optional environment variables
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Optional Configuration Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

HAS_ENV=false
if [ -f ".env" ]; then
    source .env
    echo -e "${GREEN}✓ .env file found${NC}"
    HAS_ENV=true
else
    echo -e "${CYAN}ℹ No .env file (this is fine - using defaults)${NC}"
fi

# Optional: Set secrets if provided
if [ ! -z "$QUICKCHART_API_KEY" ]; then
    echo -e "\n${YELLOW}Setting QuickChart API key...${NC}"
    echo "$QUICKCHART_API_KEY" | wrangler secret put QUICKCHART_API_KEY
    echo -e "${GREEN}✓ QuickChart API key configured${NC}"
else
    echo -e "${CYAN}ℹ No QuickChart API key (using free tier)${NC}"
fi

if [ ! -z "$MCP_API_KEY" ]; then
    echo -e "\n${YELLOW}Setting MCP API key...${NC}"
    echo "$MCP_API_KEY" | wrangler secret put MCP_API_KEY
    echo -e "${GREEN}✓ MCP API key configured${NC}"
else
    echo -e "${CYAN}ℹ No MCP API key (no authentication required)${NC}"
fi

echo -e "\n${GREEN}✓ Configuration complete (using built-in defaults)${NC}"

# Select environment
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Deployment Environment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Select deployment environment:${NC}"
echo "1) Development (default)"
echo "2) Staging"
echo "3) Production"
echo ""
read -p "Enter choice (1-3) [1]: " env_choice

# Default to development if no choice
env_choice=${env_choice:-1}

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
        echo -e "${YELLOW}Invalid choice. Using development.${NC}"
        ENV="development"
        ;;
esac

echo -e "${GREEN}Deploying to: $ENV${NC}"

# Deploy
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Deploying to Cloudflare Workers...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$ENV" = "development" ]; then
    wrangler deploy
else
    wrangler deploy --env $ENV
fi

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Deployment Successful!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Get worker URL
    echo -e "\n${CYAN}🚀 Your worker is now live!${NC}"
    echo ""
    if [ "$ENV" = "production" ]; then
        echo -e "${GREEN}   https://table-to-image-mcp-prod.your-subdomain.workers.dev${NC}"
    elif [ "$ENV" = "staging" ]; then
        echo -e "${GREEN}   https://table-to-image-mcp-staging.your-subdomain.workers.dev${NC}"
    else
        echo -e "${GREEN}   https://table-to-image-mcp.your-subdomain.workers.dev${NC}"
    fi
    
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Available Endpoints:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  ${CYAN}GET${NC}  /health       - Health check"
    echo -e "  ${CYAN}POST${NC} /convert      - Convert table to image"
    echo -e "  ${CYAN}GET${NC}  /mcp          - MCP server info"
    echo -e "  ${CYAN}POST${NC} /mcp/convert  - MCP convert endpoint"
    
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Next Steps:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "1. Test the health endpoint:"
    echo -e "   ${GREEN}curl https://your-worker.workers.dev/health${NC}"
    echo ""
    echo "2. Try converting a table:"
    echo -e "   ${GREEN}curl -X POST https://your-worker.workers.dev/convert \\${NC}"
    echo -e "   ${GREEN}     -H 'Content-Type: application/json' \\${NC}"
    echo -e "   ${GREEN}     -d '{\"table\":{\"headers\":[\"A\",\"B\"],\"rows\":[[\"1\",\"2\"]]}}'${NC}"
    echo ""
    echo "3. Integrate with your MCP client"
    echo "4. Monitor logs: wrangler tail"
    
    if [ "$HAS_ENV" = false ]; then
        echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${CYAN}💡 Pro Tip:${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "You're using the ${GREEN}free QuickChart tier${NC} (no API key needed)."
        echo -e "To increase rate limits, get a free API key from:"
        echo -e "${CYAN}https://quickchart.io/pricing/${NC}"
        echo ""
        echo -e "Then set it with:"
        echo -e "${GREEN}echo 'your-key' | wrangler secret put QUICKCHART_API_KEY${NC}"
    fi
    
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📚 Documentation:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}https://github.com/clem109/cloudflare-workers-table-to-image-mcp${NC}"
    
else
    echo -e "\n${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ Deployment Failed${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "\n${YELLOW}Troubleshooting:${NC}"
    echo "1. Check wrangler.toml configuration"
    echo "2. Verify you're logged into Cloudflare"
    echo "3. Ensure you have deployment permissions"
    echo "4. Check for syntax errors in code"
    echo ""
    echo -e "${CYAN}Need help? Create an issue:${NC}"
    echo "https://github.com/clem109/cloudflare-workers-table-to-image-mcp/issues"
    exit 1
fi

# Offer to tail logs
echo -e "\n${YELLOW}Would you like to tail logs? (y/n) [n]:${NC} "
read -p "" tail_choice

tail_choice=${tail_choice:-n}

if [ "$tail_choice" = "y" ] || [ "$tail_choice" = "Y" ]; then
    echo -e "${GREEN}Tailing logs (Ctrl+C to stop)...${NC}"
    echo ""
    if [ "$ENV" = "development" ]; then
        wrangler tail
    else
        wrangler tail --env $ENV
    fi
fi

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Thank you for using Table-to-Image MCP!${NC}"
echo -e "${GREEN}Built with ❤️  by Clement Venard${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
