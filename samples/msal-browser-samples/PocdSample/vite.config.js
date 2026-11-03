/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { defineConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";

const dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
    root: "app",
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(dirname, "app/index.html"),
                redirect: resolve(dirname, "app/redirect.html"),
            },
        },
    },
});
