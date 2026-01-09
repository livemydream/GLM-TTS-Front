import Dispatcher from './Dispatcher';
import * as ChatActionTypes from './ChatActionTypes';
import type { Message, ChatAction } from '@/types';

interface AddMessageInput {
  content: string;
  role?: 'user' | 'assistant';
  timestamp?: string;
  id?: number;
  isStreaming?: boolean;
}

// Action Creators
export const ChatActions = {
  addMessage(message: AddMessageInput): void {
    const action: ChatAction = {
      type: ChatActionTypes.ADD_MESSAGE,
      message: {
        ...message,
        id: message.id ?? Date.now() + Math.random(),
        content: message.content,
        role: message.role || 'user',
        timestamp: message.timestamp || new Date().toISOString(),
      } as Message
    };
    Dispatcher.dispatch(action);
  },

  clearMessages(): void {
    const action: ChatAction = {
      type: ChatActionTypes.CLEAR_MESSAGES
    };
    Dispatcher.dispatch(action);
  },

  setTyping(isTyping: boolean): void {
    const action: ChatAction = {
      type: ChatActionTypes.SET_TYPING,
      isTyping
    };
    Dispatcher.dispatch(action);
  },

  setError(error: string | null): void {
    const action: ChatAction = {
      type: ChatActionTypes.SET_ERROR,
      error
    };
    Dispatcher.dispatch(action);
  },

  resetError(): void {
    const action: ChatAction = {
      type: ChatActionTypes.RESET_ERROR
    };
    Dispatcher.dispatch(action);
  },

  loadHistory(messages: Message[]): void {
    const action: ChatAction = {
      type: ChatActionTypes.LOAD_HISTORY,
      messages
    };
    Dispatcher.dispatch(action);
  },

  deleteMessage(messageId: number): void {
    const action: ChatAction = {
      type: ChatActionTypes.DELETE_MESSAGE,
      messageId
    };
    Dispatcher.dispatch(action);
  },

  updateMessage(messageId: number, updates: Partial<Message>): void {
    const action: ChatAction = {
      type: ChatActionTypes.UPDATE_MESSAGE,
      messageId,
      updates
    };
    Dispatcher.dispatch(action);
  },

  setSessionId(sessionId: string | null): void {
    const action: ChatAction = {
      type: ChatActionTypes.SET_SESSION_ID,
      sessionId
    };
    Dispatcher.dispatch(action);
  }
};

export default ChatActions;
