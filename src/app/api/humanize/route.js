import { NextResponse } from 'next/server';

/**
 * This API humanizes blog content by removing AI-style patterns and artifacts.
 * It cleans up text to make it look more naturally written.
 */

// Common AI patterns to remove or replace
const AI_PATTERNS = [
  // Separator lines
  { pattern: /_{3,}/g, replacement: '' }, // ___ underscores
  { pattern: /-{3,}/g, replacement: '' }, // --- dashes
  { pattern: /\*{3,}/g, replacement: '' }, // *** asterisks
  { pattern: /={3,}/g, replacement: '' }, // === equals
  { pattern: /~{3,}/g, replacement: '' }, // ~~~ tildes
  { pattern: /#{3,}\s*$/gm, replacement: '' }, // ### at end of lines
  
  // Decorative patterns
  { pattern: /\s*[─━═┄┅┈┉]+\s*/g, replacement: ' ' }, // Unicode dashes
  { pattern: /\s*[│┃┆┇┊┋]+\s*/g, replacement: ' ' }, // Unicode vertical lines
  { pattern: /[★☆✦✧✪✫✬✭✮✯✰⭐🌟💫✨]+/g, replacement: '' }, // Star decorations
  { pattern: /[→←↑↓⟶⟵⟹⟸➜➤➔►▶◀◄➡⬅⬆⬇]+/g, replacement: '' }, // Arrows
  { pattern: /[■□▪▫▲△▼▽◆◇○●◎◉]+/g, replacement: '' }, // Shape decorations
  
  // Emoji overuse (keep some, remove excessive)
  { pattern: /([\u{1F300}-\u{1F9FF}]){3,}/gu, replacement: '' }, // 3+ emojis in a row
  
  // AI phrase patterns
  { pattern: /\bIn this (article|blog post|guide|tutorial),?\s*(we will|you will|I will|we'll|you'll|I'll)/gi, replacement: "Let's" },
  { pattern: /\bWithout further ado,?\s*/gi, replacement: '' },
  { pattern: /\bLet's dive (right )?in!?\s*/gi, replacement: '' },
  { pattern: /\bIn today's (digital|modern|fast-paced) (world|age|landscape),?\s*/gi, replacement: '' },
  { pattern: /\bAs we all know,?\s*/gi, replacement: '' },
  { pattern: /\bIt goes without saying (that)?\s*/gi, replacement: '' },
  { pattern: /\bNeedless to say,?\s*/gi, replacement: '' },
  { pattern: /\bAt the end of the day,?\s*/gi, replacement: 'Ultimately, ' },
  { pattern: /\bIn conclusion,?\s*/gi, replacement: 'To wrap up, ' },
  { pattern: /\bTo summarize,?\s*/gi, replacement: 'In short, ' },
  { pattern: /\bMoving forward,?\s*/gi, replacement: '' },
  { pattern: /\bWith that being said,?\s*/gi, replacement: '' },
  { pattern: /\bHaving said that,?\s*/gi, replacement: '' },
  { pattern: /\bIt's worth noting (that)?\s*/gi, replacement: '' },
  { pattern: /\bIt's important to (note|mention|remember) (that)?\s*/gi, replacement: '' },
  { pattern: /\bAs (mentioned|stated|discussed) (earlier|above|previously),?\s*/gi, replacement: '' },
  { pattern: /\bFirst and foremost,?\s*/gi, replacement: 'First, ' },
  { pattern: /\bLast but not least,?\s*/gi, replacement: 'Finally, ' },
  { pattern: /\bIn a nutshell,?\s*/gi, replacement: '' },
  { pattern: /\bLong story short,?\s*/gi, replacement: '' },
  { pattern: /\bThe bottom line is (that)?\s*/gi, replacement: '' },
  { pattern: /\bAll in all,?\s*/gi, replacement: '' },
  { pattern: /\bBy and large,?\s*/gi, replacement: '' },
  { pattern: /\bFor what it's worth,?\s*/gi, replacement: '' },
  { pattern: /\bThat being said,?\s*/gi, replacement: '' },
  
  // Excessive enthusiasm
  { pattern: /!{2,}/g, replacement: '!' }, // Multiple exclamation marks
  { pattern: /\?{2,}/g, replacement: '?' }, // Multiple question marks
  
  // Empty lines and spacing issues
  { pattern: /\n{4,}/g, replacement: '\n\n\n' }, // More than 3 newlines
  { pattern: /(<br\s*\/?>\s*){3,}/gi, replacement: '<br><br>' }, // Multiple br tags
  { pattern: /<p>\s*<\/p>/gi, replacement: '' }, // Empty paragraphs
  { pattern: /<p>\s*&nbsp;\s*<\/p>/gi, replacement: '' }, // Paragraphs with only nbsp
  
  // AI-style bullet points
  { pattern: /^[\s]*[✓✔☑️✅]\s*/gm, replacement: '• ' }, // Checkmark bullets
  { pattern: /^[\s]*[⚡🔥💡🎯📌📍🔑]\s*/gm, replacement: '• ' }, // Emoji bullets
  
  // Over-structured patterns
  { pattern: /^(Step|Tip|Note|Pro Tip|Quick Tip|Hot Tip|Key Point|Important|Warning|Caution)\s*#?\d*\s*[:：]\s*/gim, replacement: '' },
  
  // Cleanup orphaned punctuation
  { pattern: /^\s*[,.:;]\s*/gm, replacement: '' }, // Lines starting with punctuation
  { pattern: /\s+([,.:;!?])/g, replacement: '$1' }, // Space before punctuation
];

// HTML-specific cleanup
const HTML_PATTERNS = [
  // Empty elements
  { pattern: /<(strong|em|b|i|u|span)>\s*<\/\1>/gi, replacement: '' },
  // Nested empty elements
  { pattern: /<(p|div|section)>\s*(<br\s*\/?>)?\s*<\/\1>/gi, replacement: '' },
  // Decorative HR alternatives
  { pattern: /<p[^>]*>\s*[-_=*~]{3,}\s*<\/p>/gi, replacement: '' },
  { pattern: /<div[^>]*>\s*[-_=*~]{3,}\s*<\/div>/gi, replacement: '' },
];

function humanizeContent(content) {
  let result = content;
  
  // Apply all text patterns
  for (const { pattern, replacement } of AI_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  
  // Apply HTML-specific patterns
  for (const { pattern, replacement } of HTML_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  
  // Final cleanup - fix any double spaces
  result = result.replace(/  +/g, ' ');
  
  // Fix sentences that now start without capital
  result = result.replace(/([.!?]\s+)([a-z])/g, (match, punctuation, letter) => {
    return punctuation + letter.toUpperCase();
  });
  
  // Clean up lines that became empty after removing patterns
  result = result.replace(/^\s+$/gm, '');
  
  return result.trim();
}

export async function POST(req) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    console.log('🧹 Humanizing blog content...');
    
    const originalLength = content.length;
    const humanizedContent = humanizeContent(content);
    const newLength = humanizedContent.length;
    const removedChars = originalLength - newLength;
    
    console.log(`✅ Humanization complete. Removed ${removedChars} characters of AI artifacts.`);

    return NextResponse.json({
      success: true,
      content: humanizedContent,
      stats: {
        originalLength,
        newLength,
        removedCharacters: removedChars,
        reductionPercent: ((removedChars / originalLength) * 100).toFixed(1)
      }
    });

  } catch (error) {
    console.error('Humanize API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
