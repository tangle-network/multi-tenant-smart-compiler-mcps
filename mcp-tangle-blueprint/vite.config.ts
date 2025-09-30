import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "./src/index.ts",
    outDir: "./dist",
    target: "esnext",
    sourcemap: "inline",
    minify: false,
    rollupOptions: {
      output: {
        format: "es",
        dir: "./dist",
      },
    },
  },
  ssr: {
    noExternal: true,
  },
  define: {
    __SYSTEM_PROMPT__: JSON.stringify(
      readFileSync(resolve(__dirname, "prompts", "system.md"), {
        encoding: "utf-8",
      }),
    ),
  },
});
