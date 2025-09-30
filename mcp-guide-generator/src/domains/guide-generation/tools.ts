import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { 
  handleGenerateGuides,
  handleGenerateTopics,
  handleGetCacheStatus,
  handleClearCache
} from "./handlers.js";
import { 
  CACHE_STRATEGIES,
  DEFAULT_MAX_GUIDES,
  DEFAULT_MAX_TOPICS,
  DEFAULT_OUTPUT_PATH
} from "../../constants.js";

export function registerGuideTools(server: McpServer) {
  // Generate guides tool
  server.tool(
    "generate-guides",
    "Generate comprehensive technical documentation guides for a given domain using the guide-generator CLI",
    {
      domain: z.string().min(1).describe("Target domain to generate guides for (e.g., 'tangle.tools')"),
      maxGuides: z.number().int().min(1).max(50).optional().default(DEFAULT_MAX_GUIDES).describe("Maximum number of guides to generate"),
      outputPath: z.string().optional().default(DEFAULT_OUTPUT_PATH).describe("Output directory for generated guides"),
      cacheStrategy: z.enum(CACHE_STRATEGIES).optional().default("smart").describe("Cache management strategy"),
      targetDomains: z.array(z.string()).optional().describe("Specific domain areas to focus on")
    },
    async ({ domain, maxGuides, outputPath, cacheStrategy, targetDomains }) => {
      const toolStartTime = Date.now();
      
      // Send immediate notification to agent - CRITICAL: Keep MCP connection alive
      server.server.sendLoggingMessage({
        level: "info",
        logger: "guide-generator",
        data: `Starting guide generation for ${domain} (this may take 5-15 minutes)...`
      });
      
      try {
        const result = await handleGenerateGuides({
          domain,
          maxGuides: maxGuides || DEFAULT_MAX_GUIDES,
          outputPath: outputPath || DEFAULT_OUTPUT_PATH,
          cacheStrategy: cacheStrategy || "smart",
          targetDomains
        }, server.server);
        
        const toolEndTime = Date.now();
        const totalToolTime = toolEndTime - toolStartTime;
        
        // Send completion notification
        server.server.sendLoggingMessage({
          level: "info", 
          logger: "guide-generator",
          data: `Guide generation completed in ${Math.round(totalToolTime/1000)}s`
        });
        
        return result;
      } catch (error) {
        // Send error notification
        server.server.sendLoggingMessage({
          level: "error",
          logger: "guide-generator", 
          data: `Guide generation failed: ${error instanceof Error ? error.message : String(error)}`
        });
        
        return {
          content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // Generate topics tool
  server.tool(
    "generate-topics", 
    "Generate topic suggestions for a given domain using the guide-generator CLI",
    {
      domain: z.string().min(1).describe("Target domain to generate topics for (e.g., 'tangle.tools')"),
      maxTopics: z.number().int().min(1).max(20).optional().default(DEFAULT_MAX_TOPICS).describe("Maximum number of topics to generate"),
      categories: z.array(z.string()).optional().describe("Specific categories to focus on (e.g., 'api', 'tutorial', 'reference')")
    },
    async ({ domain, maxTopics, categories }) => {
      const toolStartTime = Date.now();
      
      // Send immediate notification to agent
      server.server.sendLoggingMessage({
        level: "info",
        logger: "guide-generator",
        data: `Starting topic generation for ${domain} (this may take 30-60 seconds)...`
      });
      
      try {
        const result = await handleGenerateTopics({
          domain,
          maxTopics: maxTopics || DEFAULT_MAX_TOPICS,
          categories
        });
        
        const toolEndTime = Date.now();
        const totalToolTime = toolEndTime - toolStartTime;
        
        
        // Send completion notification
        server.server.sendLoggingMessage({
          level: "info", 
          logger: "guide-generator",
          data: `Topic generation completed in ${Math.round(totalToolTime/1000)}s`
        });
        
        return result;
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // Get cache status tool  
  server.tool(
    "get-cache-status",
    "Get detailed cache status and statistics from the guide-generator CLI",
    {
      includeDetails: z.boolean().optional().default(true).describe("Include detailed cache information")
    },
    async ({ includeDetails }) => {
      try {
        return await handleGetCacheStatus({ includeDetails: includeDetails || true });
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  // Clear cache tool
  server.tool(
    "clear-cache",
    "Clear the guide-generator cache using the CLI",
    {
      strategy: z.enum(CACHE_STRATEGIES).optional().default("smart").describe("Cache clearing strategy")
    },
    async ({ strategy }) => {
      try {
        return await handleClearCache({ strategy: strategy || "smart" });
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );
}