// Document processing utilities

import { Template, SourceDocument, TemplateStructure, TemplateSection, GeneratedContent } from "./types";
import { v4 as uuidv4 } from 'uuid';
import { analyzeDocument } from "./api";

// Function to parse text content of a template document
export const parseTemplateContent = (content: string): TemplateStructure => {
  // This is an enhanced implementation to better extract document structure
  const lines = content.split('\n');
  const sections: TemplateSection[] = [];
  let currentSection: TemplateSection | null = null;
  let currentSubSection: TemplateSection | null = null;
  
  // Helper function to create a new section
  const createSection = (title: string, level: number): TemplateSection => {
    return {
      id: uuidv4(),
      title: title.trim(),
      content: '',
      type: 'heading',
      level,
      children: []
    };
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    // Look for markdown headings
    if (line.startsWith('# ')) {
      // Level 1 heading
      if (currentSection) {
        sections.push(currentSection);
      }
      
      currentSection = createSection(line.substring(2), 1);
      currentSubSection = null;
      
    } else if (line.startsWith('## ')) {
      // Level 2 heading
      if (currentSection) {
        currentSubSection = createSection(line.substring(3), 2);
        currentSection.children = currentSection.children || [];
        currentSection.children.push(currentSubSection);
      }
      
    } else if (line.startsWith('### ')) {
      // Level 3 heading - add as a subsection of level 2 if it exists, otherwise as a child of level 1
      const newSubSection = createSection(line.substring(4), 3);
      
      if (currentSubSection) {
        currentSubSection.children = currentSubSection.children || [];
        currentSubSection.children.push(newSubSection);
      } else if (currentSection) {
        currentSection.children = currentSection.children || [];
        currentSection.children.push(newSubSection);
      }
      
    } else {
      // Handle non-heading content
      if (currentSubSection) {
        // Add to the current subsection
        currentSubSection.content += line + '\n';
        
        // Convert subsection to 'text' type if it has content
        if (currentSubSection.type === 'heading' && currentSubSection.content.trim()) {
          currentSubSection.type = 'text';
        }
        
      } else if (currentSection) {
        // Add directly to the current section
        currentSection.content += line + '\n';
        
        // Convert section to 'text' type if it has content
        if (currentSection.type === 'heading' && currentSection.content.trim()) {
          currentSection.type = 'text';
        }
      }
    }
  }
  
  // Add the last section if it exists
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return { sections };
};

// Intelligent function to extract key information from source documents
export const extractInformation = async (
  document: SourceDocument,
  assetType: string
): Promise<Record<string, any>> => {
  // Use the AI to analyze the document and extract structured information
  const analysisResult = await analyzeDocument(document.content, assetType);
  
  // Return the structured information
  return {
    documentName: document.name,
    extractedInfo: analysisResult,
    timestamp: new Date().toISOString()
  };
};

// Function to detect tables in text and convert to structured format
export const detectAndParseTabularData = (text: string): any[] => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const tables = [];
  let currentTable: string[] = [];
  let inTable = false;
  
  // First pass - identify potential tables based on consistent delimiter patterns
  for (const line of lines) {
    const hasMultipleDelimiters = 
      (line.includes('|') && line.split('|').length > 2) || 
      (line.includes('\t') && line.split('\t').length > 1);
    
    if (hasMultipleDelimiters) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }
      currentTable.push(line);
    } else if (inTable) {
      if (currentTable.length > 1) {  // Only consider tables with at least 2 rows
        tables.push([...currentTable]);
      }
      inTable = false;
      currentTable = [];
    }
  }
  
  // Add the last table if we're still in one
  if (inTable && currentTable.length > 1) {
    tables.push([...currentTable]);
  }
  
  // Second pass - convert raw table text to structured format
  return tables.map(tableLines => {
    // Determine delimiter (| for markdown tables, \t for tab-delimited)
    const delimiter = tableLines[0].includes('|') ? '|' : '\t';
    
    // Parse header row
    let headerRow = tableLines[0].split(delimiter).map(cell => cell.trim());
    
    // Handle markdown table formatting
    if (delimiter === '|') {
      headerRow = headerRow.filter(cell => cell !== ''); // Remove empty cells at start/end
    }
    
    // Skip separator row in markdown tables (e.g., |---|---|)
    const dataStartIndex = 
      delimiter === '|' && tableLines[1] && tableLines[1].includes('-') 
        ? 2 
        : 1;
    
    // Parse data rows
    const rows = [];
    for (let i = dataStartIndex; i < tableLines.length; i++) {
      let cells = tableLines[i].split(delimiter).map(cell => cell.trim());
      
      if (delimiter === '|') {
        cells = cells.filter(cell => cell !== '');
      }
      
      // Create object with header keys and cell values
      const rowObj: Record<string, string> = {};
      for (let j = 0; j < Math.min(headerRow.length, cells.length); j++) {
        const headerKey = headerRow[j] || `column${j+1}`;
        rowObj[headerKey] = cells[j];
      }
      
      rows.push(rowObj);
    }
    
    return rows;
  });
};

