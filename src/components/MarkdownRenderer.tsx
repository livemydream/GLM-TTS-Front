import React from 'react';
import Markdown from '@uiw/react-markdown-preview';
import '@uiw/react-markdown-preview/markdown.css';
import './MarkdownRenderer.css';

/**
 * Markdown 渲染组件
 * 使用 @uiw/react-markdown-preview 提供 GitHub 风格的渲染
 */

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) {
    return <div className="markdown-content">...</div>;
  }

  return (
    <div className="markdown-content">
      <Markdown source={content} />
    </div>
  );
};

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
