import Dispatcher from './Dispatcher';
import * as ChatActionTypes from './ChatActionTypes';

// Simple EventEmitter implementation for browser
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }
}

class ChatStore extends EventEmitter {
  constructor() {
    super();
    this.messages = [];
    this.isTyping = false;
    this.error = null;
    this.sessionId = null;
    this.dispatchToken = Dispatcher.register(this.handleAction.bind(this));

    // 节流机制：减少频繁更新带来的闪烁
    this.pendingUpdate = null;
    this.rafId = null;
  }

  // 使用 requestAnimationFrame 进行节流更新
  scheduleEmit() {
    if (this.rafId) {
      return; // 已经有计划中的更新
    }
    this.rafId = requestAnimationFrame(() => {
      this.emit('change');
      this.rafId = null;
    });
  }

  // 立即发送更新（用于非流式更新的重要状态变化）
  immediateEmit() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.emit('change');
  }

  handleAction(action) {
    switch (action.type) {
      case ChatActionTypes.ADD_MESSAGE:
        this.messages.push(action.message);
        this.immediateEmit();
        break;

      case ChatActionTypes.CLEAR_MESSAGES:
        this.messages = [];
        this.immediateEmit();
        break;

      case ChatActionTypes.SET_TYPING:
        this.isTyping = action.isTyping;
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

      case ChatActionTypes.LOAD_HISTORY:
        this.messages = action.messages;
        this.immediateEmit();
        break;

      case ChatActionTypes.DELETE_MESSAGE:
        this.messages = this.messages.filter(msg => msg.id !== action.messageId);
        this.immediateEmit();
        break;

      case ChatActionTypes.UPDATE_MESSAGE:
        const wasStreaming = this.messages.find(m => m.id === action.messageId)?.isStreaming;
        this.messages = this.messages.map(msg =>
          msg.id === action.messageId ? {
            ...msg,
            ...action.updates,
          } : msg
        );
        // 如果之前是流式状态，现在结束了，需要立即更新
        const isStreaming = action.updates.isStreaming;
        if (wasStreaming && !isStreaming) {
          this.immediateEmit();
        } else {
          // 流式更新期间使用节流，减少闪烁
          this.scheduleEmit();
        }
        break;

      case ChatActionTypes.SET_SESSION_ID:
        this.sessionId = action.sessionId;
        this.immediateEmit();
        break;

      default:
        // Do nothing for unknown actions
        break;
    }
  }

  getMessages() {
    return this.messages;
  }

  getTyping() {
    return this.isTyping;
  }

  getError() {
    return this.error;
  }

  getSessionId() {
    return this.sessionId;
  }

  addChangeListener(callback) {
    return this.on('change', callback);
  }

  removeChangeListener(callback) {
    this.off('change', callback);
  }
}

export default new ChatStore();
