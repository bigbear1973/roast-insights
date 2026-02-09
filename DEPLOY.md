# 🚀 Deployment Instructions

## Option 1: Deploy to Vercel (Recommended - 2 minutes)

### Via Vercel Dashboard (Easiest)

1. **Go to Vercel**: https://vercel.com/new

2. **Import your GitHub repo**:
   - Click "Import Git Repository"
   - Select: `bigbear1973/roast-insights`

3. **Add Environment Variable**:
   - Before deploying, expand "Environment Variables"
   - Add:
     - Name: `GROQ_API_KEY`
     - Value: `[YOUR_GROQ_API_KEY]` (get from https://console.groq.com/keys)

4. **Click Deploy** 🎉

Your site will be live at: `https://roast-insights-[random].vercel.app`

---

### Via CLI (Alternative)

```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy
cd ~/roast-insights
npx vercel

# 3. Set environment variable
npx vercel env add GROQ_API_KEY
# Paste your Groq API key when prompted

# 4. Deploy to production
npx vercel --prod
```

---

## Option 2: Deploy to Netlify

1. **Go to Netlify**: https://app.netlify.com/start

2. **Import from GitHub**:
   - Connect your GitHub account
   - Select: `bigbear1973/roast-insights`

3. **Build Settings**:
   - Build command: (leave empty)
   - Publish directory: `/`

4. **Environment Variables**:
   - Key: `GROQ_API_KEY`
   - Value: Your Groq API key

5. **Click Deploy**

**Note**: For Netlify, you'll need to change the API endpoint in `index.html`:
```javascript
// Change from:
const response = await fetch('/api/generate-roast', {

// To:
const response = await fetch('/.netlify/functions/generate-roast', {
```

---

## Option 3: Test Locally First

```bash
cd ~/roast-insights

# Install Vercel CLI globally
npm i -g vercel

# Run local dev server (with your API key in .env)
vercel dev

# Open: http://localhost:3000
```

Test with: `/insights torvalds` or any GitHub username!

---

## 🎯 Quick Test Commands

Try these GitHub usernames to see different roast styles:

- `/insights torvalds` - Linux kernel legend
- `/insights gvanrossum` - Python creator
- `/insights dhh` - Ruby on Rails creator
- `/insights tj` - Express.js creator
- `/insights sindresorhus` - npm package god

---

## Troubleshooting

**API Key Issues?**
- Make sure the environment variable is named exactly: `GROQ_API_KEY`
- Redeploy after adding environment variables

**CORS Errors?**
- The serverless function handles CORS automatically
- Make sure you're calling the right endpoint (`/api/generate-roast`)

**GitHub Rate Limiting?**
- GitHub API has a 60 requests/hour limit for unauthenticated requests
- For production, add a `GITHUB_TOKEN` to increase limits

---

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Groq Console: https://console.groq.com/
- GitHub Repo: https://github.com/bigbear1973/roast-insights
