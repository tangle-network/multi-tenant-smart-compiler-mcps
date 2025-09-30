import { spawn } from "child_process";
import { readdir, stat, readFile } from "fs/promises";
import { join, extname, resolve, relative } from "path";
import { 
  GUIDE_GENERATOR_CLI,
  COMMAND_TIMEOUTS,
  checkGuideGeneratorAvailable,
  type CacheStrategy
} from "../../constants.js";

const ALLOWED_BASE_DIRECTORIES = [
  resolve(process.cwd(), '../..'), // Project root directory (blueprint-agent)
  resolve(process.cwd(), '..'),    // Parent directory of current working directory
  resolve(process.cwd()),          // Current working directory
  '/tmp',                          // Temporary directory
  process.env.GUIDE_GENERATOR_WORKSPACE_ROOT || resolve(process.cwd(), '../..')
];

const SAFE_TO_REMOVE_MCP_VARS = [
  'MCP_TRANSPORT',
  'MCP_HTTP_PROXY_AUTH', 
  'MCP_SESSION_ID',
  'MCP_STDIO_PROXY',
  'MCP_CLIENT_ID'
];

/**
 * Validates that a path is within allowed directories to prevent path traversal attacks
 * @param targetPath - Path to validate
 * @param description - Description for logging
 * @returns Validated absolute path
 * @throws Error if path is outside allowed directories
 */
function validatePath(targetPath: string, description: string): string {
  const absolutePath = resolve(targetPath);
  
  // Check if the path is within any allowed base directory
  const isAllowed = ALLOWED_BASE_DIRECTORIES.some(baseDir => {
    const relativePath = relative(baseDir, absolutePath);
    // Path is safe if it doesn't start with '..' (meaning it's not going outside the base)
    return !relativePath.startsWith('..') && !relativePath.startsWith('/');
  });
  
  if (!isAllowed) {
    console.error(`🚨 SECURITY: Path traversal attempt detected for ${description}: ${targetPath}`);
    console.error(`🚨 SECURITY: Resolved to: ${absolutePath}`);
    console.error(`🚨 SECURITY: Allowed base directories: ${ALLOWED_BASE_DIRECTORIES.join(', ')}`);
    throw new Error(`Path traversal detected: ${description} path '${targetPath}' is outside allowed directories`);
  }
  
  console.log(`✅ SECURITY: Path validated for ${description}: ${absolutePath}`);
  return absolutePath;
}

/**
 * Safely removes environment variables from the allowlist
 * @param env - Environment object to modify
 * @returns Modified environment object
 */
function safelyRemoveMCPVariables(env: Record<string, string | undefined>): Record<string, string | undefined> {
  const cleanEnv = { ...env };
  const removedVars: string[] = [];
  
  SAFE_TO_REMOVE_MCP_VARS.forEach(varName => {
    if (cleanEnv[varName] !== undefined) {
      delete cleanEnv[varName];
      removedVars.push(varName);
    }
  });
  
  if (removedVars.length > 0) {
    console.log(`🔒 SECURITY: Removed MCP environment variables: ${removedVars.join(', ')}`);
  }
  
  return cleanEnv;
}

// Guide generation interfaces
interface GenerateGuidesOptions {
  domain: string;
  maxGuides: number;
  outputPath: string;
  cacheStrategy: CacheStrategy;
  targetDomains?: string[];
}

interface GenerateTopicsOptions {
  domain: string;
  maxTopics: number;
  categories?: string[];
}

interface CacheStatusOptions {
  includeDetails: boolean;
}

interface ClearCacheOptions {
  strategy: CacheStrategy;
}

// Helper function to convert cache strategy to environment variables
function getCacheEnvForStrategy(strategy: CacheStrategy): { useCache: string; writeCache: string } {
  switch (strategy) {
    case 'minimal':
      return { useCache: 'false', writeCache: 'false' };
    case 'smart':
      return { useCache: 'true', writeCache: 'true' };
    case 'aggressive':
      return { useCache: 'false', writeCache: 'true' }; // Force fresh generation
    default:
      return { useCache: 'true', writeCache: 'true' }; // Default to smart
  }
}

