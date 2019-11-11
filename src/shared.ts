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
