// Configuration panel for API keys and application settings

import React, { useState, useEffect } from 'react';
import { getConfig, saveApiKey, saveConfig } from '~/lib/config';
import { isApiKeyConfigured, getAvailableModels } from '~/lib/api';
import { AIModelConfig } from '~/lib/types';

export default function ConfigurationPanel() {
  const [apiKey, setApiKey] = useState('');
  const [isKeyConfigured, setIsKeyConfigured] = useState(false);
  const [isApiTested, setIsApiTested] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(4000);
  
  useEffect(() => {
    // Check if the API key is configured
    const isConfigured = isApiKeyConfigured();
    setIsKeyConfigured(isConfigured);
    
    // Get current config values
    const config = getConfig();
    
    // Only show masked key if it's already set
    if (isConfigured) {
      setApiKey('●●●●●●●●●●●●●●●●●●●●'); 
    }
    
    setSelectedModel(config.ai.defaultModel);
    setTemperature(config.ai.temperature);
    setMaxTokens(config.ai.maxTokens);
    
    // If API key is configured, fetch available models
    if (isConfigured) {
      fetchModels();
    }
  }, []);
  
  const fetchModels = async () => {
    try {
      const models = await getAvailableModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };
  
  const handleSaveApiKey = () => {
    if (!apiKey || apiKey === '●●●●●●●●●●●●●●●●●●●●') {
      return;
    }
    
    saveApiKey('OPENROUTER_API_KEY', apiKey);
    setApiKey('●●●●●●●●●●●●●●●●●●●●');
    setIsKeyConfigured(true);
    setIsApiTested(false);
    setTestResult(null);
    
    // Fetch models with the new API key
    fetchModels();
  };
  
  const handleClearApiKey = () => {
    saveApiKey('OPENROUTER_API_KEY', '');
    setApiKey('');
    setIsKeyConfigured(false);
    setIsApiTested(false);
    setTestResult(null);
  };
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setIsApiTested(false);
    setTestResult(null);
  };
  
  const handleTestApiKey = async () => {
    if (apiKey && apiKey !== '●●●●●●●●●●●●●●●●●●●●') {
      saveApiKey('OPENROUTER_API_KEY', apiKey);
      setApiKey('●●●●●●●●●●●●●●●●●●●●');
      setIsKeyConfigured(true);
    }
    
    setIsTesting(true);
    
    try {
      const models = await getAvailableModels();
      setAvailableModels(models);
      setTestResult('success');
      setTestMessage(`Successfully connected to OpenRouter API. ${models.length} models available.`);
      setIsApiTested(true);
    } catch (error) {
      setTestResult('error');
      setTestMessage(error instanceof Error ? error.message : String(error));
      setIsApiTested(true);
    } finally {
      setIsTesting(false);
    }
  };
  
  const handleSaveSettings = () => {
    saveConfig({
      'DEFAULT_AI_MODEL': selectedModel,
      'DEFAULT_TEMPERATURE': temperature.toString(),
      'MAX_TOKENS': maxTokens.toString()
    });
    
    // Show success message
    setTestResult('success');
    setTestMessage('Settings saved successfully.');
    setTimeout(() => {
      setTestResult(null);
      setTestMessage('');
    }, 3000);
  };
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">API Configuration</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Configure API keys and settings for the AI-powered content generation.
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              OpenRouter API Key
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type={showKey ? "text" : "password"}
                name="apiKey"
                id="apiKey"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
                placeholder="Enter your OpenRouter API key"
                value={apiKey}
                onChange={handleApiKeyChange}
              />
              <button
                type="button"
                className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">OpenRouter</a>.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            {isKeyConfigured && (
              <button
                type="button"
                onClick={handleClearApiKey}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Key
              </button>
            )}
            
            <button
              type="button"
              onClick={handleTestApiKey}
              disabled={isTesting}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button
              type="button"
              onClick={handleSaveApiKey}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save API Key
            </button>
          </div>
          
          {isApiTested && (
            <div className={`mt-2 p-2 rounded ${testResult === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {testMessage}
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-5">
            <h4 className="text-md font-medium text-gray-900">AI Generation Settings</h4>
          </div>
          
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              Default AI Model
            </label>
            <select
              id="model"
              name="model"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {availableModels.length === 0 ? (
                <option value="">No models available</option>
              ) : (
                availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
              Temperature: {temperature}
            </label>
            <input
              type="range"
              id="temperature"
              name="temperature"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="mt-1 block w-full"
            />
            <p className="mt-1 text-sm text-gray-500">
              Lower values produce more consistent outputs, higher values more creative ones.
            </p>
          </div>
          
          <div>
            <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700">
              Maximum Tokens
            </label>
            <input
              type="number"
              id="maxTokens"
              name="maxTokens"
              min="1000"
              max="16000"
              step="1000"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum length of generated content per section.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveSettings}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
