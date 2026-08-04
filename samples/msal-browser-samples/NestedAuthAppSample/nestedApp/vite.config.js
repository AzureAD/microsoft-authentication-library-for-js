import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// The nested app is served in an iframe embedded by the host app.
export default defineConfig(({ mode }) => ({
    base: "",
    plugins: [react(), ...(mode === "https" ? [basicSsl()] : [])],
    server: {
        open: false,
        port: Number(process.env.PORT) || 30667,
        strictPort: true,
    },
}));
