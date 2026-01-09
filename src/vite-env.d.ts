/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_API_KEY?: string;
  readonly VITE_APP_TITLE?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_CHAT_TIMEOUT?: string;
  readonly VITE_MAX_MESSAGE_LENGTH?: string;
  readonly VITE_ENABLE_SOUND?: string;
  readonly VITE_ENABLE_TYPING_INDICATOR?: string;
  readonly VITE_ENABLE_MESSAGE_DELETION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
