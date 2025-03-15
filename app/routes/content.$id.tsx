// Individual content viewing page

import React, { useState, useEffect } from 'react';
import { useParams, Link } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/node';
import Navigation from '~/components/Navigation';
import ContentDisplay from '~/components/ContentDisplay';
import { GeneratedContent, GeneratedSection } from '~/lib/types';
import { getGeneratedContentsFromStorage, saveGeneratedContentToStorage } from '~/lib/documents';

export const meta: MetaFunction = () => {
  return [
    { title: "InvestDoc AI - View Content" },
    { name: "description", content: "View and edit generated investment memorandum" },
  ];
};

export default function ContentViewPage() {
  const params = useParams();
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [notFound, setNotFound] = useState(false);
  
  useEffect(() => {
    if (params.id) {
      const contents = getGeneratedContentsFromStorage();
      const foundContent = contents.find(c => c.id === params.id);
      
      if (foundContent) {
        setContent(foundContent);
      } else {
        setNotFound(true);
      }
    }
  }, [params.id]);
  
  const handleUpdateSection = (sectionId: string, newContent: string, reviewStatus: string) => {
    if (!content) return;
    
    const updatedSections = content.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          content: newContent,
          reviewStatus: reviewStatus as "pending" | "reviewed" | "approved" | "rejected"
        };
      }
      return section;
    });
    
    const updatedContent: GeneratedContent = {
      ...content,
      sections: updatedSections,
      updatedAt: new Date()
    };
    
    setContent(updatedContent);
    saveGeneratedContentToStorage(updatedContent);
  };
  
  const handleExport = () => {
    if (!content) return;
    
    // Create a simple text export of the content
    let exportText = `INVESTMENT MEMORANDUM\n\n`;
    exportText += `Asset: ${content.metadata.assetName}\n`;
    exportText += `Type: ${content.metadata.assetType}\n`;
    exportText += `Location: ${content.metadata.location}\n`;
    exportText += `Client: ${content.metadata.client}\n`;
    exportText += `Date: ${content.metadata.date}\n\n`;
    
    // Add each section
    content.sections.forEach(section => {
      if (section.type === 'heading') {
        exportText += `\n\n${section.title.toUpperCase()}\n\n`;
      } else {
        exportText += `\n${section.title}\n\n`;
        exportText += `${section.content}\n`;
      }
    });
    
    // Create a download link
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.metadata.assetName.replace(/\s+/g, '_')}_memorandum.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleMarkAsComplete = () => {
    if (!content) return;
    
    const updatedContent: GeneratedContent = {
      ...content,
      status: 'completed',
      updatedAt: new Date()
    };
    
    setContent(updatedContent);
    saveGeneratedContentToStorage(updatedContent);
  };
  
  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12 bg-white shadow rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Content not found</h3>
              <p className="mt-1 text-sm text-gray-500">
                The content you're looking for doesn't exist or has been deleted.
              </p>
              <div className="mt-6">
                <Link
                  to="/content"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Content
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
                <div className="h-64 bg-gray-200 rounded mb-4"></div>
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {content.metadata.assetName}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {content.metadata.assetType} - {content.metadata.location}
              </p>
            </div>
            <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Export
              </button>
              {content.status !== 'completed' && (
                <button
                  type="button"
                  onClick={handleMarkAsComplete}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Mark as Complete
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-white shadow sm:rounded-lg">
            <ContentDisplay
              content={content}
              onUpdateSection={handleUpdateSection}
              readOnly={content.status === 'completed'}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
