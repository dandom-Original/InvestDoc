// Form for collecting asset metadata

import React, { useState } from 'react';
import { ContentMetadata } from '~/lib/types';

interface MetadataFormProps {
  onSubmit: (metadata: ContentMetadata) => void;
  initialData?: Partial<ContentMetadata>;
}

export default function MetadataForm({ onSubmit, initialData = {} }: MetadataFormProps) {
  const [formData, setFormData] = useState<Partial<ContentMetadata>>({
    assetName: '',
    assetType: '',
    location: '',
    client: '',
    date: new Date().toISOString().split('T')[0],
    otherProperties: {},
    ...initialData
  });
  
  const [additionalFields, setAdditionalFields] = useState<Array<{ key: string; value: string }>>([]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAdditionalFieldChange = (index: number, field: 'key' | 'value', value: string) => {
    const newFields = [...additionalFields];
    newFields[index][field] = value;
    setAdditionalFields(newFields);
  };
  
  const addField = () => {
    setAdditionalFields([...additionalFields, { key: '', value: '' }]);
  };
  
  const removeField = (index: number) => {
    const newFields = [...additionalFields];
    newFields.splice(index, 1);
    setAdditionalFields(newFields);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add additional fields to otherProperties
    const otherProperties: Record<string, any> = { ...formData.otherProperties };
    additionalFields.forEach(field => {
      if (field.key && field.value) {
        otherProperties[field.key] = field.value;
      }
    });
    
    onSubmit({
      ...formData as ContentMetadata,
      otherProperties
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="assetName" className="block text-sm font-medium text-gray-700">
            Asset Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="assetName"
            id="assetName"
            required
            value={formData.assetName}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="assetType" className="block text-sm font-medium text-gray-700">
            Asset Type <span className="text-red-500">*</span>
          </label>
          <select
            name="assetType"
            id="assetType"
            required
            value={formData.assetType}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select an asset type</option>
            <option value="Office">Office</option>
            <option value="Retail">Retail</option>
            <option value="Industrial">Industrial</option>
            <option value="Multifamily">Multifamily</option>
            <option value="Hotel">Hotel</option>
            <option value="Mixed-Use">Mixed-Use</option>
            <option value="Land">Land</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="location"
            id="location"
            required
            value={formData.location}
            onChange={handleChange}
            placeholder="City, State, Country"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700">
            Client <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="client"
            id="client"
            required
            value={formData.client}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="date"
            id="date"
            required
            value={formData.date}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900">Additional Properties</h3>
        
        {additionalFields.map((field, index) => (
          <div key={index} className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <input
                type="text"
                value={field.key}
                onChange={(e) => handleAdditionalFieldChange(index, 'key', e.target.value)}
                placeholder="Property name"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-5">
              <input
                type="text"
                value={field.value}
                onChange={(e) => handleAdditionalFieldChange(index, 'value', e.target.value)}
                placeholder="Value"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => removeField(index)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addField}
          className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Field
        </button>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Continue
        </button>
      </div>
    </form>
  );
}