// Function to load a file as a SourceDocument
export const loadFileAsSourceDocument = async (file: File): Promise<SourceDocument> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const content = reader.result as string;
      
      const document: SourceDocument = {
        id: uuidv4(),
        name: file.name,
        contentType: file.type,
        content,
        uploadedAt: new Date(),
        size: file.size
      };
      
      resolve(document);
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsText(file);
  });
};

// Function to load a file as a Template
export const loadFileAsTemplate = async (file: File): Promise<Template> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const content = reader.result as string;
      
      const template: Template = {
        id: uuidv4(),
        name: file.name,
        contentType: file.type,
        content,
        uploadedAt: new Date(),
        size: file.size,
        structure: parseTemplateContent(content)
      };
      
      resolve(template);
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsText(file);
  });
};

// Function to generate a sample template document
export const generateSampleTemplate = (): Template => {
  const sampleContent = `# Investment Memorandum Template

## Executive Summary
This section provides a brief overview of the investment opportunity, highlighting key aspects of the property, the market, and the expected returns.

## Property Overview
### Location & Description
Detailed description of the property location, specifications, and notable features.

### Property Photos
Include relevant photographs of the property and surrounding area.

## Market Analysis
### Market Overview
Analysis of the local real estate market, including trends, comparable properties, and economic indicators.

### Competitive Landscape
Overview of competitive properties in the area and their positioning relative to the subject property.

## Investment Strategy
### Acquisition Strategy
The approach to acquiring the property, including pricing strategy and negotiation points.

### Value-Add Opportunities
Specific strategies to increase the property's value, such as renovations, repositioning, or operational improvements.

### Exit Strategy
The planned approach to eventually sell or refinance the property.

## Financial Analysis
### Purchase Information
Details of the purchase price, financing structure, and closing costs.

### Pro Forma Financial Statements
Projected income, expenses, and cash flows over the investment period.

### Investment Returns
Expected returns, including IRR, equity multiple, and cash-on-cash returns.

### Sensitivity Analysis
Analysis of how different scenarios might affect the investment returns.

## Risk Factors
Discussion of potential risks associated with the investment and mitigation strategies.

## Appendix
Additional supporting documents, market research, and detailed financial models.
`;

  return {
    id: uuidv4(),
    name: 'Sample Investment Memorandum Template.md',
    contentType: 'text/markdown',
    content: sampleContent,
    uploadedAt: new Date(),
    size: sampleContent.length,
    structure: parseTemplateContent(sampleContent)
  };
};

// Local storage utility functions
// In a real app, these would likely connect to a database
export const saveDocumentToStorage = (document: SourceDocument): void => {
  const documents = getDocumentsFromStorage();
  documents.push(document);
  localStorage.setItem('sourceDocuments', JSON.stringify(documents));
};

export const getDocumentsFromStorage = (): SourceDocument[] => {
  const documentsJson = localStorage.getItem('sourceDocuments');
  if (!documentsJson) return [];
  
  try {
    const parsed = JSON.parse(documentsJson);
    
    // Ensure dates are properly parsed
    return parsed.map((doc: any) => ({
      ...doc,
      uploadedAt: new Date(doc.uploadedAt)
    }));
  } catch (error) {
    console.error("Failed to parse documents from storage:", error);
    return [];
  }
};

