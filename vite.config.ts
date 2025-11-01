import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"
import { visualizer } from "rollup-plugin-visualizer"

const config = defineConfig({
  build: {
    // sourcemap: true, // Enables source map generation
    // rollupOptions: {
    //   external: [
    //     "os",
    //     "stream",
    //     "node:async_hooks",
    //     "fs",
    //     "net",
    //     "tls",
    //     "crypto",
    //     "perf_hooks",
    //   ],
    // },
  },
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    // visualizer({
    //   emitFile: true,
    //   filename: "stats.html",
    //   template: "network",
    // }),
  ],
})

export default config
