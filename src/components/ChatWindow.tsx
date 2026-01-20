import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Avatar, Tag, message as antMessage, Tooltip, Switch, Space, Badge } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, ClearOutlined, DeleteOutlined, ThunderboltOutlined, PlusOutlined, UserSwitchOutlined } from '@ant-design/icons';
import ChatStore from '@/flux/ChatStore';
import ChatActions from '@/flux/ChatActions';
import ChatActionCreators from '@/flux/ChatActionCreators';
import MarkdownRenderer from './MarkdownRenderer';
import RoleSelector from './RoleSelector';
import { getRoleIcon } from '@/utils/roleUtils';
import type { Message, RoleConfig } from '@/types';
import './ChatWindow.css';

const { TextArea } = Input;

// 消息项组件 Props
interface MessageItemProps {
  msg: Message;
  onDelete: (messageId: number) => void;
  formatTime: (timestamp?: string) => string;
  roleConfig: RoleConfig;
}

// 消息项组件
const MessageItem = React.memo<MessageItemProps>(
  ({ msg, onDelete, formatTime, roleConfig }) => {
    const isAssistant = msg.role === 'assistant';

    // console.log('[MessageItem render] id:', msg.id, 'content:', msg.content.substring(0, 20) + '...', 'isStreaming:', msg.isStreaming);

    // 根据角色配置获取 AI 头像
    const getAssistantAvatar = () => {
      const roleIcon = getRoleIcon(roleConfig);
      return <span style={{ fontSize: '24px' }}>{roleIcon}</span>;
    };

    return (
      <div className={`message ${isAssistant ? 'message-assistant' : 'message-user'}`}>
        <div className="message-content-wrapper">
          <Avatar
            size={40}
            icon={isAssistant ? getAssistantAvatar() : <UserOutlined />}
            className={isAssistant ? 'avatar-assistant' : 'avatar-user'}
          />

          <div className="message-wrapper">
            <div className="message-bubble">
              {isAssistant ? (
                msg.isStreaming ? (
                  <pre className="streaming-text">
                    {msg.content || '...'}
                  </pre>
                ) : (
                  <MarkdownRenderer content={msg.content || '...'} />
                )
              ) : (
                <div className="message-text">{msg.content}</div>
              )}

              <div className="message-time">
                {formatTime(msg.timestamp)}
              </div>
            </div>
            <Tooltip title="删除消息">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onDelete(msg.id)}
              />
            </Tooltip>
          </div>
        </div>
      </div>
    );
  },
  // 🔥 比较 content 和 isStreaming，而不是整个引用
  (prev, next) =>
    prev.msg.content === next.msg.content &&
    prev.msg.isStreaming === next.msg.isStreaming
);

MessageItem.displayName = 'MessageItem';

