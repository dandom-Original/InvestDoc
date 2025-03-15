// Component to display the generated content

import React, { useState } from 'react';
import { GeneratedContent, GeneratedSection } from '~/lib/types';

interface ContentDisplayProps {
  content: GeneratedContent;
  onUpdateSection?: (sectionId: string, newContent: string, reviewStatus: string) => void;
  readOnly?: boolean;
}

export default function ContentDisplay({ content, onUpdateSection, readOnly = false }: ContentDisplayProps) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const handleEdit = (section: GeneratedSection) => {
    setEditingSectionId(section.id);
    setEditingContent(section.content);
  };
  
  const handleSave = (section: GeneratedSection) => {
    if (onUpdateSection) {
      onUpdateSection(section.id, editingContent, 'reviewed');
    }
    setEditingSectionId(null);
  };
  
  const handleApprove = (section: GeneratedSection) => {
    if (onUpdateSection) {
      onUpdateSection(section.id, section.content, 'approved');
    }
  };
  
  const handleReject = (section: GeneratedSection) => {
    if (onUpdateSection) {
      onUpdateSection(section.id, section.content, 'rejected');
    }
  };
  
  const handleCancel = () => {
    setEditingSectionId(null);
  };
  
  const toggleSectionExpand = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };
  
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'reviewed': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  // Function to format content with proper typography
  const formatContent = (content: string) => {
    // Split by newlines and process each paragraph
    return content.split('\n').map((paragraph, i) => {
      if (!paragraph.trim()) return null;
      
      // Check if it's a list item
      if (paragraph.trim().match(/^(\d+\.|\*|\-)\s/)) {
        return (
          <li key={i} className="ml-6 mb-2">{paragraph.replace(/^(\d+\.|\*|\-)\s/, '')}</li>
        );
      }
      
      // Check if it's a subheading (starts with ###, ##)
      if (paragraph.trim().startsWith('###')) {
        return (
          <h4 key={i} className="text-md font-semibold mt-4 mb-2">
            {paragraph.replace(/^###\s*/, '')}
          </h4>
        );
      }
      
      if (paragraph.trim().startsWith('##')) {
        return (
          <h3 key={i} className="text-lg font-semibold mt-4 mb-2">
            {paragraph.replace(/^##\s*/, '')}
          </h3>
        );
      }
      
      if (paragraph.trim().startsWith('#')) {
        return (
          <h2 key={i} className="text-xl font-bold mt-4 mb-2">
            {paragraph.replace(/^#\s*/, '')}
          </h2>
        );
      }
      
      // Regular paragraph
      return <p key={i} className="mb-4">{paragraph}</p>;
    });
  };
  
  const renderSourceReferences = (section: GeneratedSection) => {
    if (!section.sourceReferences || section.sourceReferences.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">Source References:</h4>
        <ul className="mt-2 text-xs text-gray-600">
          {section.sourceReferences.map((ref, index) => (
            <li key={index} className="mb-1">
              {ref.excerpt && (
                <div className="italic">"{ref.excerpt.substring(0, 100)}..."</div>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  const renderSection = (section: GeneratedSection) => {
    if (section.type === 'heading') {
      return (
        <div className="mb-4" key={section.id}>
          <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
        </div>
      );
    }
    
    const isEditing = editingSectionId === section.id;
    const isExpanded = expandedSections.has(section.id);
    
    return (
      <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden" key={section.id}>
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 
            className="text-lg font-medium text-gray-900 cursor-pointer flex items-center"
            onClick={() => toggleSectionExpand(section.id)}
          >
            <svg 
              className={`h-5 w-5 text-gray-500 mr-2 transform ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {section.title}
          </h3>
          <div className="flex space-x-2 items-center">
            {getStatusBadge(section.reviewStatus)}
            
            {!readOnly && (
              isEditing ? (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSave(section)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(section)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit
                  </button>
                  {section.reviewStatus !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(section)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Approve
                    </button>
                  )}
                  {section.reviewStatus !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleReject(section)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Reject
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        </div>
        
        {(isExpanded || isEditing) && (
          <div className="p-4">
            {isEditing ? (
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full h-64 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                {formatContent(section.content)}
                {renderSourceReferences(section)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Investment Memorandum</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {content.metadata.assetName} - {content.metadata.assetType}
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Asset Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{content.metadata.assetName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Asset Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{content.metadata.assetType}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900">{content.metadata.location}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Client</dt>
              <dd className="mt-1 text-sm text-gray-900">{content.metadata.client}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{content.metadata.date}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{content.status}</dd>
            </div>
            
            {/* Display other properties if available */}
            {content.metadata.otherProperties && Object.entries(content.metadata.otherProperties).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm font-medium text-gray-500">{key}</dt>
                <dd className="mt-1 text-sm text-gray-900">{value as string}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4">
        <div className="mb-4 flex justify-between items-center">
          <button
            type="button"
            onClick={() => setExpandedSections(new Set(content.sections.map(s => s.id)))}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={() => setExpandedSections(new Set())}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Collapse All
          </button>
        </div>
        
        <div className="space-y-6">
          {content.sections.map(renderSection)}
        </div>
      </div>
    </div>
  );
}
