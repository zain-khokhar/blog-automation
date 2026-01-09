import gemini from '@/lib/gemini';
import { NextResponse } from 'next/server';

// Calculate section requirements based on word count
function getSectionRequirements(wordCount) {
  const count = parseInt(wordCount);
  if (count >= 2500) {
    return {
      minSections: 8,
      maxSections: 12,
      wordsPerSection: 250,
      subSectionsPerSection: 2,
      minParagraphsPerSection: 3,
      faqCount: 6,
      examplesRequired: 4,
      caseStudies: 2,
    };
  } else if (count >= 1500) {
    return {
      minSections: 5,
      maxSections: 7,
      wordsPerSection: 200,
      subSectionsPerSection: 1,
      minParagraphsPerSection: 2,
      faqCount: 4,
      examplesRequired: 2,
      caseStudies: 1,
    };
  } else {
    return {
      minSections: 4,
      maxSections: 5,
      wordsPerSection: 150,
      subSectionsPerSection: 0,
      minParagraphsPerSection: 2,
      faqCount: 3,
      examplesRequired: 1,
      caseStudies: 0,
    };
  }
}

export async function POST(req) {
  try {
    const { topic, wordCount, tone } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const targetWordCount = parseInt(wordCount) || 1500;
    const sections = getSectionRequirements(targetWordCount);

    // Advanced engagement-focused prompt with strict word count enforcement
    const systemPrompt = `You are an elite content strategist and master storyteller who writes blogs that readers can't stop reading. Your writing creates an irresistible pull that makes readers devour every word.

=== TOPIC ===
"${topic}"

=== STRICT WORD COUNT REQUIREMENT ===
**CRITICAL: This blog MUST be EXACTLY ${targetWordCount} words minimum. NOT approximately. NOT around. EXACTLY ${targetWordCount}+ words.**

To achieve ${targetWordCount} words, you MUST include:
- ${sections.minSections} to ${sections.maxSections} major H2 sections (each section ~${sections.wordsPerSection} words)
- ${sections.subSectionsPerSection > 0 ? `${sections.subSectionsPerSection} H3 sub-sections under each H2` : 'Detailed paragraphs in each section'}
- ${sections.minParagraphsPerSection}+ detailed paragraphs per section (each paragraph 50-80 words)
- ${sections.examplesRequired} real-world examples with detailed explanations
${sections.caseStudies > 0 ? `- ${sections.caseStudies} mini case studies or scenarios` : ''}
- ${sections.faqCount} comprehensive FAQ questions with detailed answers
- A detailed introduction (150+ words)
- A detailed conclusion with actionable takeaways (150+ words)

=== ENGAGEMENT TECHNIQUES (MANDATORY) ===

**1. Hook Mastery (Opening)**
- Start with a provocative question, shocking statistic, or relatable pain point
- Create immediate curiosity that DEMANDS the reader continues
- Example: "What if I told you that 90% of developers make this one mistake..."

**2. Pattern Interrupts (Every 2-3 paragraphs)**
- Insert unexpected statements, questions, or micro-stories
- Use "But here's the thing..." or "Now, this is where it gets interesting..."
- Create "wait, what?" moments that re-engage wandering attention

**3. Open Loops (Throughout)**
- Tease upcoming content: "We'll reveal the exact solution in a moment, but first..."
- Create anticipation: "The third technique is the one most people overlook..."
- Make readers NEED to continue reading

**4. Conversational Magnetism**
- Write like you're talking to a smart friend over coffee
- Use "you" and "your" frequently - make it personal
- Include rhetorical questions: "Sound familiar?" "Ever wondered why?"
- Use contractions (don't, won't, can't) - sounds more human

**5. Emotional Anchoring**
- Connect concepts to feelings: frustration, relief, excitement, curiosity
- Use sensory language: "Imagine the relief when..."
- Share relatable struggles before solutions

**6. Momentum Building**
- Short punchy sentences for impact. Like this. They work.
- Vary sentence length - rhythm keeps readers engaged
- Use power transitions: "Here's the game-changer..." "This changes everything..."

**7. Value Stacking**
- Each section must deliver a clear, actionable insight
- Use the "What → Why → How" framework
- Include specific numbers, steps, or frameworks

**8. Cliffhanger Sections**
- End each H2 section with a hook for the next section
- "But this is only half the equation. What comes next is crucial..."

=== TONE ===
${tone}

=== STRUCTURE (HTML Format) ===
<h1>[Compelling, Curiosity-Inducing Title - Promise a Transformation]</h1>

<!-- IMAGE_PLACEHOLDER: hero image representing the main topic -->

<p><strong>[Hook paragraph - Create immediate emotional connection and curiosity. ~80 words]</strong></p>

<p>[Problem amplification - Show you understand their pain. End with a promise. ~80 words]</p>

<p>[Credibility + roadmap - Why trust this guide? What will they learn? ~80 words]</p>

<h2>[Section 1: Start with WHY this matters - Use power words]</h2>
<p>[Deep exploration with examples, ~${sections.wordsPerSection} words total for section]</p>
${sections.subSectionsPerSection > 0 ? '<h3>[Sub-section with specific details]</h3>\n<p>[Detailed content with examples]</p>' : ''}
<p>[Pattern interrupt or hook for next section]</p>

<!-- IMAGE_PLACEHOLDER: diagram or illustration explaining core concept -->

<h2>[Section 2: The Core Concept/Method]</h2>
[Continue pattern - detailed content with engagement techniques...]

[Continue for ${sections.minSections}-${sections.maxSections} H2 sections...]

<!-- IMAGE_PLACEHOLDER: infographic summarizing key points before FAQ -->

<h2>Frequently Asked Questions</h2>
[${sections.faqCount} detailed Q&A - each answer 80-120 words]

<h2>Conclusion: Your Next Steps</h2>
<p>[Summarize key insights with emotional callback to opening hook]</p>
<p>[Clear call-to-action - What should they do RIGHT NOW?]</p>

=== CRITICAL REMINDERS ===
1. **WORD COUNT IS NON-NEGOTIABLE**: Count your words. Must be ${targetWordCount}+ words.
2. **NO FLUFF**: Every sentence must add value or create engagement
3. **NO ROBOTIC PHRASES**: Never use "In conclusion", "Furthermore", "Additionally", "It's important to note"
4. **HTML ONLY**: Return pure HTML. No markdown code blocks.
5. **READABILITY**: Use bullet points, bold key phrases, short paragraphs
6. **BE SPECIFIC**: Use real numbers, specific examples, concrete steps

Write the complete blog post NOW. Remember: ${targetWordCount}+ words minimum, highly engaging, impossible to stop reading.`;

    await gemini.initialize();

    console.log(`Generating ${targetWordCount}-word blog for: ${topic}`);
    
    // Increase DOM delay for longer content to ensure full response is captured
    const domDelay = targetWordCount >= 2500 ? 4000 : targetWordCount >= 1500 ? 3000 : 2000;
    
    const rawResponse = await gemini.sendQuery(
      `Write a comprehensive ${targetWordCount}-word blog post about: ${topic}. The blog must be engaging and exactly ${targetWordCount}+ words.`, 
      systemPrompt, 
      domDelay
    );

    // Clean response
    let cleanedResponse = rawResponse.replace(/```html/g, '').replace(/```/g, '').trim();

    // Basic word count validation (approximate, as HTML tags are included)
    const textContent = cleanedResponse.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const actualWordCount = textContent.split(' ').length;
    
    console.log(`Generated blog with approximately ${actualWordCount} words (target: ${targetWordCount})`);

    return NextResponse.json({ 
      content: cleanedResponse,
      wordCount: actualWordCount,
      targetWordCount: targetWordCount
    });
  } catch (error) {
    console.error('Generation API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
