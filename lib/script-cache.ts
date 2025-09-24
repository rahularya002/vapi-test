import { configApi, CallConfig } from './supabase';

// In-memory cache for call configuration
let cachedConfig: CallConfig | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class ScriptCache {
  /**
   * Get call configuration with caching
   * - First call: Fetches from database
   * - Subsequent calls: Returns cached version (if fresh)
   * - Auto-refresh: Updates cache every 5 minutes
   */
  static async getConfig(): Promise<CallConfig> {
    const now = Date.now();
    
    // Return cached config if it's fresh
    if (cachedConfig && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedConfig;
    }
    
    try {
      // Fetch fresh config from database
      const config = await configApi.get();
      
      if (config) {
        cachedConfig = config;
        lastFetchTime = now;
        return config;
      }
      
      // Fallback to default config if no database config exists
      return this.getDefaultConfig();
      
    } catch (error) {
      console.error('Error fetching config from database:', error);
      
      // Return cached config if available, otherwise default
      return cachedConfig || this.getDefaultConfig();
    }
  }
  
  /**
   * Force refresh the cache (useful when config is updated)
   */
  static async refreshConfig(): Promise<CallConfig> {
    cachedConfig = null;
    lastFetchTime = 0;
    return this.getConfig();
  }
  
  /**
   * Get default configuration (fallback)
   */
  static getDefaultConfig(): CallConfig {
    return {
      method: 'hybrid',
      script: `Hello! This is an automated call regarding your job application. Do you have a few minutes to answer some questions?

1. Can you tell me about yourself and your background?
2. What interests you about this position?
3. What are your key strengths and skills?
4. Do you have any questions about the role or company?
5. What is your availability for the next steps?

Thank you for your time!`,
      voice_settings: {
        provider: 'elevenlabs',
        voice_id: 'adam',
        speed: 1.0,
        pitch: 1.0
      },
      call_settings: {
        max_duration: 15,
        retry_attempts: 2,
        delay_between_calls: 30
      }
    };
  }
  
  /**
   * Get just the script text (most common use case)
   */
  static async getScript(): Promise<string> {
    const config = await this.getConfig();
    return config.script;
  }
  
  /**
   * Get voice settings
   */
  static async getVoiceSettings() {
    const config = await this.getConfig();
    return config.voice_settings;
  }
  
  /**
   * Get call settings
   */
  static async getCallSettings() {
    const config = await this.getConfig();
    return config.call_settings;
  }
  
  /**
   * Get call method
   */
  static async getCallMethod(): Promise<'vapi' | 'twilio' | 'hybrid'> {
    const config = await this.getConfig();
    return config.method;
  }
}
