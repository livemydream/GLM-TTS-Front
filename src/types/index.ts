// 消息角色类型
export type MessageRole = 'user' | 'assistant' | 'system';

// 角色预设类型
export interface PresetRole {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon?: string;
}

// 角色模式类型
export type RolePlayMode = 'none' | 'preset' | 'custom';

// 角色配置
export interface RoleConfig {
  mode: RolePlayMode;
  presetRole?: PresetRole;
  customPrompt?: string;
}

// 消息类型
export interface Message {
  id: number;
  content: string;
  role: MessageRole;
  timestamp?: string;
  isStreaming?: boolean;
  _version?: number;
}

// Action 类型
export interface AddMessageAction {
  type: 'ADD_MESSAGE';
  message: Message;
}

export interface UpdateMessageAction {
  type: 'UPDATE_MESSAGE';
  messageId: number;
  updates: Partial<Message>;
}

export interface DeleteMessageAction {
  type: 'DELETE_MESSAGE';
  messageId: number;
}

export interface ClearMessagesAction {
  type: 'CLEAR_MESSAGES';
}

export interface SetTypingAction {
  type: 'SET_TYPING';
  isTyping: boolean;
}

export interface SetErrorAction {
  type: 'SET_ERROR';
  error: string | null;
}

export interface ResetErrorAction {
  type: 'RESET_ERROR';
}

export interface SetSessionIdAction {
  type: 'SET_SESSION_ID';
  sessionId: string | null;
}

export interface LoadHistoryAction {
  type: 'LOAD_HISTORY';
  messages: Message[];
}

export interface SetRoleConfigAction {
  type: 'SET_ROLE_CONFIG';
  roleConfig: RoleConfig;
}

export type ChatAction =
  | AddMessageAction
  | UpdateMessageAction
  | DeleteMessageAction
  | ClearMessagesAction
  | SetTypingAction
  | SetErrorAction
  | ResetErrorAction
  | SetSessionIdAction
  | LoadHistoryAction
  | SetRoleConfigAction;

// API 响应类型
export interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  data: T;
}

// API 返回的角色信息
export interface CharacterInfo {
  characterId: string;
  characterDescription: string;
}

export interface ChatHistoryResponse {
  sessionId: string;
  history: HistoryItem[];
  character?: CharacterInfo;
}

export interface HistoryItem {
  role: MessageRole;
  content: string;
  timestamp: number | null;
}

// Store 类型
export interface ChatStoreInterface {
  getMessages(): Message[];
  getTyping(): boolean;
  getError(): string | null;
  getSessionId(): string | null;
  getRoleConfig(): RoleConfig;
  addChangeListener(callback: () => void): () => void;
}

// Dispatcher 类型
export interface DispatcherInterface {
  register(callback: (action: ChatAction) => void): void;
  dispatch(action: ChatAction): void;
}

// API 回调类型
export type StreamCallback = (chunk: string) => void;
export type StreamCompleteCallback = () => void;
export type StreamErrorCallback = (error: Error) => void;
