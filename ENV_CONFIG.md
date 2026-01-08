# 环境配置说明

## 环境配置文件

本项目使用 Vite 的环境变量功能来管理不同环境的配置。

### 文件说明

- `.env.development` - 开发环境配置（默认）
- `.env.production` - 生产环境配置
- `.env.local` - 本地环境配置（不提交到 git）
- `.env.example` - 环境变量模板

### 配置优先级

Vite 加载环境变量的优先级（从高到低）：

1. `.env.local` - 本地配置（优先级最高，不提交到 git）
2. `.env.development` / `.env.production` - 环境特定配置
3. `.env` - 通用配置

### 使用方法

#### 1. 创建本地配置文件

```bash
# 复制模板文件
cp .env.example .env.local

# 编辑 .env.local 填写你的配置
```

#### 2. 在代码中使用

```javascript
import { config } from '@/config/env';

// 使用配置
const apiUrl = config.apiBaseUrl;
const isDev = config.isDevelopment;
```

或者直接使用环境变量：

```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

### 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | API 基础地址 | `http://localhost:3000/api` |
| `VITE_WS_URL` | WebSocket 地址 | `ws://localhost:3000/ws` |
| `VITE_API_KEY` | API 密钥 | - |
| `VITE_APP_TITLE` | 应用标题 | `AI Chat Assistant` |
| `VITE_APP_ENV` | 应用环境 | `development` |
| `VITE_CHAT_TIMEOUT` | 聊天超时时间(ms) | `30000` |
| `VITE_MAX_MESSAGE_LENGTH` | 最大消息长度 | `5000` |
| `VITE_ENABLE_SOUND` | 启用声音 | `false` |
| `VITE_ENABLE_TYPING_INDICATOR` | 启用输入指示器 | `true` |
| `VITE_ENABLE_MESSAGE_DELETION` | 启用消息删除 | `true` |

### 运行命令

```bash
# 开发环境（使用 .env.development）
npm run dev

# 生产构建（使用 .env.production）
npm run build

# 预览生产构建
npm run preview
```

### 注意事项

1. **变量命名规则**：Vite 要求环境变量必须以 `VITE_` 开头才能在客户端代码中访问
2. **本地配置**：`.env.local` 文件已在 `.gitignore` 中，不会提交到 git
3. **敏感信息**：不要在 `.env.development` 和 `.env.production` 中存放敏感信息（如 API 密钥）
4. **修改生效**：修改环境变量后需要重启开发服务器
