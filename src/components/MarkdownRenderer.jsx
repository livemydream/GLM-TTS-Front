import React, { memo } from 'react';
import Markdown from 'markdown-to-jsx';
import './MarkdownRenderer.css';

/**
 * Markdown 渲染组件（使用 memo 优化，避免不必要的重新渲染）
 */
const markdownOptions = {
  overrides: {
    h1: { component: 'h1' },
    h2: { component: 'h2' },
    h3: { component: 'h3' },
    h4: { component: 'h4' },
    h5: { component: 'h5' },
    h6: { component: 'h6' },
    p: { component: 'p' },
    strong: { component: 'strong' },
    em: { component: 'em' },
    code: { component: 'code' },
    pre: { component: 'pre' },
    ul: { component: 'ul' },
    ol: { component: 'ol' },
    li: { component: 'li' },
    a: { component: 'a' },
    blockquote: { component: 'blockquote' },
    hr: { component: 'hr' },
    img: { component: 'img' },
  },
};

const MarkdownRenderer = memo(({ content }) => {
  if (!content) {
    return <div className="markdown-content">...</div>;
  }

  return (
    <div className="markdown-content">
      <Markdown options={markdownOptions}>
        {content}
      </Markdown>
    </div>
  );
}, (prevProps, nextProps) => {
  // 只在 content 变化时重新渲染
  return prevProps.content === nextProps.content;
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
