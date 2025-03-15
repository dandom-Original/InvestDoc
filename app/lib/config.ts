// Configuration management for the application

// Get environment variables with fallbacks
export const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  // For client-side, try to get from local storage
  const localConfig = getLocalConfig();
  return localConfig[key] || defaultValue;
};

// Local storage for configuration
interface LocalConfig {
  [key: string]: string;
}

export const getLocalConfig = (): LocalConfig => {
  try {
    const configStr = localStorage.getItem('appConfig');
    return configStr ? JSON.parse(configStr) : {};
  } catch (error) {
    console.warn('Failed to read local config:', error);
    return {};
  }
};

export const setLocalConfig = (config: LocalConfig): void => {
  try {
    const existingConfig = getLocalConfig();
    const updatedConfig = { ...existingConfig, ...config };
    localStorage.setItem('appConfig', JSON.stringify(updatedConfig));
  } catch (error) {
    console.error('Failed to save local config:', error);
  }
};

// Default configuration values
export const defaultConfig = {
  apiKeys: {
    openrouter: getEnvVar('OPENROUTER_API_KEY', ''),
  },
  ai: {
    defaultModel: getEnvVar('DEFAULT_AI_MODEL', 'anthropic/claude-3-opus'),
    temperature: parseFloat(getEnvVar('DEFAULT_TEMPERATURE', '0.3')),
    maxTokens: parseInt(getEnvVar('MAX_TOKENS', '4000')),
  },
  app: {
    name: getEnvVar('APP_NAME', 'InvestDoc AI'),
    environment: getEnvVar('APP_ENV', 'development'),
  },
};

// Get current active configuration (combines env vars and local config)
export const getConfig = (): typeof defaultConfig => {
  const localConfig = getLocalConfig();
  
  return {
    apiKeys: {
      openrouter: localConfig.OPENROUTER_API_KEY || defaultConfig.apiKeys.openrouter,
    },
    ai: {
      defaultModel: localConfig.DEFAULT_AI_MODEL || defaultConfig.ai.defaultModel,
      temperature: localConfig.DEFAULT_TEMPERATURE 
        ? parseFloat(localConfig.DEFAULT_TEMPERATURE) 
        : defaultConfig.ai.temperature,
      maxTokens: localConfig.MAX_TOKENS 
        ? parseInt(localConfig.MAX_TOKENS) 
        : defaultConfig.ai.maxTokens,
    },
    app: {
      name: localConfig.APP_NAME || defaultConfig.app.name,
      environment: localConfig.APP_ENV || defaultConfig.app.environment,
    },
  };
};

// Save configuration values to local storage
export const saveApiKey = (key: string, value: string): void => {
  setLocalConfig({ [key]: value });
};

// Save multiple configuration values at once
export const saveConfig = (config: Record<string, string>): void => {
  setLocalConfig(config);
};
