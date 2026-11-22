import { defineConfig } from "vite";
import { seo } from "./scripts/seo";

export default defineConfig({
  base: "/",
  plugins: [seo()],
  build: { target: "es2022" },
});
