// Environment configuration
export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws',
  apiKey: import.meta.env.VITE_API_KEY,

  // Application
  appTitle: import.meta.env.VITE_APP_TITLE || 'AI Chat Assistant',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',

  // Chat Settings
  chatTimeout: parseInt(import.meta.env.VITE_CHAT_TIMEOUT || '30000'),
  maxMessageLength: parseInt(import.meta.env.VITE_MAX_MESSAGE_LENGTH || '5000'),

  // Features
  enableSound: import.meta.env.VITE_ENABLE_SOUND === 'true',
  enableTypingIndicator: import.meta.env.VITE_ENABLE_TYPING_INDICATOR !== 'false',
  enableMessageDeletion: import.meta.env.VITE_ENABLE_MESSAGE_DELETION !== 'false',

  // Helpers
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;
