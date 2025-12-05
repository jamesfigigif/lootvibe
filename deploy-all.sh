#!/bin/bash

# 🚀 Deploy All - LootVibe Complete Deployment Script
# This script deploys backend, frontend, and edge functions

set -e  # Exit on any error

echo "🚀 Starting complete deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="/Users/luke/Downloads/lootvibe"

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Ask for confirmation
read -p "Deploy everything? (frontend, backend, edge functions) [y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Get commit message
read -p "Enter commit message: " commit_message
if [ -z "$commit_message" ]; then
    commit_message="deploy: Update application"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 1: Deploy Backend to Heroku"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$PROJECT_ROOT/backend"

# Check if there are changes
if [[ -z $(git status -s) ]]; then
    echo "${YELLOW}⚠️  No backend changes to commit${NC}"
else
    echo "📝 Committing backend changes..."
    git add .
    git commit -m "$commit_message" || echo "Nothing to commit"

    echo "📤 Pushing to GitHub..."
    git push github main || echo "${YELLOW}⚠️  GitHub push failed (continuing...)${NC}"

    echo "🚀 Deploying to Heroku..."
    git push heroku main

    echo "${GREEN}✅ Backend deployed successfully${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 2: Deploy Edge Functions to Supabase"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$PROJECT_ROOT"

# Array of functions to deploy
functions=(
    "battle-claim"
    "battle-join"
    "battle-create"
    "battle-spin"
    "box-open"
    "item-exchange"
    "claim-free-box"
)

for func in "${functions[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo "📤 Deploying $func..."
        supabase functions deploy "$func" || echo "${YELLOW}⚠️  Failed to deploy $func${NC}"
    fi
done

echo "${GREEN}✅ Edge functions deployed${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 3: Deploy Frontend to Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$PROJECT_ROOT"

# Check if there are changes
if [[ -z $(git status -s) ]]; then
    echo "${YELLOW}⚠️  No frontend changes to commit${NC}"
else
    echo "📝 Committing frontend changes..."
    git add .
    git commit -m "$commit_message" || echo "Nothing to commit"

    echo "📤 Pushing to GitHub..."
    git push origin main

    echo "${GREEN}✅ Frontend pushed (Vercel will auto-deploy)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎉 DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Backend: https://lootvibe-backend-12913253d7a4.herokuapp.com"
echo "✅ Frontend: https://lootvibe.com"
echo "✅ Edge Functions: https://supabase.com/dashboard/project/hpflcuyxmwzrknxjgavd/functions"
echo ""
echo "📊 Monitor logs:"
echo "   Backend:  heroku logs --tail"
echo "   Frontend: https://vercel.com/dashboard"
echo "   Supabase: https://supabase.com/dashboard/project/hpflcuyxmwzrknxjgavd/logs"
echo ""
