import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      "/graphql": "http://localhost:8080",
      "/files": "http://localhost:8080",
      "/healthz": "http://localhost:8080",
    },
  },
});
