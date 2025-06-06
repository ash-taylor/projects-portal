export const websiteBaseName = import.meta.env.BASE_URL;

/**
 * Fetches the application configuration from the config file
 *
 * Add parameters here as they are added to the config file
 */
export interface AppConfig {
  apiUrl: string;
}

/**
 * Loads the application configuration from the config file
 */
export const loadConfig = async () => ({
  apiUrl: window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : `${window.location.origin}/api`,
});
