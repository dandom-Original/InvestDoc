// Component to display a list of uploaded documents

import React from 'react';
import { SourceDocument, Template } from '~/lib/types';

interface DocumentListProps {
  documents: (SourceDocument | Template)[];
  type: 'source' | 'template';
  onSelect?: (document: SourceDocument | Template) => void;
  selectedIds?: string[];
}

export default function DocumentList({ documents, type, onSelect, selectedIds = [] }: DocumentListProps) {
  if (!documents.length) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
        No {type === 'source' ? 'source documents' : 'templates'} uploaded yet.
      </div>
    );
  }
  
  const formatDate = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString();
  };
  
  const formatSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {onSelect && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Select
              </th>
            )}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr 
              key={doc.id} 
              className={`${onSelect ? 'cursor-pointer hover:bg-gray-50' : ''} ${
                selectedIds.includes(doc.id) ? 'bg-blue-50' : ''
              }`}
              onClick={() => onSelect && onSelect(doc)}
            >
              {onSelect && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(doc.id)}
                    readOnly
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                    <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d={type === 'template' 
                          ? "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                          : "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"}
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{doc.contentType}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatSize(doc.size)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(doc.uploadedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
