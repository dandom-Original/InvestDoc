// Progress bar component for tracking generation progress

import React from 'react';

interface ProgressBarProps {
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export default function ProgressBar({ progress, status, error }: ProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'queued':
        return 'Queued';
      case 'processing':
        return `Processing (${Math.round(progress)}%)`;
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
        {progress > 0 && progress < 100 && (
          <span className="text-sm font-medium text-gray-500">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getStatusColor()} transition-all duration-500 ease-in-out`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {error && (
        <div className="text-sm text-red-600 mt-1">
          {error}
        </div>
      )}
    </div>
  );
}
