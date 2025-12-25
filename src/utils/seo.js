import { flesch } from 'flesch';

/**
 * Calculate SEO score based on multiple factors
 */
export function calculateSEOScore(content, metadata) {
  let score = 0;
  const maxScore = 100;
  
  const { focusKeyword, metaTitle, metaDescription, htmlContent } = metadata;
  const textContent = htmlContent || '';
  const lowerContent = textContent.toLowerCase();
  
  // 1. Focus Keyword Usage (20 points)
  if (focusKeyword) {
    const keywordLower = focusKeyword.toLowerCase();
    const keywordCount = (lowerContent.match(new RegExp(keywordLower, 'g')) || []).length;
    const wordCount = textContent.split(/\s+/).length;
    const keywordDensity = (keywordCount / wordCount) * 100;
    
    // Optimal: 1-2% density
    if (keywordDensity >= 1 && keywordDensity <= 2) {
      score += 20;
    } else if (keywordDensity > 0.5 && keywordDensity < 3) {
      score += 15;
    } else if (keywordDensity > 0) {
      score += 10;
    }
    
    // Keyword in first 100 words
    const first100 = lowerContent.substring(0, 500);
    if (first100.includes(keywordLower)) {
      score += 5;
    }
  }
  
  // 2. Meta Title (15 points)
  if (metaTitle) {
    score += 5; // Has title
    if (metaTitle.length >= 50 && metaTitle.length <= 60) {
      score += 5; // Optimal length
    } else if (metaTitle.length >= 40 && metaTitle.length <= 70) {
      score += 3;
    }
    
    if (focusKeyword && metaTitle.toLowerCase().includes(focusKeyword.toLowerCase())) {
      score += 5; // Keyword in title
    }
  }
  
  // 3. Meta Description (15 points)
  if (metaDescription) {
    score += 5; // Has description
    if (metaDescription.length >= 150 && metaDescription.length <= 160) {
      score += 5; // Optimal length
    } else if (metaDescription.length >= 120 && metaDescription.length <= 170) {
      score += 3;
    }
    
    if (focusKeyword && metaDescription.toLowerCase().includes(focusKeyword.toLowerCase())) {
      score += 5; // Keyword in description
    }
  }
  
  // 4. Content Length (15 points)
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount >= 1500) {
    score += 15;
  } else if (wordCount >= 1000) {
    score += 12;
  } else if (wordCount >= 500) {
    score += 8;
  } else if (wordCount >= 300) {
    score += 5;
  }
  
  // 5. Headings Structure (10 points)
  const h1Count = (htmlContent.match(/<h1[^>]*>/gi) || []).length;
  const h2Count = (htmlContent.match(/<h2[^>]*>/gi) || []).length;
  
  if (h1Count === 1) score += 5; // Single H1
  if (h2Count >= 2) score += 5; // Multiple H2s
  
  // 6. Images with Alt Text (10 points)
  const imgTags = htmlContent.match(/<img[^>]*>/gi) || [];
  const imgsWithAlt = imgTags.filter(img => img.includes('alt=')).length;
  if (imgTags.length > 0) {
    const altPercentage = (imgsWithAlt / imgTags.length) * 100;
    score += Math.min(10, (altPercentage / 10));
  }
  
  // 7. Internal/External Links (10 points)
  const links = htmlContent.match(/<a[^>]*href/gi) || [];
  if (links.length >= 3) {
    score += 5;
  } else if (links.length >= 1) {
    score += 3;
  }
  
  // Links per 1000 words
  const linksPerThousand = (links.length / wordCount) * 1000;
  if (linksPerThousand >= 2 && linksPerThousand <= 5) {
    score += 5;
  }
  
  // 8. Readability (15 points) - using Flesch Reading Ease
  try {
    const readabilityScore = flesch({ sentence: textContent.split(/[.!?]+/).length, word: wordCount, syllable: estimateSyllables(textContent) });
    // 60-70 is optimal (fairly easy to read)
    if (readabilityScore >= 60 && readabilityScore <= 80) {
      score += 15;
    } else if (readabilityScore >= 50 && readabilityScore <= 90) {
      score += 10;
    } else if (readabilityScore >= 30) {
      score += 5;
    }
  } catch (e) {
    // If readability calc fails, give partial credit
    score += 5;
  }
  
  return Math.min(score, maxScore);
}

/**
 * Calculate readability scores
 */
