import { NextResponse } from 'next/server';
import geminiInstance from '@/lib/gemini';
import { TOPIC_SUGGESTION_PROMPT } from '@/lib/prompts';

/**
 * Builds a powerful, context-aware prompt from user input
 * Handles various input styles: direct niche, natural language, conversational requests
 */
function buildIntelligentPrompt(userInput) {
  const input = userInput?.trim() || '';
  
  if (!input) {
    return {
      prompt: `[MODE: Discovery]
No specific input provided. Analyze current tech landscape and identify:
- Emerging pain points developers/users face RIGHT NOW
- Common setup/configuration challenges trending in forums
- Error messages that are frequently searched but poorly documented
- Integration problems between popular tools/frameworks

Focus on HIGH-IMPACT problems where a comprehensive guide would rank well.`,
      metadata: { mode: 'discovery', hasContext: false }
    };
  }

  // Detect if input is a simple niche keyword or natural language
  const isNaturalLanguage = input.includes(' ') && (
    /\b(i want|i need|suggest|give me|looking for|help me|can you|please|today|for my|about)\b/i.test(input)
  );

  // Extract contextual signals from the input
  const contextSignals = {
    timeContext: extractTimeContext(input),
    audienceHints: extractAudienceHints(input),
    platformContext: extractPlatformContext(input),
    contentPreferences: extractContentPreferences(input),
    techStack: extractTechStack(input)
  };

  // Build the intelligent prompt
  let prompt = `[MODE: ${isNaturalLanguage ? 'Natural Language Understanding' : 'Direct Niche Analysis'}]

=== USER INPUT ===
"${input}"

=== EXTRACTED CONTEXT ===
${formatContextSignals(contextSignals)}

=== YOUR TASK ===
1. **UNDERSTAND THE INTENT**: Parse the user's input to understand EXACTLY what they're looking for, even if expressed casually or indirectly.
   - If they mention "web view" → focus on WebView development (Android/iOS/React Native/Electron)
   - If they mention "today" → focus on current trending issues and recent updates
   - If they mention personal context ("my app", "my project") → tailor suggestions to practical implementation

2. **EXTRACT THE CORE NICHE**: Identify the primary topic area from natural language. Examples:
   - "I want blog ideas for my React app" → Niche: React Development
   - "Suggest something about web views today" → Niche: WebView Development (Current Issues)
   - "Give me backend topics" → Niche: Backend Development

3. **APPLY CONTEXT INTELLIGENTLY**:
   ${contextSignals.timeContext ? `- Time Context: Focus on ${contextSignals.timeContext}` : '- Time Context: Include both evergreen and trending topics'}
   ${contextSignals.platformContext ? `- Platform Focus: ${contextSignals.platformContext}` : ''}
   ${contextSignals.techStack.length > 0 ? `- Tech Stack: ${contextSignals.techStack.join(', ')}` : ''}

4. **GENERATE TARGETED TOPICS**: Based on your understanding, suggest topics that:
   - Directly solve problems users are actively searching for
   - Match the user's implied expertise level
   - Are specific enough to rank well but broad enough to attract traffic
   - Have clear "how-to" or "fix this" angles`;

  return {
    prompt,
    metadata: { 
      mode: isNaturalLanguage ? 'nlp' : 'direct', 
      hasContext: true,
      signals: contextSignals
    }
  };
}

/**
 * Extract time-related context from input
 */
function extractTimeContext(input) {
  const patterns = [
    { regex: /\b(today|right now|currently|latest)\b/i, value: 'current/trending issues (2024-2026)' },
    { regex: /\b(this week|recent|new)\b/i, value: 'recent developments and updates' },
    { regex: /\b(trending|popular|hot|viral)\b/i, value: 'trending/high-search-volume topics' },
    { regex: /\b(evergreen|timeless|fundamental)\b/i, value: 'evergreen content with lasting value' },
    { regex: /\b(2024|2025|2026)\b/i, value: (match) => `${match[0]}-specific topics and updates` }
  ];
  
  for (const { regex, value } of patterns) {
    const match = input.match(regex);
    if (match) return typeof value === 'function' ? value(match) : value;
  }
  return null;
}

/**
 * Extract audience hints from input
 */
function extractAudienceHints(input) {
  const patterns = [
    { regex: /\b(beginner|newbie|starting|learn)\b/i, value: 'beginners' },
    { regex: /\b(advanced|expert|senior|deep dive)\b/i, value: 'advanced developers' },
    { regex: /\b(intermediate|mid-level)\b/i, value: 'intermediate developers' },
    { regex: /\b(my team|our project|enterprise)\b/i, value: 'professional/enterprise teams' }
  ];
  
  for (const { regex, value } of patterns) {
    if (regex.test(input)) return value;
  }
  return null;
}

/**
 * Extract platform/environment context
 */
