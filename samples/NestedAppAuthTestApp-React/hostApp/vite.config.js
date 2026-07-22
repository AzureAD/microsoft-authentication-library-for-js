import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The host app is the top frame and embeds the nested app in an iframe.
export default defineConfig({
    base: "",
    plugins: [react()],
    server: {
        open: false,
        port: Number(process.env.PORT) || 30668,
    },
});
