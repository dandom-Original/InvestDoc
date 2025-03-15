// Source documents management page

import React, { useState, useEffect } from 'react';
import type { MetaFunction } from '@remix-run/node';
import Navigation from '~/components/Navigation';
import FileUpload from '~/components/FileUpload';
import DocumentList from '~/components/DocumentList';
import { SourceDocument } from '~/lib/types';
import { getDocumentsFromStorage } from '~/lib/documents';

export const meta: MetaFunction = () => {
  return [
    { title: "InvestDoc AI - Source Documents" },
    { name: "description", content: "Manage your investment source documents" },
  ];
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  
  useEffect(() => {
    // Load documents from storage when the component mounts
    setDocuments(getDocumentsFromStorage());
  }, []);
  
  const handleDocumentUpload = (docs: SourceDocument | SourceDocument[]) => {
    if (Array.isArray(docs)) {
      setDocuments(prev => [...prev, ...docs]);
    } else {
      setDocuments(prev => [...prev, docs]);
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
                Source Documents
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Upload and manage source materials for your investments.
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <FileUpload
              fileType="source"
              onUploadComplete={handleDocumentUpload}
              multiple={true}
            />
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">Your Source Documents</h3>
            <div className="mt-4">
              <DocumentList
                documents={documents}
                type="source"
              />
            </div>
          </div>
          
          <div className="mt-12 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Source Document Guidelines</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Best practices for preparing source materials.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Document Types</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <p>Upload all relevant source materials about your investment asset, such as:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Market research reports</li>
                      <li>Financial statements and projections</li>
                      <li>Property information and specifications</li>
                      <li>Competitive analysis</li>
                      <li>Location and demographic data</li>
                      <li>Historical performance metrics</li>
                    </ul>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Document Quality</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <p>For best results:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Ensure documents are text-readable (not scanned images)</li>
                      <li>Organize information clearly with appropriate headings</li>
                      <li>Include the most current and accurate information available</li>
                      <li>Break down complex information into digestible sections</li>
                    </ul>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Supported Formats</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <p>Currently, the system works best with text-based formats (.txt, .doc, .docx). Support for other formats (.pdf, .xls, .ppt) is in development.</p>
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
