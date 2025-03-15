// Content generation functions

import { v4 as uuidv4 } from 'uuid';
import { 
  Template, 
  SourceDocument, 
  GeneratedContent, 
  GeneratedSection,
  ContentMetadata,
  SourceReference
} from './types';
import { processDocumentWithLLM } from './api';
import { getConfig } from './config';

// Intelligently match source documents to template sections
export const matchDocumentsToSections = (
  template: Template,
  sourceDocuments: SourceDocument[]
): Map<string, string[]> => {
  const sectionToDocMap = new Map<string, string[]>();
  
  // For each section in the template
  const processSection = (section: any) => {
    if (!section) return;
    
    // Score each document's relevance to this section
    const docScores: Record<string, number> = {};
    
    for (const doc of sourceDocuments) {
      let score = 0;
      
      // Check if section title appears in document
      if (doc.content.toLowerCase().includes(section.title.toLowerCase())) {
        score += 5;
      }
      
      // Check for keyword matches between section content and document
      const sectionKeywords = extractKeywords(section.content);
      for (const keyword of sectionKeywords) {
        if (doc.content.toLowerCase().includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      
      docScores[doc.id] = score;
    }
    
    // Sort documents by relevance score
    const sortedDocs = Object.entries(docScores)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score > 0)
      .map(([id]) => id);
    
    // Assign documents to this section
    sectionToDocMap.set(section.id, sortedDocs);
    
    // Process child sections
    if (section.children) {
      for (const child of section.children) {
        processSection(child);
      }
    }
  };
  
  // Process each top-level section
  for (const section of template.structure?.sections || []) {
    processSection(section);
  }
  
  return sectionToDocMap;
};

// Extract keywords from text
const extractKeywords = (text: string): string[] => {
  // Basic keyword extraction - in a real implementation, this would use more sophisticated NLP
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Remove common words
  const commonWords = new Set([
    'this', 'that', 'these', 'those', 'there', 'their', 'they', 'with',
    'from', 'have', 'will', 'would', 'should', 'could', 'about'
  ]);
  
  return [...new Set(words.filter(word => !commonWords.has(word)))];
};

// Generate content for a single section with advanced context awareness
export const generateSectionContent = async (
  template: Template,
  sourceDocuments: SourceDocument[],
  sectionId: string,
  metadata: ContentMetadata,
  documentMatches: Map<string, string[]>
): Promise<GeneratedSection> => {
  // Find the section in the template
  let section = null;
  
  for (const s of template.structure?.sections || []) {
    if (s.id === sectionId) {
      section = s;
      break;
    }
    
    if (s.children) {
      for (const child of s.children) {
        if (child.id === sectionId) {
          section = child;
          break;
        }
      }
    }
  }
  
  if (!section) {
    throw new Error(`Section with ID ${sectionId} not found in template`);
  }
  
  // Get the relevant documents for this section
  const relevantDocIds = documentMatches.get(sectionId) || [];
  
  // Prioritize the most relevant documents, but include others if we don't have enough
  let relevantDocs = sourceDocuments
    .filter(doc => relevantDocIds.includes(doc.id))
    .sort((a, b) => relevantDocIds.indexOf(a.id) - relevantDocIds.indexOf(b.id));
  
  // Add some other documents if we don't have enough relevant ones
  if (relevantDocs.length < 3) {
    const otherDocs = sourceDocuments.filter(doc => !relevantDocIds.includes(doc.id));
    relevantDocs = [...relevantDocs, ...otherDocs.slice(0, 3 - relevantDocs.length)];
  }
  
  // Prepare source content with excerpts to reference later
  const sourceReferences: SourceReference[] = [];
  const relevantSourceContent = relevantDocs.map(doc => {
    // Create a source reference
    const reference: SourceReference = {
      documentId: doc.id,
      excerpt: doc.content.substring(0, 300) + "..."
    };
    sourceReferences.push(reference);
    
    return `Document: ${doc.name}\n${doc.content.substring(0, 1000)}...\n\n`;
  }).join('\n');
  
  // Get other property data to include
  const otherProps = Object.entries(metadata.otherProperties || {})
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');
  
  // Create a prompt for generating content with improved instructions
  const sectionType = section.title.toLowerCase();
  
  // Tailor the prompt based on the section type
  let specializedInstructions = "";
  
  if (sectionType.includes("executive summary")) {
    specializedInstructions = `
- Create a compelling, concise executive summary highlighting the key investment attributes
- Focus on the most attractive elements of the investment opportunity
- Highlight expected returns and key value drivers
- Keep to 3-4 paragraphs maximum`;
  } else if (sectionType.includes("property") || sectionType.includes("asset")) {
    specializedInstructions = `
- Provide detailed information about the physical attributes of the property
- Include specifics about size, condition, amenities, and distinctive features
- Describe the location advantages in detail
- Include relevant historical information about the property`;
  } else if (sectionType.includes("market")) {
    specializedInstructions = `
- Provide data-driven insights about the local real estate market
- Include demographic trends, growth projections, and economic indicators
- Analyze supply and demand dynamics specific to this property type
- Compare to national benchmarks where relevant`;
  } else if (sectionType.includes("financial") || sectionType.includes("returns")) {
    specializedInstructions = `
- Present projected financial performance with clear assumptions
- Focus on key metrics: NOI, Cash Flow, IRR, Cap Rate, and Equity Multiple
- Include financing structure and terms if available
- Present a balanced assessment of the financial opportunity`;
  } else if (sectionType.includes("risk")) {
    specializedInstructions = `
- Provide a comprehensive yet balanced assessment of risk factors
- Include market risks, property-specific risks, and financial risks
- For each risk, suggest mitigation strategies
- Present risks professionally without undermining investment appeal`;
  } else if (sectionType.includes("strategy")) {
    specializedInstructions = `
- Detail the value-add or investment strategy clearly
- Include specific action items with projected timelines if available
- Explain how the strategy will maximize returns
- Include exit strategy considerations`;
  }
  
  const prompt = `
You are creating a professional investment memorandum for a ${metadata.assetType} property. 
I need you to generate content for the "${section.title}" section.

ASSET INFORMATION:
- Asset Name: ${metadata.assetName}
- Asset Type: ${metadata.assetType}
- Location: ${metadata.location}
- Client: ${metadata.client}
- Date: ${metadata.date}
${otherProps ? `\nAdditional Properties:\n${otherProps}` : ''}

SECTION TEMPLATE:
---
${section.content}
---

SPECIALIZED INSTRUCTIONS:
${specializedInstructions}

GENERAL GUIDELINES:
- Write in the style of a Harvard-educated real estate investment professional
- Use formal, sophisticated language appropriate for institutional investors
- Be specific and data-driven whenever possible
- Support claims with evidence from the provided documents
- Strike a balance between highlighting opportunities and acknowledging risks
- Maintain an authoritative, confident tone throughout
- Focus on creating compelling, investment-grade content
- Adapt the original template to this specific asset while maintaining the section's purpose

SOURCE MATERIALS:
${relevantSourceContent}
`;

  // Use an LLM to generate content for this section
  const generatedContent = await processDocumentWithLLM(
    relevantSourceContent,
    prompt,
    getConfig().ai.defaultModel
  );
  
  // Create and return the generated section
  return {
    id: uuidv4(),
    templateSectionId: section.id,
    title: section.title,
    content: generatedContent,
    type: section.type,
    reviewStatus: 'pending',
    sourceReferences
  };
};

// Generate content for all sections in a template with improved orchestration
export const generateCompleteContent = async (
  template: Template,
  sourceDocuments: SourceDocument[],
  metadata: ContentMetadata,
  progressCallback?: (progress: number) => void
): Promise<GeneratedContent> => {
  // Match documents to sections for more relevant content generation
  const documentMatches = matchDocumentsToSections(template, sourceDocuments);
  
  const sections: GeneratedSection[] = [];
  let processedCount = 0;
  
  // Flatten the template sections
  const flattenedSections: string[] = [];
  
  for (const section of template.structure?.sections || []) {
    flattenedSections.push(section.id);
    
    if (section.children) {
      for (const child of section.children) {
        flattenedSections.push(child.id);
      }
    }
  }
  
  const totalSections = flattenedSections.length;
  
  // Process higher-level sections first for better context in subsections
  const sortedSections = [...flattenedSections].sort((a, b) => {
    const sectionA = findSectionById(template, a);
    const sectionB = findSectionById(template, b);
    
    // Sort by level first (headings before content)
    const levelA = sectionA?.level || 0;
    const levelB = sectionB?.level || 0;
    
    return levelA - levelB;
  });
  
  // Process each section
  for (const sectionId of sortedSections) {
    const generatedSection = await generateSectionContent(
      template,
      sourceDocuments,
      sectionId,
      metadata,
      documentMatches
    );
    
    sections.push(generatedSection);
    
    processedCount++;
    if (progressCallback) {
      progressCallback((processedCount / totalSections) * 100);
    }
  }
  
  // Create and return the complete generated content
  return {
    id: uuidv4(),
    templateId: template.id,
    sections,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft',
    metadata
  };
};

// Helper function to find a section by ID
const findSectionById = (template: Template, sectionId: string): any => {
  for (const section of template.structure?.sections || []) {
    if (section.id === sectionId) return section;
    
    if (section.children) {
      for (const child of section.children) {
        if (child.id === sectionId) return child;
      }
    }
  }
  
  return null;
};

// Quality assurance function with specialized enhancement by section type
export const enhanceContentQuality = async (
  content: GeneratedContent
): Promise<GeneratedContent> => {
  const enhancedSections = await Promise.all(
    content.sections.map(async (section) => {
      // Skip headings or already approved sections
      if (section.type === 'heading' || section.reviewStatus === 'approved') {
        return section;
      }
      
      // Customize the enhancement prompt based on the section type
      let sectionSpecificGuidance = "";
      const sectionTitle = section.title.toLowerCase();
      
      if (sectionTitle.includes("executive") || sectionTitle.includes("summary")) {
        sectionSpecificGuidance = `
- Ensure the executive summary is concise yet comprehensive
- Highlight the most compelling aspects of the investment
- Check that key financial metrics are included
- Ensure the tone is confident and persuasive`;
      } else if (sectionTitle.includes("financial") || sectionTitle.includes("returns")) {
        sectionSpecificGuidance = `
- Verify that financial discussions are precise and backed by data
- Ensure projections are presented with appropriate caveats
- Check for logical consistency in financial arguments
- Make sure key metrics like IRR, cap rate, and cash-on-cash return are clearly explained`;
      } else if (sectionTitle.includes("risk")) {
        sectionSpecificGuidance = `
- Ensure risks are presented honestly but not overstated
- Check that each risk is accompanied by mitigation strategies
- Balance the discussion of risks with opportunity context
- Verify the tone remains professional and not alarmist`;
      } else if (sectionTitle.includes("market") || sectionTitle.includes("location")) {
        sectionSpecificGuidance = `
- Enhance market analysis with specific data points where possible
- Ensure demographic trends are clearly articulated
- Check that competitive positioning is well established
- Verify that market advantages are substantiated with evidence`;
      }
      
      const prompt = `
You are a managing director at a top real estate private equity firm reviewing an investment memorandum.
Enhance the following "${section.title}" section for clarity, persuasiveness, and investment appeal.

ENHANCEMENT GUIDELINES:
- Ensure the language is sophisticated, precise, and authoritative
- Improve logical flow and narrative structure
- Add specificity where generalizations are used
- Remove redundancies and sharpen the focus
- Ensure claims are properly substantiated
- Maintain a professional, confident tone throughout
- Format for readability with well-structured paragraphs

SECTION-SPECIFIC GUIDANCE:
${sectionSpecificGuidance}

CONTENT TO ENHANCE:
---
${section.content}
---

Return only the enhanced content, without explanations or notes.
`;

      const enhancedContent = await processDocumentWithLLM(
        section.content,
        prompt,
        getConfig().ai.defaultModel
      );
      
      return {
        ...section,
        content: enhancedContent,
        reviewStatus: 'reviewed'
      };
    })
  );
  
  // Perform final coherence check across sections
  const improvedContent: GeneratedContent = {
    ...content,
    sections: enhancedSections,
    updatedAt: new Date()
  };
  
  return improvedContent;
};

// Function to validate content consistency across sections
export const validateContentCoherence = async (
  content: GeneratedContent
): Promise<Record<string, string[]>> => {
  // Extract section contents for analysis
  const sectionContents: Record<string, string> = {};
  for (const section of content.sections) {
    sectionContents[section.title] = section.content;
  }
  
  // Prepare a coherence check prompt
  const prompt = `
Analyze the following investment memorandum sections for coherence and consistency.
Identify any inconsistencies, contradictions, or misalignments between sections.
Focus on inconsistencies in:
1. Financial figures and projections
2. Market descriptions and assumptions
3. Risk assessments
4. Property descriptions
5. Investment strategy

Respond with a JSON object where keys are section names and values are arrays of issues found.
If no issues are found for a section, include an empty array.

MEMORANDUM SECTIONS:
${Object.entries(sectionContents).map(([title, content]) => {
  return `
## ${title}
${content.substring(0, 500)}...
`;
}).join('\n')}
`;

  try {
    const validationResult = await processDocumentWithLLM(
      JSON.stringify(sectionContents),
      prompt,
      getConfig().ai.defaultModel
    );
    
    // Parse the response as JSON
    return JSON.parse(validationResult);
  } catch (error) {
    console.error("Error validating content coherence:", error);
    return {};
  }
};
