import Dispatcher from './Dispatcher';
import * as ChatActionTypes from './ChatActionTypes';
import type { ChatAction, ChatStoreInterface, Message } from '@/types';

class EventEmitter {
  private events: Record<string, Array<() => void>> = {};

  on(event: string, cb: () => void): () => void {
    this.events[event] ||= [];
    this.events[event].push(cb);
    return () => this.off(event, cb);
  }

  off(event: string, cb: () => void): void {
    this.events[event] = (this.events[event] || []).filter(x => x !== cb);
  }

  emit(event: string): void {
    (this.events[event] || []).forEach(cb => cb());
  }
}

class ChatStore extends EventEmitter implements ChatStoreInterface {
  private messages: Message[] = [];
  private isTyping: boolean = false;
  private error: string | null = null;
  private sessionId: string | null = null;
  private rafId: number | null = null;

  constructor() {
    super();
    Dispatcher.register(this.handleAction.bind(this));
  }

  scheduleEmit(): void {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.emit('change');
      this.rafId = null;
    });
  }

  immediateEmit(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.emit('change');
  }

  handleAction(action: ChatAction): void {
    switch (action.type) {
      case ChatActionTypes.ADD_MESSAGE:
        this.messages.push(action.message);
        this.immediateEmit();
        break;
      

      case ChatActionTypes.UPDATE_MESSAGE: {
        const index = this.messages.findIndex(m => m.id === action.messageId);
        if (index === -1) {
          console.log('[ChatStore UPDATE_MESSAGE] Message not found, id:', action.messageId);
          break;
        }

        const prev = this.messages[index];
        const wasStreaming = prev.isStreaming;

        // 🔥 关键：原地更新 message，添加新引用确保触发更新
        this.messages[index] = {
          ...prev,
          ...action.updates,
          _version: Date.now() + Math.random(), // 确保每次更新引用都改变
        };

        const isStreaming = this.messages[index].isStreaming;
        console.log('[ChatStore UPDATE_MESSAGE] content:', this.messages[index].content.substring(0, 20) + '...', 'isStreaming:', isStreaming);

        if (wasStreaming && !isStreaming) {
          // streaming → done
          this.immediateEmit();
        } else {
          // streaming 中，立即触发更新以显示动效
          this.immediateEmit();
        }
        break;
      }

      case ChatActionTypes.SET_TYPING:
        this.isTyping = action.isTyping;
        this.immediateEmit();
        break;

      case ChatActionTypes.CLEAR_MESSAGES:
        this.messages = [];
        this.immediateEmit();
        break;

      case ChatActionTypes.DELETE_MESSAGE:
        this.messages = this.messages.filter(m => m.id !== action.messageId);
        this.immediateEmit();
        break;

      case ChatActionTypes.SET_ERROR:
        this.error = action.error;
        this.immediateEmit();
        break;

      case ChatActionTypes.RESET_ERROR:
        this.error = null;
        this.immediateEmit();
        break;

      case ChatActionTypes.SET_SESSION_ID:
        this.sessionId = action.sessionId;
        this.immediateEmit();
        break;

      case ChatActionTypes.LOAD_HISTORY:
        this.messages = action.messages || [];
        this.immediateEmit();
        break;

      default:
        break;
    }
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getTyping(): boolean {
    return this.isTyping;
  }

  getError(): string | null {
    return this.error;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  addChangeListener(cb: () => void): () => void {
    return this.on('change', cb);
  }
}

export default new ChatStore();
