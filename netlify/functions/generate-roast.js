// Netlify Serverless Function to generate personalized roasts
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const { username } = body;

  if (!username) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'GitHub username is required' })
    };
  }

  try {
    // Fetch GitHub user data
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'User-Agent': 'Baude-Code-Roaster',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      const errorMsg = errorData.message || `GitHub API returned status ${userResponse.status}`;
      throw new Error(errorMsg);
    }
    const userData = await userResponse.json();

    // Fetch user repos
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
      headers: {
        'User-Agent': 'Baude-Code-Roaster',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const repos = await reposResponse.json();

    // Analyze repos
    const languages = {};
    let totalStars = 0;
    let totalForks = 0;
    let hasReadme = 0;
    let oldRepos = 0;
    const repoNames = [];

    for (const repo of repos.slice(0, 20)) {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      repoNames.push(repo.name);

      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }

      if (repo.has_pages || repo.description) {
        hasReadme++;
      }

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
    const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, {
      headers: {
        'User-Agent': 'Baude-Code-Roaster',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const events = await eventsResponse.json();
    const commitEvents = events.filter(e => e.type === 'PushEvent');

    const commitMessages = [];
    for (const event of commitEvents.slice(0, 30)) {
      if (event.payload && event.payload.commits) {
        commitMessages.push(...event.payload.commits.map(c => c.message));
      }
    }

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

    const prompt = `You are a brutally honest but funny code reviewer. Generate a hilarious roast report for this GitHub user based on their actual GitHub data.

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

Be SAVAGE but FUNNY. Roast their language choice, commit messages, follower ratio, repo names, abandoned repos, and star count. Use internet humor and programming memes!

CRITICAL: Return ONLY valid JSON. Escape all quotes in strings. No markdown, no code blocks, no extra text:
{
  "title": "A one-line savage title",
  "subtitle": "A funny subtitle with their stats",
  "glanceSections": {
    "working": "What's somehow working (2-3 sentences)",
    "hindering": "What's hilariously bad (2-3 sentences)",
    "quickWins": "Quick fix suggestions (2-3 sentences, sarcastic)",
    "dreams": "Impossible dreams (2-3 sentences)"
  },
  "projects": [
    {
      "name": "Category name",
      "count": "~X repos",
      "description": "2-3 sentence roast"
    }
  ],
  "narrative": "A 3-paragraph roast analyzing their entire GitHub presence",
  "wins": [
    {
      "title": "Sarcastic achievement",
      "description": "2-3 sentences"
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
    "headline": "A hilarious one-liner",
    "detail": "2-3 sentences"
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
            content: 'You are a hilarious code reviewer who generates savage but funny roasts. Always return valid JSON only. Properly escape all quotes and special characters in JSON strings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const groqData = await groqResponse.json();
    let roastContent = groqData.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    roastContent = roastContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to parse the JSON with better error handling
    let roast;
    try {
      roast = JSON.parse(roastContent);
    } catch (parseError) {
      // Log the problematic JSON for debugging
      console.error('Failed to parse Groq response:', roastContent.substring(0, 500));
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stats,
        roast
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