async function executeGuideCommandAsync(args: string[], timeout: number = COMMAND_TIMEOUTS.GENERATE, cacheStrategy?: CacheStrategy, server?: any): Promise<{ stdout: string; stderr: string }> {
  if (!checkGuideGeneratorAvailable()) {
    throw new Error("guide-generator CLI is not available. Please install it or add it to PATH.");
  }

  const sanitizedArgs = args.map(arg => {
    // Remove potentially dangerous characters
    const sanitized = arg.replace(/[;&|`$(){}\[\]<>]/g, '');
    if (sanitized !== arg) {
      console.warn(`🚨 SECURITY: Sanitized command argument: '${arg}' → '${sanitized}'`);
    }
    return sanitized;
  });
  
  // Reconstruct command string for logging/error messages
  const command = `${GUIDE_GENERATOR_CLI} ${sanitizedArgs.join(' ')}`;
  const startTime = Date.now();
  
  // Determine cache settings
  let cacheSettings = {
    useCache: process.env.GUIDE_GENERATOR_USE_CACHE || "true",
    writeCache: process.env.GUIDE_GENERATOR_CACHE_WRITE || "true"
  };
  
  // Override with strategy if provided
  if (cacheStrategy) {
    cacheSettings = getCacheEnvForStrategy(cacheStrategy);
  }
  
  const guideGeneratorPath = validatePath(
    join(process.cwd(), '../guide-generator'),
    'guide-generator working directory'
  );
  console.log(`📁 GUIDE GENERATION: Changing working directory to: ${guideGeneratorPath}`);
  
  return new Promise((resolve, reject) => {
    const cleanEnv = safelyRemoveMCPVariables({ ...process.env });
    
    // Set guide generator specific variables
    cleanEnv.GUIDE_GENERATOR_CACHE_WRITE = cacheSettings.writeCache;
    cleanEnv.GUIDE_GENERATOR_USE_CACHE = cacheSettings.useCache;
    
    const projectRoot = validatePath(
      join(process.cwd(), '../..'),
      'project root directory'
    );
    const absoluteCacheDir = validatePath(
      join(projectRoot, 'cache'),
      'cache directory'
    );
    cleanEnv.GUIDE_GENERATOR_CACHE_DIR = absoluteCacheDir;
    
    console.log(`🚀 GUIDE GENERATION: Spawning process: ${GUIDE_GENERATOR_CLI} ${sanitizedArgs.join(' ')}`);
    console.log(`🚀 GUIDE GENERATION: Working directory: ${guideGeneratorPath}`);
    console.log(`🚀 GUIDE GENERATION: Cache settings:`, cacheSettings);
    console.log(`🚀 GUIDE GENERATION: Environment variables:`);
    console.log(`   - GUIDE_GENERATOR_CACHE_WRITE: ${cleanEnv.GUIDE_GENERATOR_CACHE_WRITE}`);
    console.log(`   - GUIDE_GENERATOR_USE_CACHE: ${cleanEnv.GUIDE_GENERATOR_USE_CACHE}`);
    console.log(`   - GUIDE_GENERATOR_CACHE_DIR: ${cleanEnv.GUIDE_GENERATOR_CACHE_DIR}`);
    console.log(`   - PWD: ${process.env.PWD}`);
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
    
    console.log(`🚀 GUIDE GENERATION: Environment cleaned of MCP variables`);
    
    const child = spawn(GUIDE_GENERATOR_CLI, sanitizedArgs, {
      env: cleanEnv,
      cwd: guideGeneratorPath,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });
    
    console.log(`🚀 GUIDE GENERATION: Process spawned with PID: ${child.pid}`);
    
    let stdout = '';
    let stderr = '';
    let isResolved = false;
    
    // Set up timeout
    console.log(`⏰ GUIDE GENERATION: Setting timeout for ${timeout}ms (${Math.round(timeout/1000)}s)`);
    const timeoutHandle = setTimeout(() => {
      if (!isResolved) {
        console.log(`⚠️ GUIDE GENERATION: TIMEOUT REACHED after ${timeout}ms, killing process`);
        isResolved = true;
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
      }
    }, timeout);
    
    // Set up heartbeat to keep MCP connection alive
    let heartbeatCount = 0;
    const heartbeatInterval = setInterval(() => {
      if (!isResolved) {
        heartbeatCount++;
        const elapsed = Date.now() - startTime;
        console.log(`💓 GUIDE GENERATION: Heartbeat ${heartbeatCount} - process still running after ${Math.round(elapsed/1000)}s`);
        
        // Send MCP heartbeat if server available
        if (server && server.sendLoggingMessage) {
          server.sendLoggingMessage({
            level: "info",
            logger: "guide-generator",
            data: `Guide generation in progress... ${Math.round(elapsed/1000)}s elapsed`
          });
        }
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // Send heartbeat every 30 seconds
    
    // Collect stdout
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
    }
    
    // Collect stderr  
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
    }
    
    // Handle process completion
    child.on('close', (code: number | null, signal: string | null) => {
      const duration = Date.now() - startTime;
      console.log(`🏁 GUIDE GENERATION: Process closed after ${duration}ms with code: ${code}, signal: ${signal}`);
      
      if (isResolved) {
        console.log(`🏁 GUIDE GENERATION: Process already resolved, ignoring close event`);
        return; // Already handled by timeout
      }
      isResolved = true;
      clearTimeout(timeoutHandle);
      clearInterval(heartbeatInterval); // Clear heartbeat when process completes
      
      if (signal === 'SIGTERM') {
        console.log(`🚨 GUIDE GENERATION: Process terminated with SIGTERM signal`);
        reject(new Error(`Command timed out after ${timeout}ms`));
      } else if (code === 0) {
        console.log(`✅ GUIDE GENERATION: Process completed successfully after ${duration}ms`);
        resolve({ stdout, stderr });
      } else {
        console.log(`❌ GUIDE GENERATION: Process failed with exit code ${code}`);
        reject(new Error(`Command failed with exit code ${code}: ${stderr || 'No error output'}`));
      }
    });
    
    // Handle spawn errors
    child.on('error', (error: Error) => {
      if (isResolved) return;
      isResolved = true;
      clearTimeout(timeoutHandle);
      clearInterval(heartbeatInterval); // Clear heartbeat on error
      
      reject(new Error(`Failed to spawn process: ${error.message}`));
    });
  });
}

// Helper function to parse generated files from output directory with content
async function parseGeneratedFilesWithContent(outputPath: string): Promise<Array<{ 
  filename: string; 
  path: string; 
  size: number; 
  content: string;
  metadata?: any;
}>> {
  const files: Array<{ filename: string; path: string; size: number; content: string; metadata?: any }> = [];
  
  try {
    console.log(`📝 PARSE FILES: Checking directory: ${outputPath}`);
    const entries = await readdir(outputPath, { withFileTypes: true });
    console.log(`📝 PARSE FILES: Found ${entries.length} entries in directory`);
    
    for (const entry of entries) {
      console.log(`📝 PARSE FILES: Processing entry: ${entry.name}, isFile: ${entry.isFile()}, isMarkdown: ${extname(entry.name) === '.md'}`);
      if (entry.isFile() && extname(entry.name) === '.md') {
        const filePath = join(outputPath, entry.name);
        let fileContent = '';
        let metadata: any = {};
        let contentReadSuccessful = true;
        
        try {
          const stats = await stat(filePath);
          
          // Try to read file content
          try {
            fileContent = await readFile(filePath, 'utf-8');
            
            // Extract metadata from frontmatter if present
            const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n/);
            if (frontmatterMatch) {
              try {
                // Parse YAML frontmatter (simple key: value format)
                const frontmatter = frontmatterMatch[1];
                const lines = frontmatter.split('\n');
                for (const line of lines) {
                  const colonIndex = line.indexOf(':');
                  if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim();
                    metadata[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
                  }
                }
              } catch (e) {
                console.log(`📝 PARSE FILES: Could not parse frontmatter for ${entry.name}`);
              }
            }
            
            console.log(`📝 PARSE FILES: Successfully read ${entry.name} (${stats.size} bytes, ${fileContent.length} chars)`);
          } catch (contentError) {
            contentReadSuccessful = false;
            console.error(`📝 PARSE FILES: Could not read content for ${entry.name}:`, contentError);
            console.log(`📝 PARSE FILES: Including ${entry.name} without content (file exists but unreadable)`);
            
            // Add error information to metadata
            metadata.contentReadError = true;
            metadata.contentReadErrorMessage = contentError instanceof Error ? contentError.message : String(contentError);
          }
          
          // Always include the file, even if content couldn't be read
          files.push({
            filename: entry.name,
            path: filePath,
            size: stats.size,
            content: fileContent,
            metadata: {
              ...metadata,
              contentAvailable: contentReadSuccessful
            }
          });
          
        } catch (statError) {
          console.error(`📝 PARSE FILES: Could not stat file ${entry.name}:`, statError);
          
          // Include file with minimal info if stat fails
          files.push({
            filename: entry.name,
            path: filePath,
            size: 0,
            content: '',
            metadata: {
              contentAvailable: false,
              statError: true,
              statErrorMessage: statError instanceof Error ? statError.message : String(statError)
            }
          });
        }
      }
    }
  } catch (error) {
    // Directory might not exist or be readable
    console.error(`📝 PARSE FILES: Could not read output directory: ${outputPath}`, error);
  }
  
  return files;
}

// Legacy function for backwards compatibility
async function parseGeneratedFiles(outputPath: string): Promise<Array<{ filename: string; path: string; size: number }>> {
  const filesWithContent = await parseGeneratedFilesWithContent(outputPath);
  return filesWithContent.map(file => ({
    filename: file.filename,
    path: file.path,
    size: file.size
  }));
}

// Generate guides handler
export async function handleGenerateGuides(options: GenerateGuidesOptions, server?: any) {
  const { domain, maxGuides, cacheStrategy } = options;
  
  // Generate unique output path to avoid conflicts with existing directories
  const uniqueOutputPath = `./mcp-guides-${Date.now()}`;
  console.log(`📁 GUIDE GENERATION: Using unique output path: ${uniqueOutputPath}`);
  
  // Build command arguments
  const args = [
    "generate", 
    domain,
    "--max-guides", maxGuides.toString(),
    "--output", uniqueOutputPath
  ];
  
  
  try {
    console.log(`📁 GUIDE GENERATION: Running command with args:`, args);
    console.log(`📁 GUIDE GENERATION: Output path: ${uniqueOutputPath}`);
    console.log(`📁 GUIDE GENERATION: Working directory: ${process.cwd()}`);
    
    const { stdout, stderr } = await executeGuideCommandAsync(args, COMMAND_TIMEOUTS.GENERATE, cacheStrategy, server);
    
    console.log(`📁 GUIDE GENERATION: CLI stdout:`, stdout.substring(0, 500));
    console.log(`📁 GUIDE GENERATION: CLI stderr:`, stderr.substring(0, 500));
    
    const validatedGuideGeneratorPath = validatePath(
      join(process.cwd(), '../guide-generator'),
      'guide-generator directory for file parsing'
    );
    const fullOutputPath = validatePath(
      join(validatedGuideGeneratorPath, uniqueOutputPath),
      'output directory for generated files'
    );
    console.log(`📁 GUIDE GENERATION: Looking for files in: ${fullOutputPath}`);
    const generatedFilesWithContent = await parseGeneratedFilesWithContent(fullOutputPath);
    console.log(`📁 GUIDE GENERATION: Found ${generatedFilesWithContent.length} generated files with content`);
    
    return {
      content: [{ 
        type: "text" as const, 
        text: JSON.stringify({
          success: true,
          message: `Successfully generated ${generatedFilesWithContent.length} guides for ${domain}`,
          domain,
          guidesGenerated: generatedFilesWithContent.length,
          outputPath: fullOutputPath,
          cacheStrategy,
          taskComplete: true,
          status: "Guide generation completed successfully. All files have been written to the output directory.",
          generatedFiles: generatedFilesWithContent.map(file => ({
            filename: file.filename,
            path: file.path,
            sizeKB: Math.round(file.size / 1024),
            content: file.content,
            metadata: file.metadata,
            // Additional metadata for workbench integration
            type: 'file',
            language: 'markdown',
            generatedAt: new Date().toISOString(),
            generatedBy: 'guide-generator',
            domain: domain
          }))
        }, null, 2)
      }],
      isError: false
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      content: [{ 
        type: "text" as const, 
        text: JSON.stringify({
          success: false,
          error: `Failed to generate guides for ${domain} - ${errorMessage}`,
          domain,
          maxGuides
        })
      }],
      isError: true,
    };
  }
}

// Generate topics handler
export async function handleGenerateTopics(options: GenerateTopicsOptions) {
  const { domain, maxTopics } = options;
  
  const args = [
    "topics",
    domain, 
    "--max-topics", maxTopics.toString(),
    "--format", "json"
  ];
  
  try {
    const { stdout } = await executeGuideCommandAsync(args, COMMAND_TIMEOUTS.TOPICS);
    
    // Try to parse topics from output
    let topics: any[] = [];
    try {
      // First try to parse the whole stdout as JSON
      const parsed = JSON.parse(stdout);
      if (Array.isArray(parsed)) {
        topics = parsed;
      } else if (parsed.topics && Array.isArray(parsed.topics)) {
        topics = parsed.topics;
      }
    } catch {
      // Try to extract JSON from mixed output
      try {
        const lines = stdout.split('\n');
        let jsonStart = -1;
        let jsonEnd = -1;
        let braceCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim().startsWith('{') && (line.includes('"topics"') || lines.slice(i, i + 5).some(l => l.includes('"topics"')))) {
            jsonStart = i;
            break;
          }
        }
        
        if (jsonStart >= 0) {
          for (let i = jsonStart; i < lines.length; i++) {
            const line = lines[i];
            for (const char of line) {
              if (char === '{') braceCount++;
              if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  jsonEnd = i;
                  break;
                }
              }
            }
            if (jsonEnd >= 0) break;
          }
          
          if (jsonEnd >= 0) {
            const jsonLines = lines.slice(jsonStart, jsonEnd + 1);
            const jsonStr = jsonLines.join('\n');
            
            const parsed = JSON.parse(jsonStr);
            if (parsed.topics && Array.isArray(parsed.topics)) {
              topics = parsed.topics;
            }
          }
        }
      } catch (jsonError) {
        const lines = stdout.split('\n').filter(line => line.trim());
        topics = lines
          .filter(line => line.startsWith('- ') || line.startsWith('* '))
          .map((line, index) => ({
            title: line.substring(2).trim(),
            category: "general",
            priority: 5,
            description: line.substring(2).trim()
          }));
      }
    }
    
    const limitedTopics = topics.slice(0, maxTopics);
    
    return {
      content: [{ 
        type: "text" as const, 
        text: JSON.stringify({
          success: true,
          message: `Successfully generated ${limitedTopics.length} topics for ${domain}`,
          domain,
          maxTopics,
          totalFound: topics.length,
          returned: limitedTopics.length,
          taskComplete: true,
          status: "Topic generation completed successfully. No further action needed.",
          topics: limitedTopics.map((topic: any, idx: number) => ({
            id: idx + 1,
            title: topic.title,
            category: topic.category || "general",
            priority: topic.priority || 5,
            description: topic.description || topic.title
          }))
        }, null, 2)
      }],
      isError: false
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      content: [{ 
        type: "text" as const, 
        text: JSON.stringify({
          success: false,
          error: `Failed to generate topics for ${domain} - ${errorMessage}`,
          domain,
          maxTopics
        })
      }],
      isError: true,
    };
  }
}

// Get cache status handler
export async function handleGetCacheStatus(_options: CacheStatusOptions) {
  
  // Build command arguments
  // Note: --verbose flag is not supported by cache status subcommand
  const args = ["cache", "status"];
  
  try {
    const { stdout } = await executeGuideCommandAsync(args, COMMAND_TIMEOUTS.CACHE);
    
    // Try to parse cache status
    let cacheInfo: any = {
      enabled: false,
      totalEntries: 0,
      totalSizeMb: 0,
      domains: []
    };
    
    try {
      // Try JSON parsing first
      cacheInfo = JSON.parse(stdout);
    } catch {
      // Fallback: parse text output from guide-generator CLI
      const lines = stdout.split('\n');
      for (const line of lines) {
        const cleanLine = line.replace(/^ℹ️\s*/, '').trim(); // Remove info emoji prefix
        const lowerLine = cleanLine.toLowerCase();
        
        if (lowerLine.includes('read enabled: true') || lowerLine.includes('write enabled: true')) {
          cacheInfo.enabled = true;
        } else if (lowerLine.includes('read enabled: false') && lowerLine.includes('write enabled: false')) {
          cacheInfo.enabled = false;
        } else if (lowerLine.includes('total files:')) {
          const match = cleanLine.match(/total files:\s*(\d+)/i);
          if (match) cacheInfo.totalEntries = parseInt(match[1]);
        } else if (lowerLine.includes('total size:') && lowerLine.includes('bytes')) {
          const match = cleanLine.match(/total size:\s*([\d,]+)\s*bytes/i);
          if (match) {
            const bytes = parseInt(match[1].replace(/,/g, ''));
            cacheInfo.totalSizeMb = Math.round((bytes / (1024 * 1024)) * 100) / 100;
          }
        } else if (lowerLine.includes('domains:')) {
          // Start parsing domains - look for lines with bullet points
          continue;
        } else if (cleanLine.match(/^\s*•\s*(.+?):\s*(\d+)\s*files/i)) {
          const domainMatch = cleanLine.match(/^\s*•\s*(.+?):\s*(\d+)\s*files\s*\((.+?)\)/i);
          if (domainMatch) {
            const [, domainName, fileCount, sizeInfo] = domainMatch;
            cacheInfo.domains = cacheInfo.domains || [];
            cacheInfo.domains.push({
              name: domainName.trim(),
              files: parseInt(fileCount),
              sizeInfo: sizeInfo.trim()
            });
          }
        }
      }
    }
    
    return {
      content: [{ 
        type: "text" as const, 
        text: JSON.stringify({
          success: true,
          message: "Cache status retrieved",
          cache: {
            enabled: cacheInfo.enabled,
            totalEntries: cacheInfo.totalEntries,
            totalSizeMb: cacheInfo.totalSizeMb,
            domains: cacheInfo.domains || []
          }
        })
      }],
      isError: false
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      content: [{ 
        type: "text" as const, 
        text: JSON.stringify({
          success: false,
          error: `Failed to get cache status - ${errorMessage}`
        })
      }],
      isError: true,
    };
  }
}

// Clear cache handler
export async function handleClearCache(options: ClearCacheOptions) {
  const { strategy } = options;
  
  // Build command arguments based on strategy
  let args: string[];
  
  switch (strategy) {
    case "aggressive":
      // Clear all cache by not specifying domain (clears everything)
      args = ["cache", "clear"];
      break;
    case "minimal":
      return {
        content: [{ 
          type: "text" as const, 
          text: JSON.stringify({
            success: true,
            message: "Minimal strategy - no clearing performed",
            strategy: "minimal"
          })
        }],
        isError: false
      };
    case "smart":
    default:
      args = ["cache", "clear"];
      break;
  }
  
  try {
    await executeGuideCommandAsync(args, COMMAND_TIMEOUTS.CACHE);
    
    return {
      content: [{ 
        type: "text" as const, 
        text: JSON.stringify({
          success: true,
          message: `Cache cleared successfully using ${strategy} strategy`,
          strategy
        })
      }],
      isError: false
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      content: [{ 
        type: "text" as const, 
        text: JSON.stringify({
          success: false,
          error: `Failed to clear cache using ${strategy} strategy - ${errorMessage}`,
          strategy
        })
      }],
      isError: true,
    };
  }
}