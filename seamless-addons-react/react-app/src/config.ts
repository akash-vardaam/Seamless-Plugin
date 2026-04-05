// WordPress global config injected by PHP via wp_localize_script
export interface WPConfig {
  siteUrl: string;
  restUrl: string;
  ajaxUrl: string;
  nonce: string;
  ajaxNonce: string;
  clientDomain: string;
  singleEventEndpoint: string;
  eventListEndpoint: string;
  amsContentEndpoint: string;
  listViewLayout: string;
  isLoggedIn: boolean;
  userEmail: string;
  logoutUrl: string;
  hasSsoToken: boolean;
  version: string;
}

declare global {
  interface Window {
    seamlessReactConfig: WPConfig;
  }
}

export const config: WPConfig = window.seamlessReactConfig ?? {
  siteUrl: '',
  restUrl: '',
  ajaxUrl: '',
  nonce: '',
  ajaxNonce: '',
  clientDomain: '',
  singleEventEndpoint: 'event',
  eventListEndpoint: 'events',
  amsContentEndpoint: 'ams-content',
  listViewLayout: 'option_1',
  isLoggedIn: false,
  userEmail: '',
  logoutUrl: '',
  hasSsoToken: false,
  version: '2.0.0',
};
