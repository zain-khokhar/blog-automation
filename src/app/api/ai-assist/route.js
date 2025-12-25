import gemini from '@/lib/gemini';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { action, ...params } = await req.json();

    await gemini.initialize();

    let systemPrompt = '';
    let query = '';

    switch (action) {
      case 'generate-alt-text':
        systemPrompt = `You are an SEO expert. Generate a concise, descriptive alt text for an image.
        The alt text should:
        - Be 10-15 words maximum
        - Describe the image content clearly
        - Include relevant keywords naturally
        - Be useful for accessibility
        Return ONLY the alt text, nothing else.`;
        query = `Generate alt text for an image named: "${params.imageName}"`;
        break;

      case 'improve-text':
        systemPrompt = `You are a professional content editor. Improve the given text to make it:
        - More engaging and readable
        - Grammatically correct
        - Clear and concise
        - Professional but natural
        Return ONLY the improved text, nothing else.`;
        query = params.text;
        break;

      case 'summarize':
        systemPrompt = `You are a content summarizer. Create a brief, compelling summary of the text.
        The summary should:
        - Be 2-3 sentences maximum
        - Capture the main points
        - Be engaging and readable
        Return ONLY the summary, nothing else.`;
        query = params.text;
        break;

      case 'change-tone':
        systemPrompt = `You are a professional writer. Rewrite the text in a ${params.tone} tone.
        Maintain the original meaning but adjust the style and language.
        Return ONLY the rewritten text, nothing else.`;
        query = params.text;
        break;

      case 'expand':
        systemPrompt = `You are a content writer. Expand this text with more details and examples.
        Add approximately ${params.targetWords || 200} more words.
        Keep the same tone and style.
        Return ONLY the expanded text, nothing else.`;
        query = params.text;
        break;

      case 'shorten':
        systemPrompt = `You are an editor. Make this text more concise while keeping the key points.
        Reduce it by approximately ${params.reductionPercent || 50}%.
        Return ONLY the shortened text, nothing else.`;
        query = params.text;
        break;

      case 'grammar-check':
        systemPrompt = `You are a grammar expert. Fix all grammar, spelling, and punctuation errors.
        Improve clarity and readability.
        Return ONLY the corrected text, nothing else.`;
        query = params.text;
        break;

      case 'generate-meta':
        systemPrompt = `You are an SEO expert. Based on this content, generate:
        1. An SEO-optimized meta title (50-60 characters)
        2. An SEO-optimized meta description (150-160 characters)
        
        Return as JSON:
        {
          "metaTitle": "...",
          "metaDescription": "..."
        }`;
        query = `Content: ${params.content.substring(0, 1000)}...`;
        break;

      case 'categorize':
        systemPrompt = `You are a content categorization expert. Based on this content, suggest:
        1. 2-3 relevant categories
        2. 5-8 relevant tags
        
        Return as JSON:
        {
          "categories": ["category1", "category2"],
          "tags": ["tag1", "tag2", "tag3"]
        }`;
        query = `Content: ${params.content.substring(0, 1000)}...`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

    const response = await gemini.sendQuery(query, systemPrompt);

    // Try to parse as JSON if expecting structured data
    if (['generate-meta', 'categorize'].includes(action)) {
      try {
        const cleanedResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedResponse);
        return NextResponse.json({ success: true, data: parsed });
      } catch (e) {
        // If JSON parsing fails, return raw response
        console.error('JSON parse error:', e);
      }
    }

    // For alt text generation
    if (action === 'generate-alt-text') {
      return NextResponse.json({ success: true, altText: response.trim() });
    }

    // For text transformations
    return NextResponse.json({ success: true, result: response });

  } catch (error) {
    console.error('AI Assist API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
