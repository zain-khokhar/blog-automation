import { NextResponse } from 'next/server';
import geminiInstance from '@/lib/gemini';
import { TOPIC_SUGGESTION_PROMPT } from '@/lib/prompts';

export async function POST(request) {
  try {
    const { niche } = await request.json();

    // If no niche is provided, we'll ask for general tech topics
    const promptInput = niche 
      ? `Please suggest blog topics for the niche: "${niche}". Focus on solving specific user problems.`
      : `Please suggest blog topics for general high-difficulty technical problems that users are currently facing.`;

    // Call Gemini
    const responseText = await geminiInstance.sendQuery(promptInput, TOPIC_SUGGESTION_PROMPT);

    // Parse JSON
    let topics = [];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse Gemini response:", responseText);
      return NextResponse.json({ error: 'Failed to parse AI response', raw: responseText }, { status: 500 });
    }

    return NextResponse.json({ topics });

  } catch (error) {
    console.error('Error in topic suggestion:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
