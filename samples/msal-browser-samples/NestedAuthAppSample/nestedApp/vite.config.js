import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import sampleConfig from "../sampleConfig.cjs";

// The nested app is served in an iframe embedded by the host app.
export default defineConfig(({ mode }) => ({
    base: "",
    plugins: [react(), ...(mode === "https" ? [basicSsl()] : [])],
    server: {
        open: false,
        port: Number(process.env.PORT) || sampleConfig.NESTED_APP_PORT,
        strictPort: true,
    },
}));
