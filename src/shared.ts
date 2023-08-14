import { Permissions } from './types';

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
    webNavigation: permissions.includes('webNavigation'),
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

export const TOOLBAR_ICON_COLORS = [
  'default',
  'black-simple',
  'blue-simple',
  'red-simple',
  'white-simple',
];

export const IGNORED_DOMAINS_DEFAULT = ['getpocket.com', 'addons.mozilla.org'];

export const REDIRECTOR_DOMAINS_DEFAULT = [
  'away.vk.com',
  'outgoing.prod.mozaws.net',
  'slack-redir.net',
  'statics.teams.cdn.office.net',
  't.co',
];

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
