import ChatActions from './ChatActions';
import glmApi from '../services/api';
import type { Message } from '@/types';

/**
 * 异步 Action Creators
 * 处理 API 调用和业务逻辑
 */

export const ChatActionCreators = {
  /**
   * 发送消息并获取 AI 回复（普通模式）
   */
  sendMessage(sessionId: string | null, message: string) {
    return async () => {
      // 添加用户消息
      ChatActions.addMessage({
        content: message,
        role: 'user',
      });

      // 显示输入指示器
      ChatActions.setTyping(true);
      ChatActions.resetError();

      try {
        const response = await glmApi.chat(sessionId, message);

        // 隐藏输入指示器
        ChatActions.setTyping(false);

        // 添加 AI 回复
        if (response && response.data) {
          ChatActions.addMessage({
            content: response.data,
            role: 'assistant',
          });

          // 保存 sessionId
          if (sessionId) {
            ChatActions.setSessionId(sessionId);
          }
        }
      } catch (error) {
        ChatActions.setTyping(false);
        ChatActions.setError((error as Error).message || '发送消息失败');
      }
    };
  },

  /**
   * 发送消息并获取流式回复（SSE）
   */
  sendMessageStream(sessionId: string | null, message: string) {
    return () => {
      // 添加用户消息
      ChatActions.addMessage({
        content: message,
        role: 'user',
      });

      // 显示输入指示器
      ChatActions.setTyping(true);
      ChatActions.resetError();

      // 创建一个临时消息用于流式更新
      const tempMessageId = Date.now();
      ChatActions.addMessage({
        id: tempMessageId,
        content: '',
        role: 'assistant',
        isStreaming: true,
      });

      let fullContent = '';

      glmApi.chatStream(
        sessionId,
        message,
        // onChunk - 收到每个数据块
        (chunk) => {
          // console.log('[Stream chunk] raw:', JSON.stringify(chunk));
          fullContent += chunk;
          // console.log('[Stream chunk] fullContent preview:', JSON.stringify(fullContent.substring(0, 50)));
          ChatActions.updateMessage(tempMessageId, {
            content: fullContent,
          });
        },
        // onComplete - 流结束
        () => {
          // 🔥 打印完整的消息对象
          console.log('[Stream onComplete] fullContent:', JSON.stringify(fullContent));
          console.log('[Stream onComplete] message object:', {
            id: tempMessageId,
            content: fullContent,
            isStreaming: false,
            _version: Date.now(),
          });

          // 隐藏输入指示器
          ChatActions.setTyping(false);
          // 添加一个随机数确保对象引用改变，触发更新
          ChatActions.updateMessage(tempMessageId, {
            content: fullContent,
            isStreaming: false,
            _version: Date.now(), // 内部版本号
          });
          if (sessionId) {
            ChatActions.setSessionId(sessionId);
          }
        },
        // onError - 发生错误
        (error) => {
          ChatActions.setTyping(false);
          ChatActions.setError(error.message || '流式连接失败');
          ChatActions.updateMessage(tempMessageId, {
            content: fullContent || '[连接中断]',
            isStreaming: false,
          });
        }
      );
    };
  },

  /**
   * 加载历史记录
   */
  loadHistory(sessionId: string) {
    return async () => {
      try {
        const response = await glmApi.getHistory(sessionId);

        // 检查响应状态码
        if (response && response.code === 0 && response.data) {
          const historyMessages: Message[] = response.data.history.map((item, index) => ({
            id: Date.now() + index,
            content: item.content,
            role: item.role,
            timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
          }));

          ChatActions.loadHistory(historyMessages);
          // 使用返回的 sessionId
          if (response.data.sessionId) {
            ChatActions.setSessionId(response.data.sessionId);
          }
        } else {
          ChatActions.setError(response?.msg || '加载历史失败');
        }
      } catch (error) {
        ChatActions.setError((error as Error).message || '加载历史失败');
      }
    };
  },

  /**
   * 清除历史
   */
  clearHistory(sessionId: string) {
    return async () => {
      try {
        await glmApi.clearHistory(sessionId);
        ChatActions.clearMessages();
      } catch (error) {
        ChatActions.setError((error as Error).message || '清除历史失败');
      }
    };
  },

  /**
   * 设置角色
   */
  setCharacter(sessionId: string, characterDescription: string) {
    return async () => {
      try {
        await glmApi.setCharacter(sessionId, characterDescription);
      } catch (error) {
        ChatActions.setError((error as Error).message || '设置角色失败');
        throw error;
      }
    };
  },
};

export default ChatActionCreators;
