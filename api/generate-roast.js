// Vercel Serverless Function to generate personalized roasts
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'GitHub username is required' });
  }

  try {
    // Fetch GitHub user data
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    if (!userResponse.ok) {
      throw new Error('GitHub user not found');
    }
    const userData = await userResponse.json();

    // Fetch user repos
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    const repos = await reposResponse.json();

    // Analyze repos
    const languages = {};
    let totalStars = 0;
    let totalForks = 0;
    let hasReadme = 0;
    let hasTests = 0;
    let oldRepos = 0;
    const repoNames = [];

    for (const repo of repos.slice(0, 20)) {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      repoNames.push(repo.name);

      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }

      // Check for README
      if (repo.has_pages || repo.description) {
        hasReadme++;
      }

      // Check if repo is old (no updates in 2+ years)
      const lastUpdate = new Date(repo.updated_at);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      if (lastUpdate < twoYearsAgo) {
        oldRepos++;
      }
    }

    const topLanguage = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    const languageCount = Object.keys(languages).length;

    // Fetch recent commits
    const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`);
    const events = await eventsResponse.json();
    const commitEvents = events.filter(e => e.type === 'PushEvent');

    // Analyze commit messages
    const commitMessages = [];
    for (const event of commitEvents.slice(0, 30)) {
      if (event.payload && event.payload.commits) {
        commitMessages.push(...event.payload.commits.map(c => c.message));
      }
    }

    // Calculate stats
    const avgCommitMessageLength = commitMessages.length > 0
      ? Math.round(commitMessages.reduce((sum, msg) => sum + msg.length, 0) / commitMessages.length)
      : 0;

    const oneWordCommits = commitMessages.filter(msg => msg.split(' ').length === 1).length;
    const hasTypos = commitMessages.some(msg =>
      /\b(teh|wrok|dont|wiht|ths|waht)\b/i.test(msg)
    );

    const stats = {
      username: userData.login,
      name: userData.name || username,
      bio: userData.bio || 'No bio',
      publicRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      createdAt: userData.created_at,
      topLanguage,
      languageCount,
      totalStars,
      totalForks,
      hasReadme,
      hasTests,
      oldRepos,
      avgCommitMessageLength,
      oneWordCommits,
      hasTypos,
      totalCommitMessages: commitMessages.length,
      repoNames: repoNames.slice(0, 10)
    };

    // Generate roast with Groq
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const prompt = `You are a brutally honest but funny code reviewer. Generate a hilarious roast report for this GitHub user. Use the exact HTML structure format provided below, but fill it with custom roasts based on their actual GitHub data.

GitHub User: ${stats.username}
Name: ${stats.name}
Bio: ${stats.bio}
Public Repos: ${stats.publicRepos}
Followers: ${stats.followers} | Following: ${stats.following}
Account Age: ${new Date(stats.createdAt).getFullYear()}
Top Language: ${stats.topLanguage} (${languageCount} languages total)
Total Stars: ${stats.totalStars} | Total Forks: ${stats.totalForks}
Repos without README: ${stats.publicRepos - stats.hasReadme}
Abandoned repos (2+ years old): ${stats.oldRepos}
Avg commit message length: ${stats.avgCommitMessageLength} characters
One-word commits: ${stats.oneWordCommits}
Has typos in commits: ${hasTypos ? 'Yes' : 'No'}
Recent commit messages analyzed: ${stats.totalCommitMessages}
Sample repo names: ${stats.repoNames.join(', ')}

Generate a roast report that:
1. Roasts their choice of ${stats.topLanguage} as their main language
2. Makes fun of their commit message quality (especially if they're short or have typos)
3. Jokes about their follower/following ratio
4. Roasts their repo naming conventions
5. Makes fun of abandoned repos if they have any
6. Jokes about their star count
7. Roasts specific patterns you notice in their data

Be SAVAGE but FUNNY. Use internet humor, programming memes, and clever observations. Don't hold back!

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "title": "A one-line savage title",
  "subtitle": "A funny subtitle with their stats",
  "glanceSections": {
    "working": "What's somehow working (2-3 sentences, be funny but acknowledge something positive)",
    "hindering": "What's hilariously bad (2-3 sentences, savage roast)",
    "quickWins": "Quick fix suggestions (2-3 sentences, sarcastic)",
    "dreams": "Impossible dreams (2-3 sentences, funny fantasy scenarios)"
  },
  "projects": [
    {
      "name": "Roast category name (e.g., 'The Abandoned Graveyard')",
      "count": "~X repos",
      "description": "2-3 sentence roast about this category of their work"
    }
  ],
  "narrative": "A longer 3-paragraph roast narrative analyzing their entire GitHub presence, coding style, and developer persona. Be detailed and savage.",
  "wins": [
    {
      "title": "Sarcastic achievement title",
      "description": "2-3 sentence sarcastic description"
    }
  ],
  "friction": [
    {
      "title": "Problem category",
      "description": "What they're doing wrong",
      "examples": ["Example 1", "Example 2", "Example 3"]
    }
  ],
  "funEnding": {
    "headline": "A hilarious one-liner observation",
    "detail": "2-3 sentences expanding on the joke"
  }
}`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a hilarious and brutally honest code reviewer who generates savage but funny roasts. Always return valid JSON only, no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 4000
      })
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const groqData = await groqResponse.json();
    let roastContent = groqData.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    roastContent = roastContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const roast = JSON.parse(roastContent);

    // Return combined data
    res.status(200).json({
      stats,
      roast
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
