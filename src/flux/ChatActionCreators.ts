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
          const historyMessages: Message[] = response.data.history
            .filter(item => item.role !== 'system') // 过滤掉系统消息
            .map((item, index) => ({
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

          // 如果返回包含角色信息，恢复角色配置
          if (response.data.character) {
            const { characterId, characterDescription } = response.data.character;

            // 尝试匹配预设角色
            const presetRoles = ['teacher', 'doctor', 'programmer', 'writer', 'translator', 'consultant'];
            const isPresetRole = presetRoles.includes(characterId);

            if (isPresetRole) {
              // 从预设角色列表中找到对应的角色
              const PRESET_ROLES = [
                { id: 'teacher', name: '老师', description: '耐心教导，善于解释复杂概念', systemPrompt: '你是一位经验丰富的老师，擅长用简单易懂的方式解释复杂的概念。请耐心回答学生的问题，并提供相关的例子和练习。', icon: '👨‍🏫' },
                { id: 'doctor', name: '医生', description: '专业医疗建议，关怀患者健康', systemPrompt: '你是一位专业的医生，致力于提供准确的健康建议和医疗信息。请以专业、关怀的态度回答健康相关问题，但提醒用户这不能替代专业诊断。', icon: '👨‍⚕️' },
                { id: 'programmer', name: '程序员', description: '技术专家，代码问题解决能手', systemPrompt: '你是一位经验丰富的程序员，精通多种编程语言和技术栈。请提供清晰、高效的代码解决方案，并解释相关的技术细节。', icon: '💻' },
                { id: 'writer', name: '作家', description: '文学创作，文字表达优美', systemPrompt: '你是一位才华横溢的作家，擅长各种文学体裁。请用优美、生动的语言进行创作或文字表达，展现深厚的文学功底。', icon: '✍️' },
                { id: 'translator', name: '翻译官', description: '多语言专家，精准翻译', systemPrompt: '你是一位专业的翻译官，精通多种语言。请提供准确、地道的翻译，并注意语言的语境和文化差异。', icon: '🌐' },
                { id: 'consultant', name: '顾问', description: '商业咨询，专业分析建议', systemPrompt: '你是一位资深的商业顾问，擅长商业分析和战略规划。请提供专业、深入的商业建议和分析。', icon: '💼' },
              ];

              const presetRole = PRESET_ROLES.find(r => r.id === characterId);
              if (presetRole) {
                ChatActions.setRoleConfig({
                  mode: 'preset',
                  presetRole,
                });
              }
            } else {
              // 使用自定义模式
              ChatActions.setRoleConfig({
                mode: 'custom',
                customPrompt: characterDescription,
              });
            }
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
  setCharacter(sessionId: string, characterId: string, characterDescription: string) {
    return async () => {
      try {
        await glmApi.setCharacter(sessionId, characterId, characterDescription);
      } catch (error) {
        ChatActions.setError((error as Error).message || '设置角色失败');
        throw error;
      }
    };
  },
};

export default ChatActionCreators;
