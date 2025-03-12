export type PluginType = 'database' | 'cache' | 'search' | 'auth';

export interface Plugin {
  type: PluginType;
  name: string;
  version: string;
}

export interface BasePluginConfig {
  name: string;
  version: string;
  type: PluginType;
  enabled: boolean;
}

export interface CachePluginConfig extends BasePluginConfig {
  type: 'cache';
  // Cache specific config
}

export interface SearchPluginConfig extends BasePluginConfig {
  type: 'search';
  // Search specific config
} 