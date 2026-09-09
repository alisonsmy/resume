import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

// Serve PDF.js fonts locally in development and in the production build.
cpSync(
  resolve("node_modules/pdfjs-dist/standard_fonts"),
  resolve("public/pdfjs/standard_fonts"),
  { recursive: true },
);
mkdirSync(resolve("public/licenses"), { recursive: true });
for (const name of ["react", "react-dom", "jspdf", "pdfjs-dist"])
  copyFileSync(
    resolve(`node_modules/${name}/LICENSE`),
    resolve(`public/licenses/${name}.txt`),
  );
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
});
