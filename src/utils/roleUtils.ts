import type { RoleConfig } from '@/types';

/**
 * 预设角色图标映射
 */
const ROLE_ICONS: Record<string, string> = {
  teacher: '👨‍🏫',
  doctor: '👨‍⚕️',
  programmer: '💻',
  writer: '✍️',
  translator: '🌐',
  consultant: '💼',
};

/**
 * 自定义角色默认图标
 */
const CUSTOM_ROLE_ICON = '🎭';

/**
 * 获取角色图标
 */
export function getRoleIcon(roleConfig: RoleConfig): string {
  if (roleConfig.mode === 'preset' && roleConfig.presetRole?.id) {
    return ROLE_ICONS[roleConfig.presetRole.id] || '🤖';
  }
  if (roleConfig.mode === 'custom') {
    return CUSTOM_ROLE_ICON;
  }
  return '🤖';
}

/**
 * 获取角色名称
 */
export function getRoleName(roleConfig: RoleConfig): string {
  if (roleConfig.mode === 'preset' && roleConfig.presetRole) {
    return roleConfig.presetRole.name;
  }
  if (roleConfig.mode === 'custom') {
    return '自定义';
  }
  return 'AI';
}
