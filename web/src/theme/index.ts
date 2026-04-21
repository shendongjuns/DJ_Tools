import { theme } from 'antd';
import defaultPreset from './presets/default.json';
import darkPreset from './presets/dark.json';
import cartoonPreset from './presets/cartoon.json';
import illustrationPreset from './presets/illustration.json';
import glassPreset from './presets/glass.json';

export interface ThemePreset {
  id: string;
  name: string;
  appearance: 'light' | 'dark';
  token: Record<string, string | number>;
  components: Record<string, Record<string, string | number>>;
}

export const themePresets: ThemePreset[] = [
  defaultPreset as ThemePreset,
  darkPreset as ThemePreset,
  cartoonPreset as ThemePreset,
  illustrationPreset as ThemePreset,
  glassPreset as ThemePreset,
];

export function getThemePreset(themeId?: string | null) {
  return themePresets.find((item) => item.id === themeId) ?? themePresets.find((item) => item.id === 'cartoon')!;
}

export function resolveAntdTheme(themeId?: string | null) {
  const preset = getThemePreset(themeId);
  return {
    token: preset.token,
    components: preset.components,
    algorithm: preset.appearance === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };
}

