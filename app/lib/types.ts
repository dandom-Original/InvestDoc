// Types for the Investment Memorandum Generation System

export interface SourceDocument {
  id: string;
  name: string;
  contentType: string;
  content: string;
  uploadedAt: Date;
  size: number;
}

export interface Template {
  id: string;
  name: string;
  contentType: string;
  content: string;
  uploadedAt: Date;
  size: number;
  structure?: TemplateStructure;
}

export interface TemplateStructure {
  sections: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  title: string;
  content: string;
  type: "heading" | "text" | "table" | "chart" | "image";
  level?: number;
  children?: TemplateSection[];
}

export interface GeneratedContent {
  id: string;
  templateId: string;
  sections: GeneratedSection[];
  createdAt: Date;
  updatedAt: Date;
  status: "draft" | "reviewing" | "completed";
  metadata: ContentMetadata;
}

export interface GeneratedSection {
  id: string;
  templateSectionId: string;
  title: string;
  content: string;
  type: "heading" | "text" | "table" | "chart" | "image";
  sourceReferences?: SourceReference[];
  reviewStatus: "pending" | "reviewed" | "approved" | "rejected";
  reviewComments?: string;
}

export interface SourceReference {
  documentId: string;
  page?: number;
  excerpt?: string;
}

export interface ContentMetadata {
  assetName: string;
  assetType: string;
  location: string;
  client: string;
  date: string;
  otherProperties: Record<string, any>;
}

export interface GenerationJob {
  id: string;
  templateId: string;
  sourceDocumentIds: string[];
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
  result?: GeneratedContent;
  progress: number;
  error?: string;
  metadata: ContentMetadata;
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: string;
  contextSize: number;
  capabilities: string[];
  costPerToken: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  purpose: "extraction" | "generation" | "refinement" | "review";
}
