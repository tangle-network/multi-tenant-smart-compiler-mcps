import { spawnSync } from "child_process";

// Guide generator CLI configuration
export const GUIDE_GENERATOR_CLI = "guide-generator";

// Default guide generation settings
export const DEFAULT_MAX_GUIDES = 10;
export const DEFAULT_MAX_TOPICS = 5;
export const DEFAULT_OUTPUT_PATH = "./guides";

// Cache strategies
export const CACHE_STRATEGIES = ["smart", "aggressive", "minimal"] as const;
export type CacheStrategy = (typeof CACHE_STRATEGIES)[number];

// Command timeout in milliseconds
const getTimeoutFromEnv = (envVar: string, defaultMs: number): number => {
  const envValue = process.env[envVar];
  if (envValue && !isNaN(parseInt(envValue))) {
    return parseInt(envValue) * 1000; // Convert seconds to milliseconds
  }
  return defaultMs;
};

export const COMMAND_TIMEOUTS = {
  GENERATE: getTimeoutFromEnv('GUIDE_GENERATOR_TIMEOUT', 1800000), // 30 minutes default (increased)
  TOPICS: getTimeoutFromEnv('GUIDE_GENERATOR_MCP_TIMEOUT', 600000),   // 10 minutes default, but check MCP_TIMEOUT
  STATUS: 30000,    // 30 seconds
  CACHE: 60000      // 1 minute
} as const;

// Log the timeout values being used for debugging
console.log(`🔧 MCP-GUIDE-GENERATOR: Timeout configuration:
  - GENERATE: ${COMMAND_TIMEOUTS.GENERATE}ms (${COMMAND_TIMEOUTS.GENERATE/1000}s)
  - TOPICS: ${COMMAND_TIMEOUTS.TOPICS}ms (${COMMAND_TIMEOUTS.TOPICS/1000}s)
  - ENV GUIDE_GENERATOR_TIMEOUT: ${process.env.GUIDE_GENERATOR_TIMEOUT || 'not set'}
  - ENV GUIDE_GENERATOR_MCP_TIMEOUT: ${process.env.GUIDE_GENERATOR_MCP_TIMEOUT || 'not set'}`);

// Check if guide-generator CLI is available
export function checkGuideGeneratorAvailable(): boolean {
  try {
    const result = spawnSync(GUIDE_GENERATOR_CLI, ['--help'], {
      stdio: 'ignore'
    });
    
    return result.status === 0;
  } catch (error) {
    return false;
  }
}