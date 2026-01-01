import { NextResponse } from 'next/server';
import geminiInstance from '@/lib/gemini';
import { SEO_SCORING_PROMPT } from '@/lib/prompts';

export async function POST(request) {
  try {
    const { content, keywords } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const keywordString = Array.isArray(keywords) ? keywords.join(', ') : keywords;
    
    // We send the content as the "user message" and the prompt as system prompt
    // But since the content might be huge, we might need to be careful.
    // The gemini.js sendQuery takes (text, systemPrompt).
    
    const input = `
    **Target Keywords:** ${keywordString}
    
    **Blog Content:**
    ${content}
    `;

    const responseText = await geminiInstance.sendQuery(input, SEO_SCORING_PROMPT);

    let analysis = {};
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse Gemini response:", responseText);
      return NextResponse.json({ error: 'Failed to parse AI response', raw: responseText }, { status: 500 });
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Error in SEO analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