const generateSessionId = (): string => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
};

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [useStream, setUseStream] = useState(true);
  const [roleConfig, setRoleConfig] = useState<RoleConfig>(ChatStore.getRoleConfig());
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const hasScrolledToBottom = useRef(false);

  // 初始化 SessionId 并加载历史记录
  useEffect(() => {
    const storedSessionId = ChatStore.getSessionId();
    if (storedSessionId) {
      // 从 store 恢复的 sessionId
      setSessionId(storedSessionId);
      // 加载历史记录
      ChatActionCreators.loadHistory(storedSessionId)();
    } else {
      // 生成新的 sessionId
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      ChatActions.setSessionId(newSessionId);
    }
  }, []);

  // Load chat state from store
  useEffect(() => {
    const loadState = () => {
      const storeMessages = ChatStore.getMessages();
      // console.log('[loadState] messages count:', storeMessages.length);
      const lastMsg = storeMessages[storeMessages.length - 1];
      // console.log('[loadState] last message:', lastMsg);
      // console.log('[loadState] last message isStreaming:', lastMsg?.isStreaming);

      // 🔥 创建新数组和新对象引用，确保 React 检测到变化
      setMessages(storeMessages.map(msg => ({ ...msg })));
      setIsTyping(ChatStore.getTyping());
      setError(ChatStore.getError());
      setRoleConfig(ChatStore.getRoleConfig());
      setSessionId(ChatStore.getSessionId());
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
    if (messages.length > 0) {
      if (!hasScrolledToBottom.current) {
        // 首次加载，立即滚动到底部（无动画）
        setTimeout(() => {
          if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            hasScrolledToBottom.current = true;
          }
        }, 100);
      } else {
        // 后续更新，平滑滚动
        scrollToBottom();
      }
    }
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
      setError((err as Error).message || '发送消息失败');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        setError((err as Error).message || '清空对话失败');
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
    setSessionId(newSessionId);
    ChatActions.setSessionId(newSessionId);

    antMessage.success('已创建新对话');
  };

  const handleDeleteMessage = (messageId: number) => {
    ChatActions.deleteMessage(messageId);
    antMessage.success('消息已删除');
  };

  const handleRoleConfigConfirm = async (config: RoleConfig) => {
    const roleName = config.mode === 'preset'
      ? config.presetRole?.name
      : config.mode === 'custom'
      ? '自定义'
      : null;

    // 如果选择了角色，调用 /api/glm/character 接口设置角色
    if (config.mode !== 'none') {
      try {
        const characterId = config.mode === 'preset'
          ? config.presetRole?.id
          : 'custom';

        const characterDescription = config.mode === 'preset'
          ? config.presetRole?.systemPrompt
          : config.customPrompt;

        if (characterDescription && sessionId && characterId) {
          await ChatActionCreators.setCharacter(sessionId, characterId, characterDescription)();

          // 接口调用成功后，更新状态并清除本地消息历史
          ChatActions.setRoleConfig(config);
          ChatActions.clearMessages();
          antMessage.success(`已切换到 ${roleName} 角色`);
        } else if (!sessionId) {
          antMessage.error('会话ID不存在，请刷新页面重试');
        }
      } catch (err) {
        antMessage.error('设置角色失败');
        // 失败时恢复为无角色模式
        ChatActions.setRoleConfig({ mode: 'none' });
      }
    } else {
      // 切换到普通模式，只更新状态
      ChatActions.setRoleConfig(config);
      antMessage.success('已切换到普通模式');
    }
  };

  const formatTime = (timestamp?: string): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-icon">{getRoleIcon(roleConfig)}</span>
          <div>
            <h3>
              AI 智能助手
              {roleConfig.mode !== 'none' && (
                <Tag
                  color={roleConfig.mode === 'preset' ? 'blue' : 'green'}
                  style={{ marginLeft: 8, verticalAlign: 'middle' }}
                >
                  {roleConfig.mode === 'preset'
                    ? `${roleConfig.presetRole?.icon} ${roleConfig.presetRole?.name}`
                    : '自定义角色'}
                </Tag>
              )}
            </h3>
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
          <Tooltip title="角色扮演设置">
            <Badge dot={roleConfig.mode !== 'none'}>
              <Button
                type="text"
                icon={<UserSwitchOutlined />}
                onClick={() => setShowRoleSelector(true)}
                className="role-selector-button"
              />
            </Badge>
          </Tooltip>
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
      <div className="chat-messages" ref={chatMessagesRef}>
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
              roleConfig={roleConfig}
            />
          ))
        )}
        {isTyping && !messages.some(m => m.isStreaming) && (
          <div className="message message-assistant">
            <div className="message-content-wrapper">
              <Avatar
                size={40}
                icon={<span style={{ fontSize: '24px' }}>{getRoleIcon(roleConfig)}</span>}
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
            placeholder={roleConfig.mode !== 'none'
              ? `与 ${roleConfig.mode === 'preset' ? roleConfig.presetRole?.name : '自定义角色'} 对话...`
              : '输入消息... (Enter 发送, Shift+Enter 换行)'}
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

      {/* Role Selector Modal */}
      <RoleSelector
        visible={showRoleSelector}
        onClose={() => setShowRoleSelector(false)}
        onConfirm={handleRoleConfigConfirm}
        currentConfig={roleConfig}
      />
    </div>
  );
};

export default ChatWindow;
