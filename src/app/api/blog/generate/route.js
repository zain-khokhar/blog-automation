import { NextResponse } from 'next/server';
import geminiInstance from '@/lib/gemini';
import { BLOG_WRITING_PROMPT } from '@/lib/prompts';

export async function POST(request) {
  try {
    const { topic, keywords } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const keywordString = Array.isArray(keywords) ? keywords.join(', ') : keywords;

    const prompt = BLOG_WRITING_PROMPT
      .replace('{topic}', topic)
      .replace('{keywords}', keywordString);

    const content = await geminiInstance.sendQuery("Write the blog post", prompt);

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Error in blog generation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
