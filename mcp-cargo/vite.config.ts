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
});