export const saveTemplateToStorage = (template: Template): void => {
  const templates = getTemplatesFromStorage();
  templates.push(template);
  localStorage.setItem('templates', JSON.stringify(templates));
};

export const getTemplatesFromStorage = (): Template[] => {
  const templatesJson = localStorage.getItem('templates');
  if (!templatesJson) return [];
  
  try {
    const parsed = JSON.parse(templatesJson);
    
    // Ensure dates are properly parsed
    return parsed.map((template: any) => ({
      ...template,
      uploadedAt: new Date(template.uploadedAt)
    }));
  } catch (error) {
    console.error("Failed to parse templates from storage:", error);
    return [];
  }
};

export const getTemplateById = (id: string): Template | null => {
  const templates = getTemplatesFromStorage();
  return templates.find(t => t.id === id) || null;
};

export const getDocumentById = (id: string): SourceDocument | null => {
  const documents = getDocumentsFromStorage();
  return documents.find(d => d.id === id) || null;
};

export const saveGeneratedContentToStorage = (content: GeneratedContent): void => {
  const contents = getGeneratedContentsFromStorage();
  const existingIndex = contents.findIndex(c => c.id === content.id);
  
  if (existingIndex >= 0) {
    contents[existingIndex] = content;
  } else {
    contents.push(content);
  }
  
  localStorage.setItem('generatedContents', JSON.stringify(contents));
};

export const getGeneratedContentsFromStorage = (): GeneratedContent[] => {
  const contentsJson = localStorage.getItem('generatedContents');
  if (!contentsJson) return [];
  
  try {
    const parsed = JSON.parse(contentsJson);
    
    // Ensure dates are properly parsed
    return parsed.map((content: any) => ({
      ...content,
      createdAt: new Date(content.createdAt),
      updatedAt: new Date(content.updatedAt)
    }));
  } catch (error) {
    console.error("Failed to parse generated contents from storage:", error);
    return [];
  }
};

export const getGeneratedContentById = (id: string): GeneratedContent | null => {
  const contents = getGeneratedContentsFromStorage();
  return contents.find(c => c.id === id) || null;
};

export const deleteGeneratedContent = (id: string): void => {
  const contents = getGeneratedContentsFromStorage();
  const updatedContents = contents.filter(c => c.id !== id);
  localStorage.setItem('generatedContents', JSON.stringify(updatedContents));
};

export const deleteSourceDocument = (id: string): void => {
  const documents = getDocumentsFromStorage();
  const updatedDocuments = documents.filter(d => d.id !== id);
  localStorage.setItem('sourceDocuments', JSON.stringify(updatedDocuments));
};

export const deleteTemplate = (id: string): void => {
  const templates = getTemplatesFromStorage();
  const updatedTemplates = templates.filter(t => t.id !== id);
  localStorage.setItem('templates', JSON.stringify(updatedTemplates));
};

// Export utilities for advanced file formats (in real implementation, these would use libraries for proper parsing)
export const generatePDF = (content: GeneratedContent): Blob => {
  // In a real implementation, this would use a PDF generation library
  // For now, we're just creating a simple text blob
  const textContent = `
INVESTMENT MEMORANDUM

${content.metadata.assetName}
${content.metadata.assetType}
${content.metadata.location}
${content.metadata.date}

${content.sections.map(section => {
  return `
${section.title.toUpperCase()}
${section.content}
  `;
}).join('\n')}
  `;
  
  return new Blob([textContent], { type: 'application/pdf' });
};

export const generateDOCX = (content: GeneratedContent): Blob => {
  // In a real implementation, this would use a DOCX generation library
  // For now, we're just creating a simple text blob
  const textContent = `
INVESTMENT MEMORANDUM

${content.metadata.assetName}
${content.metadata.assetType}
${content.metadata.location}
${content.metadata.date}

${content.sections.map(section => {
  return `
${section.title.toUpperCase()}
${section.content}
  `;
}).join('\n')}
  `;
  
  return new Blob([textContent], { type: 'application/text' });
};
