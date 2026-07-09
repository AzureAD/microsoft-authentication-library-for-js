import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const reactPath = path.dirname(require.resolve("react/package.json"));
const reactDomPath = path.dirname(require.resolve("react-dom/package.json"));

export default defineConfig({
    plugins: [react()],
    resolve: {
        dedupe: ["react", "react-dom"],
        alias: {
            react: reactPath,
            "react-dom": reactDomPath,
        },
    },
    server: {
        port: 3000,
        strictPort: true,
    },
});