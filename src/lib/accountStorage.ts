export type SavedAddress = {
  id: string;
  name: string;
  phone: string;
  postalCode: string;
  address1: string;
  address2: string;
  isDefault: boolean;
};

export type NotificationSettingKey =
  | "order"
  | "event"
  | "price"
  | "magazine";

export type NotificationSettings = Record<NotificationSettingKey, boolean>;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  order: true,
  event: false,
  price: true,
  magazine: false,
};

export type FollowedBrandId = string;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function addressStorageKey(ownerId: string) {
  return `lemichu.addresses.${ownerId}`;
}

export function notificationStorageKey(ownerId: string) {
  return `lemichu.notification-settings.${ownerId}`;
}

export function followedBrandStorageKey(ownerId: string) {
  return `lemichu.followed-brands.${ownerId}`;
}

export function alertReadStorageKey(ownerId: string) {
  return `lemichu.alert-reads.${ownerId}`;
}

export function readAddresses(ownerId: string): SavedAddress[] {
  const items = readJson<SavedAddress[]>(addressStorageKey(ownerId), []);
  return Array.isArray(items) ? items : [];
}

export function writeAddresses(ownerId: string, addresses: SavedAddress[]) {
  writeJson(addressStorageKey(ownerId), addresses);
}

export function readNotificationSettings(ownerId: string): NotificationSettings {
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...readJson<Partial<NotificationSettings>>(notificationStorageKey(ownerId), {}),
  };
}

export function writeNotificationSettings(ownerId: string, settings: NotificationSettings) {
  writeJson(notificationStorageKey(ownerId), settings);
}

export function readFollowedBrandIds(ownerId: string): FollowedBrandId[] {
  const items = readJson<FollowedBrandId[]>(followedBrandStorageKey(ownerId), []);
  return Array.isArray(items) ? items.filter((item) => typeof item === "string") : [];
}

export function writeFollowedBrandIds(ownerId: string, ids: FollowedBrandId[]) {
  writeJson(followedBrandStorageKey(ownerId), ids);
}

export function readAlertReads(ownerId: string): string[] {
  const items = readJson<string[]>(alertReadStorageKey(ownerId), []);
  return Array.isArray(items) ? items.filter((item) => typeof item === "string") : [];
}

export function writeAlertReads(ownerId: string, ids: string[]) {
  writeJson(alertReadStorageKey(ownerId), ids);
}
