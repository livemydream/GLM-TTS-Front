import { config } from '@/config/env';
import type {
  ApiResponse,
  ChatHistoryResponse,
  StreamCallback,
  StreamCompleteCallback,
  StreamErrorCallback,
  RoleConfig,
} from '@/types';

/**
 * API 服务模块
 * 处理所有与后端的通信
 */

const API_BASE_URL = config.apiBaseUrl;

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * 通用请求封装
 */
async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 根据响应类型处理
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text() as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

  const parseTemplate = (input: string): string => {
  let result = '';
  let i = 0;

  while (i < input.length) {
    const start = input.indexOf('$${', i);
    if (start === -1) break;

    let depth = 1;
    let j = start + 3;

    while (j < input.length && depth > 0) {
      if (input.startsWith('$${', j)) {
        depth++;
        j += 3;
      } else if (input.startsWith('}$$', j)) {
        depth--;
        if (depth === 0) break;
        j += 3;
      } else {
        j++;
      }
    }

    if (depth === 0) {
      // 只剥一层
      const content = input.substring(start + 3, j);
      result += content;
      i = j + 3;
    } else {
      break;
    }
  }

  return result;
}

/**
 * GLM 聊天 API
 */
export const glmApi = {
  /**
   * 普通聊天接口
   * POST /api/glm/chat
   */
  async chat(sessionId: string | null, message: string): Promise<ApiResponse<string>> {
    return request('/glm/chat', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        message,
      }),
    });
  },

  /**
   * 流式聊天接口 (SSE)
   * POST /api/glm/chat/stream
   * 返回 EventSource 或使用 fetch + reader
   */
  async chatStream(
    sessionId: string | null,
    message: string,
    onChunk: StreamCallback,
    onComplete?: StreamCompleteCallback,
    onError?: StreamErrorCallback
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/glm/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete?.();
          break;
        }

        // 解码并处理数据块
        buffer += decoder.decode(value, { stream: true });
        // debugger
        // 处理 SSE 格式数据 (data: xxx\n\n)
        // debugger;
        const lines = parseTemplate(buffer);
        buffer = ""; // 保留最后一个不完整的行

        // for (const line of lines) {
        //   console.log('[Stream chunk] line:', line);
        //   if (line.startsWith('data:')) {
        //     const data = line.slice(5).trim();
        //     if (data === '[DONE]') {
        //       // 🔥 遇到 [DONE] 标记，主动结束流
        //       onComplete?.();
        //       return;
        //     }
            // console.log('[Stream chunk] raw:', data);
            onChunk(lines);
            
          // }
        // }
      }
    } catch (error) {
      console.error('Stream chat failed:', error);
      onError?.(error as Error);
      throw error;
    }
  },  /**
   * 获取会话历史
   * GET /api/glm/history?sessionId=xxx
   */
  async getHistory(sessionId: string): Promise<ApiResponse<ChatHistoryResponse>> {
    return request(`/glm/history?sessionId=${encodeURIComponent(sessionId)}`);
  },

  /**
   * 清除会话历史
   * DELETE /api/glm/history?sessionId=xxx
   */
  async clearHistory(sessionId: string): Promise<ApiResponse<void>> {
    return request(`/glm/history?sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  },

  /**
   * 设置角色
   * POST /api/glm/character
   */
  async setCharacter(sessionId: string, characterId: string, characterDescription: string): Promise<ApiResponse<void>> {
    return request('/glm/character', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        characterId,
        characterDescription,
      }),
    });
  },
};

export default glmApi;
