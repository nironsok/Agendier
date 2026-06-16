# Agendier Launch Deployment

This folder contains the exact static site currently served from
`http://localhost:5185/`, plus a Vercel API function at `/api/waitlist`.

## 1. Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/waitlist.sql`.
4. Copy your Project URL and server-only key:
   - New projects: `sb_secret_...`
   - Legacy projects: `service_role`

For local testing, create `agendier-launch/.env.local`:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_server_only_key
```

Never commit `.env.local`.

## 2. GitHub

From the repository root:

```bash
git add agendier-launch
git commit -m "Add Agendier launch site"
gh repo create agendier --private --source=. --remote=origin --push
```

If your GitHub repo already exists:

```bash
git remote add origin https://github.com/YOUR_USERNAME/agendier.git
git push -u origin main
```

## 3. Vercel

1. Import the GitHub repository.
2. Set Root Directory to `agendier-launch`.
3. Leave Build Command empty.
4. Leave Output Directory empty.
5. Add environment variables for Production, Preview, and Development:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
6. Deploy.

After deployment, submit the live waitlist form and confirm a row appears in
Supabase under `waitlist_subscribers`.
