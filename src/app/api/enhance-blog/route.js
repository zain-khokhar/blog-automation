import gemini from '@/lib/gemini';
import { NextResponse } from 'next/server';

/**
 * Blog Enhancement Agent API
 * This agent analyzes blog content and provides structured enhancement commands
 * for links, images, videos, formatting, and engagement elements.
 */

export async function POST(req) {
  try {
    const { blogContent, topic, enhancementType = 'full' } = await req.json();

    if (!blogContent) {
      return NextResponse.json({ error: 'Blog content is required' }, { status: 400 });
    }

    await gemini.initialize();

    // Different enhancement strategies based on type
    const enhancementPrompts = {
      full: getFullEnhancementPrompt(topic, blogContent),
      links: getLinkEnhancementPrompt(topic, blogContent),
      formatting: getFormattingEnhancementPrompt(topic, blogContent),
      engagement: getEngagementEnhancementPrompt(topic, blogContent),
    };

    const selectedPrompt = enhancementPrompts[enhancementType] || enhancementPrompts.full;

    console.log(`🔧 Running ${enhancementType} enhancement analysis...`);
    const rawResponse = await gemini.sendQuery(
      `Enhance this blog about: ${topic}`,
      selectedPrompt,
      3000
    );

    // Parse the response
    let enhancements = {};
    try {
      const cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      enhancements = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error('Failed to parse enhancements:', e);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse enhancement suggestions',
        rawResponse: rawResponse.substring(0, 500),
      }, { status: 500 });
    }

    console.log(`✅ Enhancement analysis complete`);

    return NextResponse.json({
      success: true,
      enhancements,
      type: enhancementType,
    });

  } catch (error) {
    console.error('Enhancement Agent API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Full enhancement prompt - covers all aspects
function getFullEnhancementPrompt(topic, blogContent) {
  return `You are an expert blog enhancement agent. Analyze this blog and provide structured enhancement commands.

=== BLOG TOPIC ===
${topic}

=== BLOG CONTENT ===
${blogContent.replace(/<[^>]*>/g, ' ').substring(0, 3000)}

=== YOUR TASK ===
Analyze the blog and provide enhancement suggestions in these categories:

1. **IMAGES**: Strategic image placements (3-5 images)
   - Where to place (after which section/paragraph)
   - What type of image (hero, diagram, infographic, screenshot, illustration)
   - Image description/prompt
   - Alt text and caption

2. **LINKS**: Internal linking opportunities and external authority links
   - Anchor text to use
   - What to link to (topic/resource type)
   - Link purpose (reference, deep-dive, tool, example)

3. **VIDEOS**: Video embed suggestions (0-2)
   - Where to embed
   - What topic the video should cover
   - Suggested video type (tutorial, explainer, demo)

4. **CALLOUTS**: Highlight boxes, tips, warnings, or quotes
   - Type (tip, warning, note, quote, key-takeaway)
   - Content to highlight
   - Where to place

5. **FORMATTING**: Text formatting improvements
   - Sections that need bullet points
   - Text to bold for emphasis
   - Code blocks needed
   - Table opportunities

6. **ENGAGEMENT**: Interactive elements
   - Poll question suggestions
   - FAQ additions
   - Call-to-action improvements

=== OUTPUT FORMAT (JSON ONLY) ===
{
  "images": [
    {
      "placement": "after_title | after_section:<section_name> | before_conclusion",
      "type": "hero | diagram | infographic | screenshot | illustration | photo",
      "prompt": "Detailed image description for generation",
      "alt": "SEO-friendly alt text",
      "caption": "Engaging caption"
    }
  ],
  "links": [
    {
      "anchorText": "text to make into link",
      "linkType": "internal | external",
      "targetTopic": "what the link should point to",
      "purpose": "reference | tool | deep-dive | example"
    }
  ],
  "videos": [
    {
      "placement": "after_section:<section_name>",
      "topic": "What the video should explain",
      "type": "tutorial | explainer | demo",
      "searchQuery": "YouTube search query to find relevant video"
    }
  ],
  "callouts": [
    {
      "type": "tip | warning | note | quote | key-takeaway",
      "content": "The content for the callout box",
      "placement": "after_section:<section_name>"
    }
  ],
  "formatting": {
    "bulletPoints": ["section names that would benefit from bullet lists"],
    "boldEmphasis": ["key phrases to bold"],
    "codeBlocks": ["code snippets that need formatting"],
    "tables": [
      {
        "purpose": "comparison | data | reference",
        "headers": ["Column 1", "Column 2"],
        "placement": "after_section:<section_name>"
      }
    ]
  },
  "engagement": {
    "poll": {
      "question": "Poll question for readers",
      "options": ["Option 1", "Option 2", "Option 3"]
    },
    "additionalFaqs": [
      {
        "question": "Additional FAQ question",
        "answer": "Detailed answer"
      }
    ],
    "cta": {
      "text": "Call-to-action button text",
      "placement": "end | after_section:<section_name>"
    }
  },
  "summary": "Brief summary of all recommended enhancements"
}

Return ONLY valid JSON. Be strategic - don't over-enhance. Quality over quantity.`;
}

// Link-focused enhancement
function getLinkEnhancementPrompt(topic, blogContent) {
  return `You are an SEO and content linking expert. Analyze this blog and suggest strategic links.

=== BLOG TOPIC ===
${topic}

=== BLOG CONTENT ===
${blogContent.replace(/<[^>]*>/g, ' ').substring(0, 3000)}

=== YOUR TASK ===
Identify 5-8 opportunities to add valuable links:

1. **Internal Links**: Topics that could link to other blog posts
2. **External Authority Links**: Resources, tools, or documentation to reference
3. **Tool Links**: Relevant tools, software, or services mentioned
4. **Tutorial Links**: Step-by-step guides that could be referenced

=== OUTPUT FORMAT (JSON ONLY) ===
{
  "links": [
    {
      "anchorText": "exact text to make clickable",
      "context": "the sentence containing this anchor text",
      "linkType": "internal | external | tool | documentation",
      "suggestedUrl": "example.com or description of target",
      "purpose": "Why this link adds value",
      "priority": "high | medium | low"
    }
  ],
  "summary": "Overview of linking strategy"
}`;
}

// Formatting-focused enhancement
function getFormattingEnhancementPrompt(topic, blogContent) {
  return `You are a content formatting expert. Analyze this blog and suggest formatting improvements.

=== BLOG TOPIC ===
${topic}

=== BLOG CONTENT ===
${blogContent.replace(/<[^>]*>/g, ' ').substring(0, 3000)}

=== YOUR TASK ===
Identify formatting improvements for better readability:

1. Sections that should become bullet/numbered lists
2. Key phrases that need bold emphasis
3. Code that needs proper code block formatting
4. Data that should be in tables
5. Quotes that should be styled as blockquotes
6. Section heading improvements

=== OUTPUT FORMAT (JSON ONLY) ===
{
  "formatting": {
    "convertToLists": [
      {
        "originalText": "The text that should be a list",
        "listType": "bullet | numbered",
        "items": ["Item 1", "Item 2", "Item 3"]
      }
    ],
    "boldEmphasis": [
      {
        "phrase": "text to bold",
        "reason": "why this is important"
      }
    ],
    "codeBlocks": [
      {
        "code": "the code content",
        "language": "javascript | python | bash | etc"
      }
    ],
    "tables": [
      {
        "purpose": "what the table shows",
        "headers": ["Col1", "Col2"],
        "rows": [["Data1", "Data2"]]
      }
    ],
    "blockquotes": [
      {
        "quote": "text to quote",
        "attribution": "source if any"
      }
    ],
    "headingImprovements": [
      {
        "original": "current heading",
        "improved": "better heading",
        "level": "h2 | h3"
      }
    ]
  },
  "summary": "Overview of formatting improvements"
}`;
}

// Engagement-focused enhancement
function getEngagementEnhancementPrompt(topic, blogContent) {
  return `You are a content engagement expert. Analyze this blog and suggest engagement improvements.

=== BLOG TOPIC ===
${topic}

=== BLOG CONTENT ===
${blogContent.replace(/<[^>]*>/g, ' ').substring(0, 3000)}

=== YOUR TASK ===
Suggest engagement elements to increase reader interaction:

1. Poll questions relevant to the content
2. Additional FAQ questions readers might have
3. Interactive callouts (tips, warnings, key takeaways)
4. Call-to-action improvements
5. Social sharing hooks
6. Reader engagement questions

=== OUTPUT FORMAT (JSON ONLY) ===
{
  "engagement": {
    "polls": [
      {
        "question": "Engaging poll question",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "placement": "after_section:<section_name>"
      }
    ],
    "faqs": [
      {
        "question": "Question readers might have",
        "answer": "Helpful, detailed answer"
      }
    ],
    "callouts": [
      {
        "type": "tip | warning | note | pro-tip | key-takeaway",
        "title": "Callout title",
        "content": "Callout content",
        "placement": "after_section:<section_name>"
      }
    ],
    "ctas": [
      {
        "text": "CTA button/link text",
        "purpose": "What action to take",
        "placement": "end | inline"
      }
    ],
    "engagementQuestions": [
      {
        "question": "Question to ask readers",
        "placement": "end_of_section:<section_name>"
      }
    ]
  },
  "summary": "Overview of engagement improvements"
}`;
}
