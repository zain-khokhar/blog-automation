import gemini from '@/lib/gemini';
import { NextResponse } from 'next/server';

/**
 * This API generates a SINGLE hero image using Gemini's image generation (Nano Banana).
 * It creates a super-prompt for image generation, sends it to Gemini,
 * downloads the generated image, and saves it locally.
 */

export async function POST(req) {
  try {
    const { blogContent, topic } = await req.json();

    if (!blogContent) {
      return NextResponse.json({ error: 'Blog content is required' }, { status: 400 });
    }

    console.log('🎨 Starting Gemini image generation for topic:', topic);

    try {
      await gemini.initialize();

      // Step 1: Generate a super-prompt for the hero image
      const superPromptRequest = `You are a professional AI image prompt engineer. Create a SINGLE powerful image generation prompt for a blog hero image.

=== BLOG TOPIC ===
${topic}

=== BLOG CONTENT SUMMARY ===
${blogContent.replace(/<[^>]*>/g, ' ').substring(0, 1500)}

=== YOUR TASK ===
Create ONE detailed, vivid image generation prompt that will produce a stunning hero image for this blog post.

=== PROMPT REQUIREMENTS ===
- Be extremely specific and detailed (100-150 words)
- Describe the scene, lighting, colors, mood, and style
- Use professional photography/art terminology
- Make it visually striking and relevant to the blog topic
- Include style keywords like: cinematic, high-resolution, professional, detailed, vibrant
- Avoid text/words in the image
- Focus on visual metaphors that represent the topic

=== OUTPUT FORMAT ===
Return ONLY the image generation prompt text. No explanations, no JSON, no markdown. Just the prompt itself.

Example output format:
A stunning cinematic photograph of [subject] with [details], featuring [lighting], [colors], [mood]. The scene shows [composition]. Style: [artistic style]. High resolution, professional quality, 8K detail.`;

      console.log('📝 Generating super-prompt for hero image...');
      const superPrompt = await gemini.sendQuery(
        `Create an image generation prompt for: ${topic}`,
        superPromptRequest,
        2000
      );

      console.log('✅ Super-prompt generated:', superPrompt.substring(0, 100) + '...');

      // Step 2: Generate the actual image using Gemini
      // Prepend "Generate an image:" to trigger Gemini's image generation
      const imageGenerationPrompt = `Generate an image: ${superPrompt}`;
      
      console.log('🖼️ Sending image generation request to Gemini...');
      const imageResult = await gemini.generateImage(imageGenerationPrompt, topic);

      if (!imageResult.success) {
        throw new Error('Image generation failed');
      }

      console.log('✅ Image generated successfully:', imageResult.url);

      // Return the single hero image
      return NextResponse.json({
        success: true,
        images: [{
          id: `img-${Date.now()}`,
          url: imageResult.url,
          alt: imageResult.alt || `Hero image for ${topic}`,
          caption: imageResult.caption || `AI-generated illustration for ${topic}`,
          type: 'hero',
          placement: 'After title',
          purpose: 'Hero engagement'
        }],
        topic: topic,
      });

    } catch (geminiError) {
      console.error('❌ Gemini image generation failed:', geminiError.message);
      return NextResponse.json({ 
        error: `Image generation failed: ${geminiError.message}`,
        success: false 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Image Generation API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
