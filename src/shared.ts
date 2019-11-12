export interface Tab extends browser.tabs.Tab {
  id: number;
  url: string;
  windowId: number;
}

export interface Permissions {
  bookmarks: boolean;
  downloads: boolean;
  history: boolean;
  notifications: boolean;
}

export const getPermissions = async (): Promise<Permissions> => {
  const { permissions } = await browser.permissions.getAll();
  if (!permissions) {
    throw new Error('permissions.getAll didnt return permissions');
  }
  return {
    bookmarks: permissions.includes('bookmarks'),
    downloads: permissions.includes('downloads'),
    history: permissions.includes('history'),
    notifications: permissions.includes('notifications'),
  };
};

export const CONTAINER_COLORS = [
  'blue', // #37ADFF
  'turquoise', // #00C79A
  'green', // #51CD00
  'yellow', // #FFCB00
  'orange', // #FF9F00
  'red', // #FF613D
  'pink', // #FF4BDA
  'purple', // #AF51F5
  'toolbar',
];
export type ContainerColor = typeof CONTAINER_COLORS[number];

export const CONTAINER_ICONS = [
  'fingerprint',
  'briefcase',
  'dollar',
  'cart',
  'circle',
  'gift',
  'vacation',
  'food',
  'fruit',
  'pet',
  'tree',
  'chill',
  'fence',
];
export type ContainerIcon = typeof CONTAINER_ICONS[number];

export const TOOLBAR_ICON_COLORS = [
  'default',
  'black-simple',
  'blue-simple',
  'red-simple',
  'white-simple',
];
export type ToolbarIconColors = typeof TOOLBAR_ICON_COLORS[number];

export const formatBytes = (bytes: number, decimals = 2): string => {
  // https://stackoverflow.com/a/18650828
  if (bytes == 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + sizes[i];
};
