import { NextResponse } from 'next/server';
import geminiInstance from '@/lib/gemini';
import { KEYWORD_GENERATION_PROMPT } from '@/lib/prompts';

export async function POST(request) {
  try {
    const { topic, problem } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const prompt = KEYWORD_GENERATION_PROMPT
      .replace('{topic}', topic)
      .replace('{problem}', problem || 'General user difficulty');

    const responseText = await geminiInstance.sendQuery("Generate keywords", prompt);

    let keywords = [];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse Gemini response:", responseText);
      return NextResponse.json({ error: 'Failed to parse AI response', raw: responseText }, { status: 500 });
    }

    return NextResponse.json({ keywords });

  } catch (error) {
    console.error('Error in keyword generation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
