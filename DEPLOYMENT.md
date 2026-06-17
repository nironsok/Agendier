# Agendier Launch Deployment

This repository contains the exact static site initially served from
`http://localhost:5185/`, plus a Vercel API function at `/api/waitlist`.

## 1. Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/waitlist.sql`.
4. Copy your Project URL and publishable or anon key:
   - New projects: `sb_publishable_...`
   - Legacy projects: `anon`

For local testing, create `.env.local`:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_insert_key
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
2. Leave Root Directory unset.
3. Leave Build Command empty.
4. Leave Output Directory empty.
5. Optional: add environment variables for Production, Preview, and Development:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY`
6. Deploy.

After deployment, submit the live waitlist form and confirm a row appears in
Supabase under `waitlist_subscribers`.
