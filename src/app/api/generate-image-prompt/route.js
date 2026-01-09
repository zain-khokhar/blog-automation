import gemini from '@/lib/gemini';
import { NextResponse } from 'next/server';

/**
 * This API generates a detailed image prompt for the user to use with any AI image generator.
 * It does NOT generate the image itself - just provides the prompt.
 */

export async function POST(req) {
  try {
    const { blogContent, topic } = await req.json();

    if (!blogContent || !topic) {
      return NextResponse.json({ error: 'Blog content and topic are required' }, { status: 400 });
    }

    console.log('📝 Generating image prompt for topic:', topic);

    try {
      await gemini.initialize();

      // Generate a professional, detailed image prompt
      const promptRequest = `You are a professional AI image prompt engineer specializing in blog hero images. Your task is to create ONE powerful, detailed image generation prompt.

=== BLOG TOPIC ===
${topic}

=== BLOG CONTENT SUMMARY ===
${blogContent.replace(/<[^>]*>/g, ' ').substring(0, 2000)}

=== YOUR TASK ===
Create a SINGLE detailed, professional image generation prompt for a hero image that will appear at the top of this blog post.

=== PROMPT REQUIREMENTS ===
1. **Length**: 150-200 words - be extremely detailed
2. **Subject**: Clearly describe the main subject/scene that represents the blog topic
3. **Composition**: Describe the layout, perspective, and framing
4. **Lighting**: Specify the lighting style (golden hour, studio lighting, dramatic shadows, soft diffused, etc.)
5. **Colors**: Define the color palette and mood (warm tones, cool blues, vibrant, muted, etc.)
6. **Style**: Specify the artistic style (photorealistic, 3D render, digital illustration, cinematic, etc.)
7. **Details**: Include specific visual elements, textures, and atmospheric details
8. **Quality Keywords**: Include: 8K, ultra-detailed, professional, high-resolution, masterpiece
9. **NO TEXT**: Explicitly state "no text, no words, no letters" to avoid text in the image
10. **Aspect Ratio**: Mention "16:9 landscape orientation" for blog hero format

=== OUTPUT FORMAT ===
Return ONLY the image generation prompt itself. No explanations, no titles, no markdown formatting, no quotes around it. Just the raw prompt text that can be copied directly into an AI image generator.

=== EXAMPLE OUTPUT ===
A stunning cinematic 3D render of a modern developer workspace floating in an abstract digital space, featuring a sleek curved monitor displaying clean code with syntax highlighting in vibrant blues and purples. The scene is illuminated by soft ambient lighting with subtle neon accents reflecting off a polished desk surface. Geometric data visualization elements and glowing network nodes orbit gracefully in the background, representing cloud connectivity. The composition uses a dramatic low angle with shallow depth of field, creating a sense of technological sophistication. Color palette emphasizes deep navy blues, electric cyan, and warm amber highlights. Ultra-detailed, 8K resolution, professional quality, photorealistic materials with subtle reflections. Style: modern tech aesthetic with clean minimalist design. No text, no words, no letters, no UI elements. 16:9 landscape orientation, perfect for blog hero image.`;

      const imagePrompt = await gemini.sendQuery(
        `Create a professional image prompt for: ${topic}`,
        promptRequest,
        2500
      );

      // Clean up the prompt (remove any accidental quotes or markdown)
      let cleanedPrompt = imagePrompt
        .replace(/^["'`]+|["'`]+$/g, '') // Remove surrounding quotes
        .replace(/^#+\s*/gm, '') // Remove markdown headers
        .replace(/\*\*/g, '') // Remove bold markers
        .trim();

      console.log('✅ Image prompt generated successfully');

      return NextResponse.json({
        success: true,
        prompt: cleanedPrompt,
        topic: topic,
        usage: 'Copy this prompt and paste it into any AI image generator like Gemini, DALL-E, Midjourney, or Stable Diffusion.',
      });

    } catch (geminiError) {
      console.error('❌ Prompt generation failed:', geminiError.message);
      return NextResponse.json({ 
        error: `Prompt generation failed: ${geminiError.message}`,
        success: false 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Image Prompt API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
