import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { Input, Button, Avatar, Tag, message as antMessage, Tooltip, Switch, Space } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, ClearOutlined, DeleteOutlined, ThunderboltOutlined, PlusOutlined } from '@ant-design/icons';
import ChatStore from '@/flux/ChatStore';
import ChatActions from '@/flux/ChatActions';
import ChatActionCreators from '@/flux/ChatActionCreators';
import MarkdownRenderer from './MarkdownRenderer';
import './ChatWindow.css';

const { TextArea } = Input;

// 使用 memo 优化的消息项组件
const MessageItem = memo(({ msg, onDelete, formatTime }) => {
  const content = useMemo(() => {
    if (msg.role === 'assistant') {
      if (msg.isStreaming) {
        return <div className="message-text streaming-text">{msg.content || '...'}</div>;
      }
      return <MarkdownRenderer content={msg.content || '...'} />;
    }
    return <div className="message-text">{msg.content || '...'}</div>;
  }, [msg.role, msg.isStreaming, msg.content]);

  return (
    <div
      key={msg.id}
      className={`message ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}
    >
      <div className="message-content-wrapper">
        <Avatar
          icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
          className={msg.role === 'user' ? 'avatar-user' : 'avatar-assistant'}
        />
        <div className="message-wrapper">
          <div className="message-bubble">
            {content}
            <div className="message-time">{formatTime(msg.timestamp)}</div>
          </div>
          <Tooltip title="删除消息">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onDelete(msg.id)}
              className="delete-message-button"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：只在关键属性变化时重新渲染
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.content === nextProps.msg.content &&
    prevProps.msg.isStreaming === nextProps.msg.isStreaming &&
    prevProps.msg.role === nextProps.msg.role
  );
});

MessageItem.displayName = 'MessageItem';

// SessionId 管理
const SESSION_STORAGE_KEY = 'glm_chat_session_id';

const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
};

const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
};

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [useStream, setUseStream] = useState(true);
  const messagesEndRef = useRef(null);

  // 初始化 SessionId 并加载历史记录
  useEffect(() => {
    const id = getOrCreateSessionId();
    setSessionId(id);
    ChatActions.setSessionId(id);

    // 加载历史记录
    ChatActionCreators.loadHistory(id)();
  }, []);

  // Load chat state from store
  useEffect(() => {
    const loadState = () => {
      const storeMessages = [...ChatStore.getMessages()];
      setMessages(storeMessages);
      setIsTyping(ChatStore.getTyping());
      setError(ChatStore.getError());
    };

    loadState();
    const unsubscribe = ChatStore.addChangeListener(loadState);

    return () => {
      unsubscribe();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) {
      return;
    }

    const message = inputValue.trim();
    setInputValue('');
    setError(null);

    try {
      if (useStream) {
        // 使用流式聊天
        ChatActionCreators.sendMessageStream(sessionId, message)();
      } else {
        // 使用普通聊天
        await ChatActionCreators.sendMessage(sessionId, message)();
      }
    } catch (err) {
      setError(err.message || '发送消息失败');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    if (sessionId) {
      try {
        await ChatActionCreators.clearHistory(sessionId)();
        antMessage.success('对话已清空');
      } catch (err) {
        setError(err.message || '清空对话失败');
      }
    } else {
      ChatActions.clearMessages();
      antMessage.success('对话已清空');
    }
  };

  const handleNewChat = () => {
    // 清空消息
    ChatActions.clearMessages();

    // 生成新的 SessionId
    const newSessionId = generateSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
    setSessionId(newSessionId);
    ChatActions.setSessionId(newSessionId);

    antMessage.success('已创建新对话');
  };

  const handleDeleteMessage = (messageId) => {
    ChatActions.deleteMessage(messageId);
    antMessage.success('消息已删除');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <RobotOutlined className="chat-icon" />
          <div>
            <h3>AI 智能助手</h3>
            <div className="chat-header-controls">
              <span className="chat-status">
                {isTyping ? (
                  <span className="typing-indicator">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                    正在输入...
                  </span>
                ) : (
                  '在线'
                )}
              </span>
              <Tooltip title={useStream ? '流式回复：实时显示生成内容' : '普通回复：等待完整回复'}>
                <div className="stream-toggle">
                  <ThunderboltOutlined />
                  <span className="stream-label">流式</span>
                  <Switch
                    size="small"
                    checked={useStream}
                    onChange={setUseStream}
                  />
                </div>
              </Tooltip>
            </div>
          </div>
        </div>
        <Space>
          <Tooltip title="新建对话（生成新会话ID）">
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={handleNewChat}
              className="new-chat-button"
            />
          </Tooltip>
          <Tooltip title="清空对话">
            <Button
              type="text"
              icon={<ClearOutlined />}
              onClick={handleClear}
              className="clear-button"
            />
          </Tooltip>
        </Space>
      </div>

      {/* Error Message */}
      {error && (
        <div className="chat-error">
          <Tag
            color="error"
            closable
            onClose={() => ChatActions.resetError()}
          >
            错误: {error}
          </Tag>
        </div>
      )}

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <RobotOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
            <p>开始对话吧！</p>
            <p className="empty-hint">输入消息并按 Enter 发送</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              msg={msg}
              onDelete={handleDeleteMessage}
              formatTime={formatTime}
            />
          ))
        )}
        {isTyping && (
          <div className="message message-assistant">
            <div className="message-content-wrapper">
              <Avatar
                icon={<RobotOutlined />}
                className="avatar-assistant"
              />
              <div className="message-bubble message-bubble-typing">
                <div className="typing-indicator-inline">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="input-wrapper">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="chat-input"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="send-button"
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
