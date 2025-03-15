// Orchestration and workflow coordination

import { v4 as uuidv4 } from 'uuid';
import { 
  Template, 
  SourceDocument, 
  GenerationJob, 
  GeneratedContent,
  ContentMetadata 
} from './types';
import { 
  generateCompleteContent, 
  enhanceContentQuality,
  validateContentCoherence
} from './content-generation';
import { 
  saveGeneratedContentToStorage, 
  getTemplateById, 
  getDocumentById 
} from './documents';

// In-memory queue for generation jobs
// In a real application, this would be persisted to a database
const generationJobs: GenerationJob[] = [];

// Event emitter for job progress updates
type JobEventCallback = (job: GenerationJob) => void;
const jobEventListeners: Record<string, JobEventCallback[]> = {};

// Add a listener for job events
export const addJobEventListener = (jobId: string, callback: JobEventCallback): void => {
  if (!jobEventListeners[jobId]) {
    jobEventListeners[jobId] = [];
  }
  
  jobEventListeners[jobId].push(callback);
};

// Remove a listener for job events
export const removeJobEventListener = (jobId: string, callback: JobEventCallback): void => {
  if (!jobEventListeners[jobId]) return;
  
  const index = jobEventListeners[jobId].indexOf(callback);
  if (index !== -1) {
    jobEventListeners[jobId].splice(index, 1);
  }
};

// Emit a job event
const emitJobEvent = (job: GenerationJob): void => {
  if (!jobEventListeners[job.id]) return;
  
  for (const callback of jobEventListeners[job.id]) {
    callback({ ...job }); // Send a copy to prevent mutation
  }
};

// Create a new generation job
export const createGenerationJob = (
  templateId: string,
  sourceDocumentIds: string[],
  metadata: ContentMetadata
): GenerationJob => {
  const job: GenerationJob = {
    id: uuidv4(),
    templateId,
    sourceDocumentIds,
    status: 'queued',
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: 0,
    metadata
  };
  
  generationJobs.push(job);
  emitJobEvent(job);
  
  return job;
};

// Get a generation job by ID
export const getJobById = (id: string): GenerationJob | undefined => {
  return generationJobs.find(job => job.id === id);
};

// Get all jobs
export const getAllJobs = (): GenerationJob[] => {
  return [...generationJobs];
};

// Update job progress
export const updateJobProgress = (id: string, progress: number, message?: string): void => {
  const job = getJobById(id);
  if (!job) return;
  
  job.progress = progress;
  job.updatedAt = new Date();
  if (message) job.statusMessage = message;
  
  emitJobEvent(job);
};

// Process a generation job with enhanced workflow
export const processJob = async (
  job: GenerationJob,
  template: Template,
  sourceDocuments: SourceDocument[]
): Promise<void> => {
  try {
    // Update job status
    job.status = 'processing';
    job.updatedAt = new Date();
    emitJobEvent(job);
    
    // Step 1: Content Generation (60% of progress)
    updateJobProgress(job.id, 5, "Analyzing documents and template");
    
    // Short delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    updateJobProgress(job.id, 10, "Starting content generation");
    
    const generatedContent = await generateCompleteContent(
      template,
      sourceDocuments,
      job.metadata,
      (progress) => {
        // Map the generation progress to 10-70% of overall progress
        const overallProgress = 10 + (progress * 0.6);
        updateJobProgress(job.id, overallProgress, "Generating content");
      }
    );
    
    updateJobProgress(job.id, 70, "Content generation complete");
    
    // Step 2: Enhance content quality (20% of progress)
    updateJobProgress(job.id, 75, "Enhancing content quality");
    
    // Delay to prevent overwhelming API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const enhancedContent = await enhanceContentQuality(generatedContent);
    
    updateJobProgress(job.id, 90, "Quality enhancement complete");
    
    // Step 3: Validate content coherence (5% of progress)
    updateJobProgress(job.id, 92, "Validating content coherence");
    
    const validationResults = await validateContentCoherence(enhancedContent);
    
    // Add validation results to the content
    const finalContent = {
      ...enhancedContent,
      validationResults,
      updatedAt: new Date()
    };
    
    // Step 4: Save the generated content (5% of progress)
    updateJobProgress(job.id, 95, "Saving generated content");
    
    saveGeneratedContentToStorage(finalContent);
    
    // Update job status
    job.status = 'completed';
    job.result = finalContent;
    job.progress = 100;
    job.statusMessage = "Memorandum generation complete";
    job.updatedAt = new Date();
    emitJobEvent(job);
    
  } catch (error) {
    console.error("Error processing job:", error);
    
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : String(error);
    job.statusMessage = "Failed to generate memorandum";
    job.updatedAt = new Date();
    emitJobEvent(job);
  }
};

// Queue and start a new generation job with better error handling
export const startGenerationJob = async (
  template: Template,
  sourceDocuments: SourceDocument[],
  metadata: ContentMetadata
): Promise<GenerationJob> => {
  // Validate inputs
  if (!template) {
    throw new Error("Template is required");
  }
  
  if (!sourceDocuments || sourceDocuments.length === 0) {
    throw new Error("At least one source document is required");
  }
  
  if (!metadata || !metadata.assetName || !metadata.assetType) {
    throw new Error("Asset metadata is incomplete");
  }
  
  // Create a new job
  const sourceDocumentIds = sourceDocuments.map(doc => doc.id);
  const job = createGenerationJob(template.id, sourceDocumentIds, metadata);
  
  // Process the job asynchronously
  setTimeout(() => {
    processJob(job, template, sourceDocuments);
  }, 500);
  
  return job;
};

// Alternative method that takes IDs instead of objects
export const startGenerationJobWithIds = async (
  templateId: string,
  sourceDocumentIds: string[],
  metadata: ContentMetadata
): Promise<GenerationJob> => {
  // Get the template and source documents
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template with ID ${templateId} not found`);
  }
  
  const sourceDocuments = sourceDocumentIds
    .map(id => getDocumentById(id))
    .filter((doc): doc is SourceDocument => doc !== null);
  
  if (sourceDocuments.length === 0) {
    throw new Error("No valid source documents found");
  }
  
  return startGenerationJob(template, sourceDocuments, metadata);
};

// Cancel a job
export const cancelJob = (id: string): boolean => {
  const job = getJobById(id);
  if (!job || job.status === 'completed' || job.status === 'failed') {
    return false;
  }
  
  job.status = 'failed';
  job.error = 'Job cancelled by user';
  job.statusMessage = 'Cancelled';
  job.updatedAt = new Date();
  emitJobEvent(job);
  
  return true;
};

// Retry a failed job
export const retryJob = async (id: string): Promise<boolean> => {
  const job = getJobById(id);
  if (!job || job.status !== 'failed') {
    return false;
  }
  
  const template = getTemplateById(job.templateId);
  if (!template) {
    return false;
  }
  
  const sourceDocuments = job.sourceDocumentIds
    .map(id => getDocumentById(id))
    .filter((doc): doc is SourceDocument => doc !== null);
  
  if (sourceDocuments.length === 0) {
    return false;
  }
  
  job.status = 'queued';
  job.progress = 0;
  job.error = undefined;
  job.statusMessage = 'Restarting job';
  job.updatedAt = new Date();
  emitJobEvent(job);
  
  setTimeout(() => {
    processJob(job, template, sourceDocuments);
  }, 500);
  
  return true;
};
