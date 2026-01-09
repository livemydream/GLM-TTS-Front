import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownRenderer.css';

/**
 * Markdown 渲染组件
 */

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 延迟渲染，确保 DOM 完全更新
    const timer = setTimeout(() => {
      setReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  if (!content) {
    return <div className="markdown-content">...</div>;
  }

  // 未准备好时显示纯文本
  if (!ready) {
    return <div className="markdown-content">{content}</div>;
  }

  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
