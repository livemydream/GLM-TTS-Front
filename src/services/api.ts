import { config } from '@/config/env';
import type {
  ApiResponse,
  ChatHistoryResponse,
  StreamCallback,
  StreamCompleteCallback,
  StreamErrorCallback,
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

        // 处理 SSE 格式数据 (data: xxx\n\n)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data && data !== '[DONE]') {
              onChunk(data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream chat failed:', error);
      onError?.(error as Error);
      throw error;
    }
  },

  /**
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
};

export default glmApi;
