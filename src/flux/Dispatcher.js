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

class Dispatcher extends EventEmitter {
  constructor() {
    super();
    this.isDispatching = false;
    this.actionHandlers = [];
  }

  register(actionHandler) {
    this.actionHandlers.push(actionHandler);
    return () => {
      this.actionHandlers = this.actionHandlers.filter(handler => handler !== actionHandler);
    };
  }

  dispatch(action) {
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

  waitFor(promise) {
    return promise;
  }
}

export default new Dispatcher();
