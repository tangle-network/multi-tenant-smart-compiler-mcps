import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index"
    },
    rollupOptions: {
      external: [
        "@modelcontextprotocol/sdk",
        "mcp-http",
        "superjson",
        "uuid", 
        "zod",
        "child_process",
        "fs",
        "fs/promises",
        "path",
        "util",
        "node:crypto",
        "dotenv/config",
        "express",
        "cors"
      ]
    }
  },
  define: {
    global: "globalThis"
  }
});