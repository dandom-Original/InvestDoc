// Dashboard page

import React, { useState, useEffect } from 'react';
import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import Navigation from '~/components/Navigation';
import { getDocumentsFromStorage, getTemplatesFromStorage, getGeneratedContentsFromStorage, generateSampleTemplate, saveTemplateToStorage } from '~/lib/documents';
import { isApiKeyConfigured } from '~/lib/api';
import ConfigurationPanel from '~/components/ConfigurationPanel';

export const meta: MetaFunction = () => {
  return [
    { title: "InvestDoc AI - Dashboard" },
    { name: "description", content: "AI-powered investment memorandum generation system" },
  ];
};

export default function Dashboard() {
  const [documentCount, setDocumentCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [isSetupComplete, setIsSetupComplete] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  
  useEffect(() => {
    // Load counts from storage
    setDocumentCount(getDocumentsFromStorage().length);
    setTemplateCount(getTemplatesFromStorage().length);
    setGeneratedCount(getGeneratedContentsFromStorage().length);
    
    // Check if API key is configured
    const hasApiKey = isApiKeyConfigured();
    const hasTemplates = getTemplatesFromStorage().length > 0;
    
    setIsSetupComplete(hasApiKey && hasTemplates);
    
    // If there are no templates, create a sample one
    if (!hasTemplates) {
      const sampleTemplate = generateSampleTemplate();
      saveTemplateToStorage(sampleTemplate);
      setTemplateCount(1);
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              InvestDoc AI
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              AI-powered investment memorandum generation system
            </p>
          </div>
          
          {!isSetupComplete && (
            <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Setup Required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      To get started, you need to {!isApiKeyConfigured() && 'configure your API keys '} 
                      {!isApiKeyConfigured() && templateCount === 0 && 'and '} 
                      {templateCount === 0 && 'upload template documents'}.
                    </p>
                    <div className="mt-4">
                      {!isApiKeyConfigured() && (
                        <button
                          onClick={() => setShowConfigPanel(true)}
                          className="text-sm font-medium text-yellow-800 hover:text-yellow-700"
                        >
                          Configure API Keys <span aria-hidden="true">&rarr;</span>
                        </button>
                      )}
                      {templateCount === 0 && (
                        <Link
                          to="/templates"
                          className="ml-4 text-sm font-medium text-yellow-800 hover:text-yellow-700"
                        >
                          Manage Templates <span aria-hidden="true">&rarr;</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {showConfigPanel && (
            <div className="mt-8">
              <ConfigurationPanel />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowConfigPanel(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="flex justify-center h-12 w-12 rounded-md bg-blue-500 mx-auto">
                    <svg className="h-6 w-6 text-white mt-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2  2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900 text-center">Templates</h3>
                  <p className="mt-3 text-base text-gray-500">
                    Upload and manage template documents for your investment memoranda.
                  </p>
                  <div className="mt-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {templateCount} {templateCount === 1 ? 'template' : 'templates'} available
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/templates"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Manage Templates
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="flex justify-center h-12 w-12 rounded-md bg-blue-500 mx-auto">
                    <svg className="h-6 w-6 text-white mt-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900 text-center">Source Documents</h3>
                  <p className="mt-3 text-base text-gray-500">
                    Upload and manage source materials for your investments.
                  </p>
                  <div className="mt-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {documentCount} {documentCount === 1 ? 'document' : 'documents'} available
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/documents"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Manage Documents
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <div className="flex justify-center h-12 w-12 rounded-md bg-blue-500 mx-auto">
                    <svg className="h-6 w-6 text-white mt-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900 text-center">Generate Memorandum</h3>
                  <p className="mt-3 text-base text-gray-500">
                    Create a new investment memorandum by combining templates and source documents.
                  </p>
                  <div className="mt-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {generatedCount} memoranda generated
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/generate"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create New
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg leading-6 font-medium text-gray-900">Getting Started</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Follow these steps to create your first investment memorandum.
                </p>
              </div>
              <div>
                <button
                  onClick={() => setShowConfigPanel(!showConfigPanel)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  {showConfigPanel ? 'Hide Configuration' : 'Configure API'}
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 1</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex justify-between items-center">
                    <div>
                      Configure your API settings to connect with OpenRouter.
                      {!isApiKeyConfigured() && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Required
                        </span>
                      )}
                    </div>
                    {!isApiKeyConfigured() && (
                      <button
                        onClick={() => setShowConfigPanel(true)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Configure
                      </button>
                    )}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 2</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex justify-between items-center">
                    <div>
                      Upload a template document that will serve as the basis for your investment memorandum.
                      {templateCount === 0 && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Required
                        </span>
                      )}
                    </div>
                    <Link
                      to="/templates"
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Templates
                    </Link>
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 3</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex justify-between items-center">
                    <div>
                      Upload source documents containing information about your investment asset.
                    </div>
                    <Link
                      to="/documents"
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Documents
                    </Link>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 4</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex justify-between items-center">
                    <div>
                      Generate a new memorandum by selecting your template and source documents.
                    </div>
                    <Link
                      to="/generate"
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Generate
                    </Link>
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 5</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex justify-between items-center">
                    <div>
                      Review, edit, and export your generated investment memorandum.
                    </div>
                    <Link
                      to="/content"
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Content
                    </Link>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