export function calculateReadability(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const syllables = estimateSyllables(text);
  
  // Flesch Reading Ease
  const fleschScore = flesch({ sentence: sentences, word: words, syllable: syllables });
  
  // Flesch-Kincaid Grade Level
  const fleschKincaid = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  
  return {
    fleschReadingEase: Math.max(0, Math.min(100, fleschScore)),
    fleschKincaidGrade: Math.max(0, fleschKincaid),
    interpretation: getReadabilityInterpretation(fleschScore),
  };
}

/**
 * Get human-readable interpretation of Flesch score
 */
function getReadabilityInterpretation(score) {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}

/**
 * Estimate syllable count (simplified algorithm)
 */
function estimateSyllables(text) {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  let syllableCount = 0;
  
  words.forEach(word => {
    // Simple syllable estimation
    const vowelGroups = word.match(/[aeiouy]+/g);
    if (vowelGroups) {
      syllableCount += vowelGroups.length;
      // Adjust for silent e
      if (word.endsWith('e')) syllableCount--;
      // At least one syllable per word
      if (syllableCount === 0) syllableCount = 1;
    } else {
      syllableCount += 1; // Words without vowels get 1 syllable
    }
  });
  
  return syllableCount;
}

/**
 * Calculate keyword density
 */
export function calculateKeywordDensity(content, keyword) {
  if (!keyword || !content) return 0;
  
  const lowerContent = content.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const matches = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length;
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  
  return wordCount > 0 ? ((matches / wordCount) * 100).toFixed(2) : 0;
}

/**
 * Generate SEO recommendations
 */
export function generateSEORecommendations(content, metadata, score) {
  const recommendations = [];
  const { focusKeyword, metaTitle, metaDescription, htmlContent } = metadata;
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  
  // Meta Title
  if (!metaTitle) {
    recommendations.push({ type: 'error', text: 'Add a meta title for better SEO' });
  } else if (metaTitle.length < 50 || metaTitle.length > 60) {
    recommendations.push({ type: 'warning', text: `Meta title should be 50-60 characters (currently ${metaTitle.length})` });
  }
  
  // Meta Description
  if (!metaDescription) {
    recommendations.push({ type: 'error', text: 'Add a meta description for better SEO' });
  } else if (metaDescription.length < 150 || metaDescription.length > 160) {
    recommendations.push({ type: 'warning', text: `Meta description should be 150-160 characters (currently ${metaDescription.length})` });
  }
  
  // Focus Keyword
  if (!focusKeyword) {
    recommendations.push({ type: 'warning', text: 'Set a focus keyword to optimize content' });
  } else {
    const density = calculateKeywordDensity(content, focusKeyword);
    if (density < 0.5) {
      recommendations.push({ type: 'warning', text: 'Focus keyword appears too few times. Aim for 1-2% density.' });
    } else if (density > 3) {
      recommendations.push({ type: 'warning', text: 'Focus keyword may be overused. Reduce to 1-2% density to avoid keyword stuffing.' });
    }
  }
  
  // Word Count
  if (wordCount < 300) {
    recommendations.push({ type: 'error', text: `Content is too short (${wordCount} words). Aim for at least 500 words.` });
  } else if (wordCount < 1000) {
    recommendations.push({ type: 'info', text: `Consider expanding content to 1000+ words for better ranking potential (currently ${wordCount} words).` });
  }
  
  // Headings
  const h1Count = (htmlContent?.match(/<h1[^>]*>/gi) || []).length;
  const h2Count = (htmlContent?.match(/<h2[^>]*>/gi) || []).length;
  
  if (h1Count === 0) {
    recommendations.push({ type: 'error', text: 'Add an H1 heading (main title)' });
  } else if (h1Count > 1) {
    recommendations.push({ type: 'warning', text: 'Only use one H1 heading per page' });
  }
  
  if (h2Count < 2) {
    recommendations.push({ type: 'info', text: 'Add more H2 headings to improve content structure' });
  }
  
  // Images
  const imgTags = htmlContent?.match(/<img[^>]*>/gi) || [];
  const imgsWithAlt = imgTags.filter(img => img.includes('alt=')).length;
  
  if (imgTags.length === 0) {
    recommendations.push({ type: 'info', text: 'Consider adding images to make content more engaging' });
  } else if (imgsWithAlt < imgTags.length) {
    recommendations.push({ type: 'warning', text: `${imgTags.length - imgsWithAlt} image(s) missing alt text` });
  }
  
  // Links
  const links = htmlContent?.match(/<a[^>]*href/gi) || [];
  if (links.length < 2) {
    recommendations.push({ type: 'info', text: 'Add more internal and external links for better SEO' });
  }
  
  return recommendations;
}

/**
 * Generate slug from title
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 75); // Limit length
}
