# Errand · Vercel Deploy Guide

## What's in this folder

```
errand-next/
├── src/
│   ├── app/
│   │   ├── layout.jsx          ← root HTML shell + metadata
│   │   ├── page.jsx            ← entry point (renders ErrandApp)
│   │   ├── globals.css         ← minimal global reset
│   │   └── api/
│   │       ├── ai/route.js     ← server-side Claude proxy
│   │       └── paystack/
│   │           └── verify/route.js  ← server-side payment verification
│   └── components/
│       └── ErrandApp.jsx       ← your full app (3400+ lines)
├── public/
│   └── manifest.json           ← PWA config (installable on mobile)
├── .env.local                  ← your real keys (never committed)
├── .env.example                ← template to share with team
├── .gitignore                  ← keeps secrets out of git
├── next.config.js
├── vercel.json
└── package.json
```

---

## Step 1 — Install Node.js (if you don't have it)

Download from **[nodejs.org](https://nodejs.org)** — install the LTS version.

Verify it worked:
```bash
node --version   # should show v18 or higher
npm --version
```

---

## Step 2 — Set up the project locally

```bash
# Navigate to the errand-next folder you downloaded
cd errand-next

# Install dependencies (~30 seconds)
npm install

# Start the dev server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** — you should see Errand running.

---

## Step 3 — Get your Anthropic API key

The AI features (search, recommendations, assistant, help chat) now run through a secure server-side API route — the key never reaches the browser.

1. Go to **[console.anthropic.com](https://console.anthropic.com)**
2. Sign in → **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`)
4. Open `.env.local` and replace:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```
   with your actual key.

---

## Step 4 — Push to GitHub

```bash
# Initialise a git repo
git init
git add .
git commit -m "Initial Errand app commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/errand-app.git
git push -u origin main
```

---

## Step 5 — Deploy to Vercel

1. Go to **[vercel.com](https://vercel.com)** → sign in with GitHub
2. Click **Add New → Project**
3. Import your `errand-app` GitHub repo
4. Vercel auto-detects Next.js — no config needed
5. **Before clicking Deploy**, add your environment variables:

   Click **Environment Variables** and add all five:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://wvtrpugktvnualpbjadd.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (your full anon key) |
   | `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_test_5150ff...` |
   | `PAYSTACK_SECRET_KEY` | `sk_test_...` (from Paystack dashboard) |
   | `ANTHROPIC_API_KEY` | `sk-ant-...` (from Anthropic console) |

6. Click **Deploy** — takes ~60 seconds
7. Your app is live at `https://errand-app-xyz.vercel.app` 🎉

---

## Step 6 — Add a custom domain (optional)

1. In Vercel → your project → **Settings → Domains**
2. Click **Add Domain** → type `errand.ng` (or whatever you own)
3. Follow the DNS instructions for your registrar

---

## How it works in production

```
Browser → Vercel Edge
              │
              ├── / (page.jsx)           → serves ErrandApp
              ├── /api/ai                → calls Anthropic API (key hidden)
              └── /api/paystack/verify   → calls Paystack API (key hidden)
                        │
                        └── Supabase (auth + DB + realtime)
```

**Why this is better than the single JSX file:**
- `ANTHROPIC_API_KEY` is never sent to the browser
- `PAYSTACK_SECRET_KEY` is never sent to the browser
- Payments are verified server-side before confirming orders
- Vercel handles scaling, CDN, and HTTPS automatically
- You can update env vars without redeploying

---

## Updating the app

After any changes:
```bash
git add .
git commit -m "your change description"
git push
```

Vercel automatically redeploys on every push to `main`. Usually live in under 30 seconds.

---

## Troubleshooting

**AI features not working?**
→ Check `ANTHROPIC_API_KEY` is set correctly in Vercel's environment variables

**Payments failing?**
→ Make sure `PAYSTACK_SECRET_KEY` is set (different from the public key)

**Auth not working?**
→ In Supabase → Authentication → URL Configuration, add your Vercel URL to "Redirect URLs"

**Build failing?**
→ Run `npm run build` locally first to catch errors before pushing
