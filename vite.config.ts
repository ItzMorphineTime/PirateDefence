import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
// On GitHub Pages the app is served from https://<user>.github.io/<repo>/, so
// production builds need a base of "/<repo>/". Locally (dev/preview) we keep "/".
// The repo name can be overridden via the BASE_PATH env var (the deploy
// workflow sets it from the repository name automatically).
export default defineConfig(({ command }) => ({
  base:
    command === "build"
      ? process.env.BASE_PATH ?? "/PirateDefence/"
      : "/",
  plugins: [react()],
}));
