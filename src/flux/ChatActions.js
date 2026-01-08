import Dispatcher from './Dispatcher';
import * as ChatActionTypes from './ChatActionTypes';

// Action Creators
export const ChatActions = {
  addMessage(message) {
    const action = {
      type: ChatActionTypes.ADD_MESSAGE,
      message: {
        id: Date.now() + Math.random(),
        content: message.content,
        role: message.role || 'user',
        timestamp: new Date().toISOString(),
        ...message
      }
    };
    Dispatcher.dispatch(action);
  },

  clearMessages() {
    Dispatcher.dispatch({
      type: ChatActionTypes.CLEAR_MESSAGES
    });
  },

  setTyping(isTyping) {
    Dispatcher.dispatch({
      type: ChatActionTypes.SET_TYPING,
      isTyping
    });
  },

  setError(error) {
    Dispatcher.dispatch({
      type: ChatActionTypes.SET_ERROR,
      error
    });
  },

  resetError() {
    Dispatcher.dispatch({
      type: ChatActionTypes.RESET_ERROR
    });
  },

  loadHistory(messages) {
    Dispatcher.dispatch({
      type: ChatActionTypes.LOAD_HISTORY,
      messages
    });
  },

  deleteMessage(messageId) {
    Dispatcher.dispatch({
      type: ChatActionTypes.DELETE_MESSAGE,
      messageId
    });
  },

  updateMessage(messageId, updates) {
    Dispatcher.dispatch({
      type: ChatActionTypes.UPDATE_MESSAGE,
      messageId,
      updates
    });
  },

  setSessionId(sessionId) {
    Dispatcher.dispatch({
      type: ChatActionTypes.SET_SESSION_ID,
      sessionId
    });
  }
};

export default ChatActions;
