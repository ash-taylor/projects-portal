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
export async function loadConfig(): Promise<AppConfig> {
  const isLocalDevelopment = window.location.hostname === 'localhost';

  if (isLocalDevelopment)
    return {
      apiUrl: 'http://localhost:3000/api',
    };

  const response = await fetch('/config.json');

  if (!response.ok) throw new Error(`Failed to load config: ${response.statusText}`);

  return await response.json();
}
