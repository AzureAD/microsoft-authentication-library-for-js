import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// The host app is the top frame and embeds the nested app in an iframe.
export default defineConfig(({ mode }) => ({
    base: "",
    plugins: [react(), ...(mode === "https" ? [basicSsl()] : [])],
    server: {
        open: false,
        port: Number(process.env.PORT) || 30668,
        strictPort: true,
    },
}));
