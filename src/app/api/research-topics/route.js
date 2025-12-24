import gemini from '@/lib/gemini';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { niche } = await req.json();

    if (!niche) {
      return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
    }

    const systemPrompt = `You are a professional blog strategist. 
    Find 5 trending and high-demand blog topics for the niche: "${niche}".
    Return ONLY a raw JSON array of strings. 
    Example: ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
    Do not wrap in markdown code blocks.`;

    // Ensure browser is initialized
    await gemini.initialize();

    console.log(`Fetching topics for niche: ${niche}`);
    const rawResponse = await gemini.sendQuery(`Generate topics for ${niche}`, systemPrompt);
    
    // Clean response just in case
    let cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let topics;
    try {
        topics = JSON.parse(cleanedResponse);
    } catch(e) {
        console.error("Failed to parse JSON", cleanedResponse);
        return NextResponse.json({ error: 'Failed to parse AI response', raw: cleanedResponse }, { status: 500 });
    }

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
