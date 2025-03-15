// Templates management page

import React, { useState, useEffect } from 'react';
import type { MetaFunction } from '@remix-run/node';
import Navigation from '~/components/Navigation';
import FileUpload from '~/components/FileUpload';
import DocumentList from '~/components/DocumentList';
import { Template } from '~/lib/types';
import { getTemplatesFromStorage, deleteTemplate, generateSampleTemplate, saveTemplateToStorage } from '~/lib/documents';

export const meta: MetaFunction = () => {
  return [
    { title: "InvestDoc AI - Templates" },
    { name: "description", content: "Manage your investment memorandum templates" },
  ];
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateDetails, setShowTemplateDetails] = useState(false);
  
  useEffect(() => {
    // Load templates from storage when the component mounts
    const storedTemplates = getTemplatesFromStorage();
    setTemplates(storedTemplates);
    
    // If there are no templates, create a sample one
    if (storedTemplates.length === 0) {
      const sampleTemplate = generateSampleTemplate();
      saveTemplateToStorage(sampleTemplate);
      setTemplates([sampleTemplate]);
    }
  }, []);
  
  const handleTemplateUpload = (template: Template) => {
    setTemplates(prev => [...prev, template]);
  };
  
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setShowTemplateDetails(true);
  };
  
  const handleDeleteTemplate = () => {
    if (selectedTemplate) {
      deleteTemplate(selectedTemplate.id);
      setTemplates(templates.filter(t => t.id !== selectedTemplate.id));
      setSelectedTemplate(null);
      setShowTemplateDetails(false);
    }
  };
  
  const handleCreateSample = () => {
    const sampleTemplate = generateSampleTemplate();
    saveTemplateToStorage(sampleTemplate);
    setTemplates(prev => [...prev, sampleTemplate]);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Templates
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Upload and manage your investment memorandum templates.
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={handleCreateSample}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Sample Template
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <FileUpload
              fileType="template"
              onUploadComplete={handleTemplateUpload}
            />
          </div>
          
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900">Your Templates</h3>
              <div className="mt-4">
                <DocumentList
                  documents={templates}
                  type="template"
                  onSelect={handleTemplateSelect}
                  selectedIds={selectedTemplate ? [selectedTemplate.id] : []}
                />
              </div>
            </div>
            
            {showTemplateDetails && selectedTemplate && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Template Details
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {selectedTemplate.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteTemplate}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTemplate.name}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Size</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTemplate.size} bytes</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTemplate.contentType}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Uploaded</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTemplate.uploadedAt.toLocaleString()}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Structure</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                          {selectedTemplate.structure?.sections.map((section) => (
                            <li key={section.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center">
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {section.title}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
            
            {!showTemplateDetails && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Template Guidelines</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Best practices for creating effective templates.
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Document Structure</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <p>Templates should have clear sections marked with markdown headings (# for main sections, ## for subsections).</p>
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Content Guidelines</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Use clear, professional language</li>
                          <li>Include placeholders for asset-specific information</li>
                          <li>Organize sections logically</li>
                          <li>Include all standard memorandum sections</li>
                        </ul>
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Supported Formats</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <p>Currently supports text-based templates (.txt, .md, .doc, .docx).</p>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
