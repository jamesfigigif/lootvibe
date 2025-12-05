#!/bin/bash

# 🚀 Deploy Edge Functions - Quick Script

set -e  # Exit on any error

echo "🚀 Deploying Supabase Edge Functions..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navigate to project root
cd /Users/luke/Downloads/lootvibe

# Array of functions
functions=(
    "battle-claim"
    "battle-join"
    "battle-create"
    "battle-spin"
    "box-open"
    "item-exchange"
    "claim-free-box"
)

echo ""
echo "Available functions:"
for i in "${!functions[@]}"; do
    echo "  $((i+1)). ${functions[$i]}"
done
echo "  a. Deploy ALL functions"
echo ""

read -p "Select function to deploy (1-7 or 'a' for all): " choice

if [ "$choice" = "a" ] || [ "$choice" = "A" ]; then
    echo "📤 Deploying all functions..."
    for func in "${functions[@]}"; do
        if [ -d "supabase/functions/$func" ]; then
            echo "  → $func"
            supabase functions deploy "$func" || echo "${YELLOW}⚠️  Failed: $func${NC}"
        fi
    done
elif [ "$choice" -ge 1 ] && [ "$choice" -le 7 ]; then
    func="${functions[$((choice-1))]}"
    echo "📤 Deploying $func..."
    supabase functions deploy "$func"
else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 View logs: https://supabase.com/dashboard/project/hpflcuyxmwzrknxjgavd/logs"
