import { Select } from 'antd';
import { themePresets } from '../store/ThemeContext';
import { useThemeContext } from '../store/ThemeContext';

export function ThemeSwitcher() {
  const { themeId, setThemeId } = useThemeContext();

  return (
    <Select
      className="theme-switcher"
      value={themeId}
      style={{ width: 140 }}
      onChange={setThemeId}
      options={themePresets.map((item) => ({
        label: item.name,
        value: item.id,
      }))}
    />
  );
}
