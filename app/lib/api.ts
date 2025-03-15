// API Integration for OpenRouter

import { AIModelConfig } from "./types";
import { getConfig } from "./config";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

// Get the OpenRouter API key from the configuration
const getApiKey = (): string => {
  const config = getConfig();
  return config.apiKeys.openrouter;
};

export interface OpenRouterCompletionRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const isApiKeyConfigured = (): boolean => {
  const apiKey = getApiKey();
  return apiKey !== undefined && apiKey !== null && apiKey !== '';
};

export const getAvailableModels = async (): Promise<AIModelConfig[]> => {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.warn("API key not configured. Returning mock models.");
      return getMockModels();
    }
    
    const response = await fetch(`${OPENROUTER_API_URL}/models`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map the OpenRouter model format to our AIModelConfig
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      contextSize: model.context_length,
      capabilities: model.capabilities || [],
      costPerToken: model.pricing.prompt
    }));
  } catch (error) {
    console.error("Error fetching models:", error);
    
    // Return mock models if there's an error
    return getMockModels();
  }
};

// Provides mock models when the API key is not configured
const getMockModels = (): AIModelConfig[] => {
  return [
    {
      id: "anthropic/claude-3-opus",
      name: "Claude 3 Opus",
      provider: "Anthropic",
      contextSize: 200000,
      capabilities: ["writing", "analysis", "chat"],
      costPerToken: 0.00005
    },
    {
      id: "anthropic/claude-3-sonnet",
      name: "Claude 3 Sonnet",
      provider: "Anthropic",
      contextSize: 180000,
      capabilities: ["writing", "analysis", "chat"],
      costPerToken: 0.00003
    },
    {
      id: "openai/gpt-4o",
      name: "GPT-4o",
      provider: "OpenAI",
      contextSize: 128000,
      capabilities: ["writing", "analysis", "chat", "vision"],
      costPerToken: 0.00004
    }
  ];
};

export const generateCompletion = async (
  request: OpenRouterCompletionRequest
): Promise<OpenRouterCompletionResponse> => {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error("API key not configured. Please set your OpenRouter API key in the settings.");
    }
    
    const config = getConfig();
    
    // Apply default values from config if not specified in the request
    const finalRequest = {
      ...request,
      temperature: request.temperature ?? config.ai.temperature,
      max_tokens: request.max_tokens ?? config.ai.maxTokens
    };
    
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://investment-memo-generator.com", 
        "X-Title": "Investment Memorandum Generator"
      },
      body: JSON.stringify(finalRequest)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to generate completion: ${response.statusText}. Details: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating completion:", error);
    throw error;
  }
};

// Function to process a document with a large language model
export const processDocumentWithLLM = async (
  content: string,
  prompt: string,
  model: string = getConfig().ai.defaultModel
): Promise<string> => {
  const systemPrompt = `You are an expert investment memorandum analyst with 30+ years of experience in real estate investments and a Harvard MBA. 
Your writing style is professional, sophisticated, and persuasive.
You excel at analyzing investment opportunities and presenting them in a clear, compelling manner.
Your task is to carefully analyze the provided documents and extract or generate content as instructed.
Always maintain a formal, authoritative tone suitable for institutional investors.`;

  const request: OpenRouterCompletionRequest = {
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `${prompt}\n\nDocument content:\n${content}`
      }
    ],
    temperature: getConfig().ai.temperature,
    max_tokens: getConfig().ai.maxTokens
  };

  const response = await generateCompletion(request);
  return response.choices[0].message.content;
};

// Function to analyze document structure and extract key information
export const analyzeDocument = async (
  document: string,
  assetType: string
): Promise<Record<string, any>> => {
  try {
    const prompt = `
Analyze the following document related to a ${assetType} real estate investment. 
Extract key information including:

1. Property specifications (size, units, age, etc.)
2. Location details and market information
3. Financial metrics (NOI, cap rate, IRR projections)
4. Risk factors
5. Investment highlights
6. Tenant information (if applicable)

Format your response as structured JSON that can be easily parsed.
`;

    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.warn("API key not configured. Returning mock analysis.");
      return {
        propertySpecs: { size: "Unknown", units: "Unknown", age: "Unknown" },
        location: { address: "Unknown", market: "Unknown" },
        financials: { noi: "Unknown", capRate: "Unknown", irr: "Unknown" },
        risks: ["No risks identified due to missing API key"],
        highlights: ["No highlights identified due to missing API key"],
        tenants: []
      };
    }

    const result = await processDocumentWithLLM(document, prompt);
    
    try {
      // Try to parse the response as JSON
      return JSON.parse(result);
    } catch (parseError) {
      console.error("Failed to parse LLM response as JSON:", parseError);
      
      // If parsing fails, apply a more structured approach
      return extractStructuredData(result);
    }
  } catch (error) {
    console.error("Error analyzing document:", error);
    return {};
  }
};

// Helper function to extract structured data from unstructured text
const extractStructuredData = (text: string): Record<string, any> => {
  const sections: Record<string, any> = {
    propertySpecs: {},
    location: {},
    financials: {},
    risks: [],
    highlights: [],
    tenants: []
  };
  
  // Extract property specs
  const sizeMatch = text.match(/size:?\s*([^,\n]+)/i);
  if (sizeMatch) sections.propertySpecs.size = sizeMatch[1].trim();
  
  const unitsMatch = text.match(/units:?\s*([^,\n]+)/i);
  if (unitsMatch) sections.propertySpecs.units = unitsMatch[1].trim();
  
  // Extract financials
  const noiMatch = text.match(/noi:?\s*([^,\n]+)/i);
  if (noiMatch) sections.financials.noi = noiMatch[1].trim();
  
  const capRateMatch = text.match(/cap\s*rate:?\s*([^,\n%]+)/i);
  if (capRateMatch) sections.financials.capRate = capRateMatch[1].trim();
  
  // Extract risks and highlights as arrays
  const riskSection = text.match(/risks?:?\s*([^#]+)/i);
  if (riskSection) {
    sections.risks = riskSection[1]
      .split(/[•\-\*\d+\.]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  const highlightSection = text.match(/highlights?:?\s*([^#]+)/i);
  if (highlightSection) {
    sections.highlights = highlightSection[1]
      .split(/[•\-\*\d+\.]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  return sections;
};
