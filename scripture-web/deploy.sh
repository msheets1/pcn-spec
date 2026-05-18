#!/bin/bash
set -e

echo "📖 Scripture Memorizer — Deploy Script"
echo "======================================="

# Check for vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

# Set env vars for the build
export VITE_SUPABASE_URL="https://gqgfghcyfewauszgijpr.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxZ2ZnaGN5ZmV3YXVzemdpanByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDk2MTMsImV4cCI6MjA5NDYyNTYxM30.pYZ0TkRNoegPKdYKANB5dK-4D0Z5uTZbiBETNB-Ay8Y"

if [ -z "$VITE_ADMIN_EMAIL" ]; then
  read -p "Enter your Google email (for admin access): " VITE_ADMIN_EMAIL
  export VITE_ADMIN_EMAIL
fi

echo ""
echo "Building..."
npm install
npm run build

echo ""
echo "Deploying to Vercel..."
vercel deploy --prod \
  --scope team_OUr8MTLCaLsSP5kJKS3xcN0U \
  --build-env VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-env VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  --build-env VITE_ADMIN_EMAIL="$VITE_ADMIN_EMAIL" \
  --yes

echo ""
echo "✅ Deployed! Check the URL above."
echo ""
echo "Next steps:"
echo "1. Copy your Vercel URL (e.g. https://scripture-memorizer-xxx.vercel.app)"
echo "2. Go to https://supabase.com/dashboard/project/gqgfghcyfewauszgijpr/auth/url-configuration"
echo "3. Add your Vercel URL to Redirect URLs"
echo "4. Set up Google OAuth at https://supabase.com/dashboard/project/gqgfghcyfewauszgijpr/auth/providers"
echo "5. After first sign-in, run in Supabase SQL editor:"
echo "   INSERT INTO approved_users (email) VALUES ('$VITE_ADMIN_EMAIL');"
