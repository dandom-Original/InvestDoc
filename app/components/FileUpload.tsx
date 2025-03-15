// File upload component

import React, { useState, useRef } from 'react';
import { loadFileAsSourceDocument, loadFileAsTemplate, saveDocumentToStorage, saveTemplateToStorage } from '~/lib/documents';

interface FileUploadProps {
  fileType: 'source' | 'template';
  onUploadComplete: (file: any) => void;
  multiple?: boolean;
}

export default function FileUpload({ fileType, onUploadComplete, multiple = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const processFiles = async (files: FileList) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const uploadedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (fileType === 'source') {
          const document = await loadFileAsSourceDocument(file);
          saveDocumentToStorage(document);
          uploadedFiles.push(document);
        } else {
          const template = await loadFileAsTemplate(file);
          saveTemplateToStorage(template);
          uploadedFiles.push(template);
        }
      }
      
      if (multiple) {
        onUploadComplete(uploadedFiles);
      } else {
        onUploadComplete(uploadedFiles[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while uploading the file');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };
  
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="mb-6">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple={multiple}
          accept={fileType === 'template' ? '.txt,.doc,.docx,.pdf' : '.txt,.doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx'}
        />
        
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <p className="mt-1">
            {isLoading ? (
              'Uploading...'
            ) : (
              <>
                <span className="font-medium text-blue-600 hover:underline">
                  {fileType === 'template' ? 'Upload template document' : 'Upload source materials'}
                </span>{' '}                or drag and drop
                {multiple ? " files " : " a file "}
                here
              </>
            )}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {fileType === 'template' ? 'Upload your template document in .txt, .doc, .docx, or .pdf format' : 'Upload source materials in various formats (.txt, .doc, .docx, .pdf, etc.)'}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
