# Scripture Memorizer — Web App

## Quick Setup (15 minutes)

### Step 1: Supabase — Run the migration SQL
1. Go to https://supabase.com/dashboard/project/gqgfghcyfewauszgijpr/sql/new
2. Paste the contents of `supabase_migration.sql` and click Run
3. Then run this to approve yourself (replace with your email):
   ```sql
   insert into approved_users (email) values ('your-email@gmail.com');
   ```

### Step 2: Supabase — Enable Google OAuth
1. Go to https://supabase.com/dashboard/project/gqgfghcyfewauszgijpr/auth/providers
2. Enable Google provider
3. Follow the prompts to create a Google Cloud OAuth app:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URI: `https://gqgfghcyfewauszgijpr.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret back into Supabase

### Step 3: Get your Supabase anon key
1. Go to https://supabase.com/dashboard/project/gqgfghcyfewauszgijpr/settings/api
2. Copy the `anon public` key

### Step 4: Deploy to Vercel
1. Go to https://vercel.com/new
2. Choose "Deploy without Git" and drag this entire project folder
3. Add these Environment Variables:
   - `VITE_SUPABASE_URL` = `https://gqgfghcyfewauszgijpr.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (paste from step 3)
   - `VITE_ADMIN_EMAIL` = your-email@gmail.com
4. Framework: **Vite**
5. Build command: `npm run build`
6. Output directory: `dist`
7. Click Deploy!

### Step 5: Update Supabase with your Vercel URL
Once deployed, copy your `https://your-app.vercel.app` URL then:
1. Go to https://supabase.com/dashboard/project/gqgfghcyfewauszgijpr/auth/url-configuration
2. Add your Vercel URL to "Redirect URLs"
3. Go to Google Cloud Console → your OAuth app → add `https://your-app.vercel.app` to Authorized JavaScript origins

### Inviting Users
Once you're signed in, go to **Users & Data** → scroll to bottom → **Manage Invites**.
Enter their Google email address and tap Invite. They'll be able to sign in immediately.

## Architecture
- **Auth**: Google OAuth via Supabase Auth
- **Private data**: Each user's scripture data stored in `user_data` table (RLS-protected, only they can read/write)
- **Shared data**: Community scriptures in `shared_scriptures` table (any approved user can read/write)
- **Invite list**: `approved_users` table — sign-in is rejected if email not in this table
- **Admin**: The email in `VITE_ADMIN_EMAIL` sees the Invite panel in Users & Data
