import gemini from '@/lib/gemini';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { topic, wordCount, tone } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Humanizing Prompt approach
    const systemPrompt = `You are a professional blog writer. 
    Write a high-quality, human-like blog post about: "${topic}".
    
    Configuration:
    - Word Count: Approximately ${wordCount} words.
    - Tone: ${tone}.
    - Format: HTML (Use <h1> for title, <h2> for sections, <p> for paragraphs, <ul> for lists).
    
    Instructions:
    - Write in a natural, engaging flow.
    - Avoid robotic transitions like "In conclusion" or "Furthermore".
    - Focus on value and reader engagement.
    - Return ONLY the HTML content. Do not include markdown code blocks.`;

    await gemini.initialize();

    console.log(`Generating blog for: ${topic}`);
    const rawResponse = await gemini.sendQuery(`Write blog post: ${topic}`, systemPrompt, 2000); // Increased DOM delay for long content

    // Clean response
    let cleanedResponse = rawResponse.replace(/```html/g, '').replace(/```/g, '').trim();

    return NextResponse.json({ content: cleanedResponse });
  } catch (error) {
    console.error('Generation API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
