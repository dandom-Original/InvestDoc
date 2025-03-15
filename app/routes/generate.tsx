// Memorandum generation page

import React, { useState, useEffect } from 'react';
import { redirect, useNavigate } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/node';
import Navigation from '~/components/Navigation';
import DocumentList from '~/components/DocumentList';
import MetadataForm from '~/components/MetadataForm';
import ProgressBar from '~/components/ProgressBar';
import { Template, SourceDocument, ContentMetadata, GenerationJob } from '~/lib/types';
import { getTemplatesFromStorage, getDocumentsFromStorage } from '~/lib/documents';
import { startGenerationJob, addJobEventListener, removeJobEventListener } from '~/lib/orchestration';

export const meta: MetaFunction = () => {
  return [
    { title: "InvestDoc AI - Generate Memorandum" },
    { name: "description", content: "Generate a new investment memorandum" },
  ];
};

export default function GeneratePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<ContentMetadata | null>(null);
  const [job, setJob] = useState<GenerationJob | null>(null);
  
  useEffect(() => {
    // Load templates and documents from storage when the component mounts
    setTemplates(getTemplatesFromStorage());
    setDocuments(getDocumentsFromStorage());
  }, []);
  
  useEffect(() => {
    // Set up job event listener
    if (job) {
      const handleJobUpdate = (updatedJob: GenerationJob) => {
        setJob(updatedJob);
        
        if (updatedJob.status === 'completed' && updatedJob.result) {
          // Navigate to the content page when the job is completed
          navigate(`/content/${updatedJob.result.id}`);
        }
      };
      
      addJobEventListener(job.id, handleJobUpdate);
      
      return () => {
        removeJobEventListener(job.id, handleJobUpdate);
      };
    }
  }, [job, navigate]);
  
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplateId(template.id);
  };
  
  const handleDocumentSelect = (document: SourceDocument) => {
    setSelectedDocumentIds(prev => {
      if (prev.includes(document.id)) {
        return prev.filter(id => id !== document.id);
      } else {
        return [...prev, document.id];
      }
    });
  };
  
  const handleMetadataSubmit = (formMetadata: ContentMetadata) => {
    setMetadata(formMetadata);
    generateMemorandum(formMetadata);
  };
  
  const handleNextStep = () => {
    if (step === 1 && selectedTemplateId) {
      setStep(2);
    } else if (step === 2 && selectedDocumentIds.length > 0) {
      setStep(3);
    }
  };
  
  const handlePreviousStep = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };
  
  const generateMemorandum = async (formMetadata: ContentMetadata) => {
    if (!selectedTemplateId || selectedDocumentIds.length === 0) {
      return;
    }
    
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const selectedDocuments = documents.filter(d => selectedDocumentIds.includes(d.id));
    
    if (!selectedTemplate || selectedDocuments.length === 0) {
      return;
    }
    
    const newJob = await startGenerationJob(
      selectedTemplate,
      selectedDocuments,
      formMetadata
    );
    
    setJob(newJob);
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Step 1: Select a Template</h3>
            <DocumentList
              documents={templates}
              type="template"
              onSelect={handleTemplateSelect}
              selectedIds={selectedTemplateId ? [selectedTemplateId] : []}
            />
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!selectedTemplateId}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Step 2: Select Source Documents</h3>
            <DocumentList
              documents={documents}
              type="source"
              onSelect={handleDocumentSelect}
              selectedIds={selectedDocumentIds}
            />
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={handlePreviousStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Previous Step
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={selectedDocumentIds.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Step 3: Enter Asset Details</h3>
            <MetadataForm onSubmit={handleMetadataSubmit} />
            <div className="mt-6 flex justify-start">
              <button
                type="button"
                onClick={handlePreviousStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Previous Step
              </button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Generate Memorandum
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Create a new investment memorandum using AI.
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {job ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Generating Your Memorandum</h3>
                    <ProgressBar
                      progress={job.progress}
                      status={job.status}
                      error={job.error}
                    />
                    <p className="text-sm text-gray-500">
                      This process may take a few minutes. You'll be automatically redirected to your generated content when it's ready.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}>
                          <span className="text-white font-medium">1</span>
                        </div>
                        <div className={`h-0.5 w-12 ${step > 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}>
                          <span className="text-white font-medium">2</span>
                        </div>
                        <div className={`h-0.5 w-12 ${step > 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}>
                          <span className="text-white font-medium">3</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Step {step} of 3
                      </div>
                    </div>
                    
                    {renderStepContent()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
