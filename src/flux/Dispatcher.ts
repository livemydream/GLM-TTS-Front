import type { ChatAction, DispatcherInterface } from '@/types';

// Simple EventEmitter implementation for browser
class EventEmitter {
  events: Record<string, Array<(...args: any[]) => void>> = {};

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }
}

class Dispatcher extends EventEmitter implements DispatcherInterface {
  private isDispatching: boolean = false;
  private actionHandlers: Array<(action: ChatAction) => void> = [];

  register(actionHandler: (action: ChatAction) => void): () => void {
    this.actionHandlers.push(actionHandler);
    return () => {
      this.actionHandlers = this.actionHandlers.filter(handler => handler !== actionHandler);
    };
  }

  dispatch(action: ChatAction): void {
    if (this.isDispatching) {
      throw new Error('Cannot dispatch in the middle of a dispatch');
    }

    this.isDispatching = true;
    try {
      this.actionHandlers.forEach(handler => handler(action));
      this.emit('dispatch', action);
    } finally {
      this.isDispatching = false;
    }
  }
}

export default new Dispatcher();
