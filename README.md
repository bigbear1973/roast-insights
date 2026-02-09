# 🔥 GitHub Roast Generator

A hilarious AI-powered tool that analyzes your GitHub profile and generates a savage (but funny) roast report based on your actual repos, commits, and coding habits!

## Features

- 🎨 **Baude Code Terminal UI** - Beautiful terminal interface
- 🤖 **AI-Powered Roasts** - Uses Groq's Llama 3.3 70B model for creative, personalized roasts
- 📊 **Real GitHub Analysis** - Fetches your actual repos, commit messages, languages, and more
- 🎭 **Fully Customized Reports** - Every roast is unique based on your GitHub data

## How It Works

1. Type `/insights <github-username>` in the terminal
2. The app fetches your GitHub profile data (repos, commits, languages, etc.)
3. AI analyzes your coding patterns and generates a hilarious custom roast
4. View your personalized roast report with stats and savage commentary

## Deployment

### Deploy to Vercel (Recommended)

1. **Get a Groq API Key** (Free!):
   - Go to https://console.groq.com/keys
   - Sign up and create an API key
   - Copy it for the next step

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   cd roast-insights
   vercel

   # Add your Groq API key as an environment variable
   vercel env add GROQ_API_KEY
   ```

3. **Set Environment Variable**:
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add `GROQ_API_KEY` with your Groq API key
   - Redeploy: `vercel --prod`

## Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your Groq API key to .env
echo "GROQ_API_KEY=your_key_here" > .env

# Run locally with Vercel dev server
vercel dev
```

## API Endpoints

### POST `/api/generate-roast`

Analyzes a GitHub user and generates a personalized roast.

**Request Body:**
```json
{
  "username": "torvalds"
}
```

**Response:**
```json
{
  "stats": {
    "username": "torvalds",
    "publicRepos": 10,
    "followers": 200000,
    "topLanguage": "C",
    ...
  },
  "roast": {
    "title": "The Kernel Cultist",
    "narrative": "...",
    "projects": [...],
    "wins": [...],
    "friction": [...]
  }
}
```

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI**: Groq API (Llama 3.3 70B)
- **Data Source**: GitHub REST API

## License

MIT - Feel free to roast your friends!

## Credits

Built with Baude Code 🤖

---

**Warning:** May contain brutal honesty about your code quality. Use at your own risk! 🔥
