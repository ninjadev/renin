const defaultSettings = {
  volume: 1,
};

type SettingKey = keyof typeof defaultSettings;

function computeKey(key: SettingKey): string {
  return `renin-${key}`;
}

export function getSetting<T extends SettingKey>(key: T): typeof defaultSettings[T] {
  const raw = localStorage[computeKey(key)];
  if (raw !== undefined) {
    return JSON.parse(raw);
  }
  return defaultSettings[key];
}

export function setSetting<T extends SettingKey>(key: T, value: typeof defaultSettings[T]) {
  localStorage[computeKey(key)] = JSON.stringify(value);
}
