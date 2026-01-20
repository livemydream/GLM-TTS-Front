import React, { useState } from 'react';
import { Modal, Radio, Input, Button, Card, Space, Typography, Tag } from 'antd';
import { UserOutlined, FormOutlined } from '@ant-design/icons';
import type { PresetRole, RoleConfig, RolePlayMode } from '@/types';
import './RoleSelector.css';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

// 预设角色列表
const PRESET_ROLES: PresetRole[] = [
  {
    id: 'teacher',
    name: '老师',
    description: '耐心教导，善于解释复杂概念',
    systemPrompt: '你是一位经验丰富的老师，擅长用简单易懂的方式解释复杂的概念。请耐心回答学生的问题，并提供相关的例子和练习。',
    icon: '👨‍🏫',
  },
  {
    id: 'doctor',
    name: '医生',
    description: '专业医疗建议，关怀患者健康',
    systemPrompt: '你是一位专业的医生，致力于提供准确的健康建议和医疗信息。请以专业、关怀的态度回答健康相关问题，但提醒用户这不能替代专业诊断。',
    icon: '👨‍⚕️',
  },
  {
    id: 'programmer',
    name: '程序员',
    description: '技术专家，代码问题解决能手',
    systemPrompt: '你是一位经验丰富的程序员，精通多种编程语言和技术栈。请提供清晰、高效的代码解决方案，并解释相关的技术细节。',
    icon: '💻',
  },
  {
    id: 'writer',
    name: '作家',
    description: '文学创作，文字表达优美',
    systemPrompt: '你是一位才华横溢的作家，擅长各种文学体裁。请用优美、生动的语言进行创作或文字表达，展现深厚的文学功底。',
    icon: '✍️',
  },
  {
    id: 'translator',
    name: '翻译官',
    description: '多语言专家，精准翻译',
    systemPrompt: '你是一位专业的翻译官，精通多种语言。请提供准确、地道的翻译，并注意语言的语境和文化差异。',
    icon: '🌐',
  },
  {
    id: 'consultant',
    name: '顾问',
    description: '商业咨询，专业分析建议',
    systemPrompt: '你是一位资深的商业顾问，擅长商业分析和战略规划。请提供专业、深入的商业建议和分析。',
    icon: '💼',
  },
];

interface RoleSelectorProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (roleConfig: RoleConfig) => void;
  currentConfig?: RoleConfig;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  visible,
  onClose,
  onConfirm,
  currentConfig,
}) => {
  // 默认模式
  const [mode, setMode] = React.useState<RolePlayMode>(
    currentConfig?.mode || 'none'
  );

  // 选中的预设角色
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    currentConfig?.presetRole?.id || PRESET_ROLES[0].id
  );

  // 自定义提示词
  const [customPrompt, setCustomPrompt] = useState<string>(
    currentConfig?.customPrompt || ''
  );

  const handleModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMode(e.target.value as RolePlayMode);
  };

  const handleConfirm = () => {
    const config: RoleConfig = {
      mode,
      ...(mode === 'preset' && {
        presetRole: PRESET_ROLES.find(r => r.id === selectedPresetId),
      }),
      ...(mode === 'custom' && {
        customPrompt: customPrompt.trim(),
      }),
    };

    onConfirm(config);
    onClose();
  };

  const selectedPresetRole = PRESET_ROLES.find(r => r.id === selectedPresetId);

  return (
    <Modal
      title="角色扮演设置"
      open={visible}
      onCancel={onClose}
      onOk={handleConfirm}
      width={700}
      okText="确认"
      cancelText="取消"
    >
      <div className="role-selector">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 模式选择 */}
          <div>
            <Text strong>选择模式</Text>
            <Radio.Group
              value={mode}
              onChange={handleModeChange}
              style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <Radio value="none">普通模式（无角色设定）</Radio>
              <Radio value="preset">预设角色</Radio>
              <Radio value="custom">自定义提示词</Radio>
            </Radio.Group>
          </div>

          {/* 预设角色选择 */}
          {mode === 'preset' && (
            <div>
              <Text strong>选择角色</Text>
              <div className="preset-roles-grid" style={{ marginTop: 12 }}>
                {PRESET_ROLES.map(role => (
                  <Card
                    key={role.id}
                    className={`role-card ${selectedPresetId === role.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPresetId(role.id)}
                    size="small"
                  >
                    <div className="role-card-content">
                      <span className="role-icon">{role.icon}</span>
                      <div className="role-info">
                        <Text strong>{role.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {role.description}
                        </Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* 选中的角色详情 */}
              {selectedPresetRole && (
                <Card size="small" style={{ marginTop: 12, background: '#f5f5f5' }}>
                  <Text strong>系统提示词：</Text>
                  <Paragraph
                    copyable
                    style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}
                  >
                    {selectedPresetRole.systemPrompt}
                  </Paragraph>
                </Card>
              )}
            </div>
          )}

          {/* 自定义提示词 */}
          {mode === 'custom' && (
            <div>
              <Text strong>自定义系统提示词</Text>
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                定义 AI 的角色和行为方式
              </Text>
              <TextArea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="例如：你是一位专业的心理咨询师，擅长倾听和分析..."
                autoSize={{ minRows: 4, maxRows: 8 }}
                style={{ marginTop: 12 }}
                showCount
                maxLength={2000}
              />
            </div>
          )}

          {/* 当前配置预览 */}
          {mode !== 'none' && (
            <div>
              <Text strong>当前配置</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={mode === 'preset' ? 'blue' : 'green'}>
                  {mode === 'preset' ? '预设角色' : '自定义'}
                </Tag>
                {mode === 'preset' && selectedPresetRole && (
                  <Tag color="purple">{selectedPresetRole.icon} {selectedPresetRole.name}</Tag>
                )}
              </div>
            </div>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default RoleSelector;
