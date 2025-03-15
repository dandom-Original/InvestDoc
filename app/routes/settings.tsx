// Settings page for API configuration

import React from 'react';
import type { MetaFunction } from '@remix-run/node';
import Navigation from '~/components/Navigation';
import ConfigurationPanel from '~/components/ConfigurationPanel';

export const meta: MetaFunction = () => {
  return [
    { title: "InvestDoc AI - Settings" },
    { name: "description", content: "Configure API keys and application settings" },
  ];
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Settings
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Configure your API keys and application settings.
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <ConfigurationPanel />
          </div>
          
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">API Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                About the APIs used in this application.
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">OpenRouter</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    OpenRouter provides access to cutting-edge AI models from different providers through a single API.
                    <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="ml-2 text-blue-600 hover:text-blue-800">
                      Learn more
                    </a>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">API Key</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    Your API key is stored locally in your browser and is not transmitted to our servers.
                    It is used only to make requests to the OpenRouter API.
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Cost</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    Usage of the OpenRouter API incurs costs based on the models used, number of tokens processed, and other factors.
                    You can find pricing details on the 
                    <a href="https://openrouter.ai/pricing" target="_blank" rel="noreferrer" className="ml-1 text-blue-600 hover:text-blue-800">
                      OpenRouter pricing page
                    </a>.
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Models</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    We recommend using Claude 3 Opus or GPT-4o for the best results, as these models have the strongest capabilities
                    for complex document analysis and generation tasks.
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