function extractPlatformContext(input) {
  const platforms = [];
  const patterns = [
    { regex: /\bweb\s*view\b/i, value: 'WebView (Mobile/Desktop Hybrid Apps)' },
    { regex: /\b(android|kotlin)\b/i, value: 'Android Development' },
    { regex: /\b(ios|swift|swiftui)\b/i, value: 'iOS Development' },
    { regex: /\b(react\s*native|expo)\b/i, value: 'React Native' },
    { regex: /\b(flutter|dart)\b/i, value: 'Flutter' },
    { regex: /\b(electron|tauri)\b/i, value: 'Desktop Apps' },
    { regex: /\b(web|frontend|browser)\b/i, value: 'Web Frontend' },
    { regex: /\b(backend|server|api)\b/i, value: 'Backend/Server-side' },
    { regex: /\b(cloud|aws|azure|gcp)\b/i, value: 'Cloud Infrastructure' },
    { regex: /\b(devops|ci\/cd|deployment)\b/i, value: 'DevOps' }
  ];
  
  for (const { regex, value } of patterns) {
    if (regex.test(input)) platforms.push(value);
  }
  return platforms.length > 0 ? platforms.join(', ') : null;
}

/**
 * Extract content type preferences
 */
function extractContentPreferences(input) {
  const prefs = [];
  const patterns = [
    { regex: /\b(tutorial|guide|how[\s-]to)\b/i, value: 'step-by-step tutorials' },
    { regex: /\b(troubleshoot|fix|error|debug)\b/i, value: 'troubleshooting guides' },
    { regex: /\b(comparison|vs|versus|compare)\b/i, value: 'comparison articles' },
    { regex: /\b(best\s*practices?|tips)\b/i, value: 'best practices' },
    { regex: /\b(setup|install|config)\b/i, value: 'setup/configuration guides' }
  ];
  
  for (const { regex, value } of patterns) {
    if (regex.test(input)) prefs.push(value);
  }
  return prefs;
}

/**
 * Extract tech stack mentions
 */
function extractTechStack(input) {
  const techs = [];
  const patterns = [
    /\b(react|vue|angular|svelte|next\.?js|nuxt)\b/i,
    /\b(node\.?js|express|fastify|nest\.?js)\b/i,
    /\b(python|django|flask|fastapi)\b/i,
    /\b(java|spring|kotlin)\b/i,
    /\b(typescript|javascript)\b/i,
    /\b(mongodb|postgresql|mysql|redis|firebase)\b/i,
    /\b(docker|kubernetes|k8s)\b/i,
    /\b(graphql|rest\s*api|grpc)\b/i,
    /\b(tailwind|css|sass|styled[\s-]components)\b/i,
    /\b(webpack|vite|esbuild|rollup)\b/i
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) techs.push(match[0]);
  }
  return [...new Set(techs)]; // Remove duplicates
}

/**
 * Format context signals for the prompt
 */
function formatContextSignals(signals) {
  const parts = [];
  
  if (signals.timeContext) parts.push(`• Time Focus: ${signals.timeContext}`);
  if (signals.audienceHints) parts.push(`• Target Audience: ${signals.audienceHints}`);
  if (signals.platformContext) parts.push(`• Platform/Environment: ${signals.platformContext}`);
  if (signals.contentPreferences.length > 0) parts.push(`• Content Type: ${signals.contentPreferences.join(', ')}`);
  if (signals.techStack.length > 0) parts.push(`• Tech Stack Mentioned: ${signals.techStack.join(', ')}`);
  
  return parts.length > 0 ? parts.join('\n') : '• No specific context detected - use general analysis';
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Support multiple input formats: { niche }, { input }, { query }, or { text }
    const userInput = body.niche || body.input || body.query || body.text || '';

    // Build intelligent, context-aware prompt
    const { prompt: intelligentPrompt, metadata } = buildIntelligentPrompt(userInput);

    // Call Gemini with the enhanced prompt
    const responseText = await geminiInstance.sendQuery(intelligentPrompt, TOPIC_SUGGESTION_PROMPT);

    // Parse JSON with improved error handling
    let topics = [];
    try {
      // Try to find JSON array in response
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the entire response as JSON
        const parsed = JSON.parse(responseText);
        topics = Array.isArray(parsed) ? parsed : parsed.topics || [];
      }
      
      // Validate and enrich topics
      topics = topics.map((topic, index) => ({
        id: index + 1,
        topic: topic.topic || topic.title || 'Untitled Topic',
        problem: topic.problem || topic.description || '',
        intent: topic.intent || 'Problem Solving',
        difficulty: topic.difficulty || 'Medium',
        ...topic
      }));
      
    } catch (e) {
      console.error("Failed to parse Gemini response:", responseText);
      return NextResponse.json({ 
        error: 'Failed to parse AI response', 
        raw: responseText,
        hint: 'The AI response was not in the expected JSON format'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      topics,
      metadata: {
        inputProcessed: userInput || 'none',
        mode: metadata.mode,
        topicsCount: topics.length
      }
    });

  } catch (error) {
    console.error('Error in topic suggestion:', error);
    return NextResponse.json({ 
      error: error.message,
      hint: 'Check your input format and try again'
    }, { status: 500 });
  }
}
