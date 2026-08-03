import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The nested app is served in an iframe embedded by the host app.
export default defineConfig({
    base: "",
    plugins: [react()],
    server: {
        open: false,
        port: Number(process.env.PORT) || 30667,
    },
});
