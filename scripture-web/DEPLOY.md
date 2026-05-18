# Scripture Memorizer — Deploy Guide

## What's already done
- ✅ Supabase project created: `gqgfghcyfewauszgijpr`
- ✅ Database tables + RLS policies applied (approved_users, user_data, shared_scriptures)
- ✅ App built with real Supabase anon key baked in

---

## What you need to do (one-time, ~15 min)

### 1. Enable Google OAuth in Supabase

Go to: https://supabase.com/dashboard/project/gqgfghcyfewauszgijpr/auth/providers

- Enable **Google**
- You'll need a **Google OAuth client ID + secret**:
  1. Go to https://console.cloud.google.com/apis/credentials
  2. Create a project → Create Credentials → OAuth 2.0 Client ID
  3. Application type: **Web application**
  4. Add Authorized redirect URI: `https://gqgfghcyfewauszgijpr.supabase.co/auth/v1/callback`
  5. Copy Client ID + Secret back into Supabase

### 2. Deploy to Vercel

Install Vercel CLI if you don't have it:
```bash
npm install -g vercel
```

From this folder:
```bash
vercel --prod
```

When prompted:
- Link to existing project? **No** → create new
- Project name: `scripture-memorizer`
- Build command: `npm run build`
- Output directory: `dist`

**Add environment variables when prompted** (or in Vercel dashboard afterwards):
```
VITE_SUPABASE_URL     = https://gqgfghcyfewauszgijpr.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxZ2ZnaGN5ZmV3YXVzemdpanByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDk2MTMsImV4cCI6MjA5NDYyNTYxM30.pYZ0TkRNoegPKdYKANB5dK-4D0Z5uTZbiBETNB-Ay8Y
```

### 3. Add your Vercel URL to Supabase

Once deployed, you'll get a URL like `https://scripture-memorizer-xyz.vercel.app`

Go to: https://supabase.com/dashboard/project/gqgfghcyfewauszgijpr/auth/url-configuration

Add to **Redirect URLs**:
```
https://your-vercel-url.vercel.app
```

### 4. Approve yourself (first sign-in)

After your first Google sign-in, run this in Supabase SQL editor:
https://supabase.com/dashboard/project/gqgfghcyfewauszgijpr/sql

```sql
INSERT INTO public.approved_users (email) VALUES ('your@gmail.com');
```

### 5. Set yourself as admin in the app

In the app, go to **Users & Data**. To unlock the invite panel, your email
needs to match `data.adminEmail`. On first load, open the browser console and run:

```js
// This will be set automatically once you sign in — the app reads session.user.email
// The invite panel appears automatically for the first user / project owner
```

Actually: the invite panel is shown to whoever has `data.adminEmail` set.
Set it once via Supabase SQL:
```sql
-- This is stored in your user_data row after first use
-- The app shows invite panel to the first approved user automatically
```

**Simpler**: The app shows the invite panel if `isAdmin` is true, which checks
`session.user.email === data.adminEmail`. To bootstrap, temporarily hardcode your
email in ScriptureApp.jsx line ~5770:
```js
const isAdmin = session?.user?.email === 'your@gmail.com';
```
Then redeploy once to unlock invites.

---

## Inviting someone
Once you're in, go to **Users & Data → Manage Invites**, type their email, tap Invite.
They'll be able to sign in with that Google account immediately.

## Project info
- Supabase project: https://supabase.com/dashboard/project/gqgfghcyfewauszgijpr
- Each user's scriptures are private (RLS-protected, only they can read/write)
- Shared scriptures table is readable by all approved users
