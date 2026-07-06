/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as http from "http";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";

/*
 * The log decoder ships as a standalone CommonJS script. It guards CLI
 * execution with `require.main === module`, so requiring it here only imports
 * its exported helpers without running `main()`.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const decoder = require("../../scripts/decode-logs.cjs");

/**
 * Builds a minimal gzipped tarball buffer containing the provided files. The
 * format mirrors exactly what {@link extractFileFromTarball} parses: a 512-byte
 * header (name at offset 0, octal size at offset 124) followed by the content
 * padded to a 512-byte boundary, terminated by two zero blocks.
 */
function makeTarGz(files: Array<{ name: string; content: string }>): Buffer {
    const blocks: Buffer[] = [];
    for (const file of files) {
        const contentBuf = Buffer.from(file.content, "utf8");
        const header = Buffer.alloc(512);
        header.write(file.name, 0, "utf8");
        header.write(
            contentBuf.length.toString(8).padStart(11, "0") + " ",
            124,
            "utf8"
        );
        blocks.push(header);
        const padded = Buffer.alloc(Math.ceil(contentBuf.length / 512) * 512);
        contentBuf.copy(padded);
        blocks.push(padded);
    }
    // Trailing zero blocks mark the end of the archive.
    blocks.push(Buffer.alloc(1024));
    return zlib.gzipSync(Buffer.concat(blocks));
}

type Route = { status?: number; body: Buffer | string };

/**
 * Starts a throwaway HTTP server on the loopback interface that serves a fixed
 * routing table. Used to emulate the npm registry (metadata + tarball) so the
 * remote code path can be exercised without real network access.
 */
async function startServer(): Promise<{
    base: string;
    setRoutes: (routes: Record<string, Route>) => void;
    close: () => Promise<void>;
}> {
    let routes: Record<string, Route> = {};
    const server = http.createServer((req, res) => {
        const route = req.url ? routes[req.url] : undefined;
        if (!route) {
            res.statusCode = 404;
            res.end("not found");
            return;
        }
        res.statusCode = route.status ?? 200;
        res.end(route.body);
    });

    await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve)
    );
    const address = server.address() as { port: number };

    return {
        base: `http://127.0.0.1:${address.port}`,
        setRoutes: (r) => {
            routes = r;
        },
        close: () =>
            new Promise<void>((resolve) => server.close(() => resolve())),
    };
}

describe("decode-logs script - standalone (remote) use case", () => {
    let server: Awaited<ReturnType<typeof startServer>> | undefined;
    const tempDirs: string[] = [];

    beforeEach(() => {
        decoder.setVerbose(false);
    });

    afterEach(async () => {
        if (server) {
            await server.close();
            server = undefined;
        }
        jest.restoreAllMocks();
        while (tempDirs.length) {
            fs.rmSync(tempDirs.pop() as string, {
                recursive: true,
                force: true,
            });
        }
    });

    it("downloadFile returns a Buffer that preserves raw binary bytes", async () => {
        // A gzipped tarball contains bytes across the full 0x00-0xFF range.
        // Accumulating the response as a string (the original bug) would corrupt
        // any byte that is not valid UTF-8, breaking gunzip downstream.
        const binary = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
        server = await startServer();
        server.setRoutes({ "/binary": { body: binary } });

        const result = await decoder.downloadFile(`${server.base}/binary`);

        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.equals(binary)).toBe(true);
    });

    it("extractFileFromTarball extracts a file from a gzipped tarball buffer", async () => {
        const content = JSON.stringify({
            logStrings: { abc123: "hello world" },
        });
        const tarball = makeTarGz([
            { name: "package/dist/log-strings-mapping.json", content },
        ]);

        const extracted = await decoder.extractFileFromTarball(
            tarball,
            "dist/log-strings-mapping.json"
        );

        expect(extracted).toBe(content);
    });

    it("fetchRemoteMapping merges the transitive @azure/msal-common mapping with own-package precedence", async () => {
        // Isolate the on-disk cache to a temp home directory.
        const tempHome = fs.mkdtempSync(
            path.join(os.tmpdir(), "msal-decoder-home-")
        );
        tempDirs.push(tempHome);
        jest.spyOn(os, "homedir").mockReturnValue(tempHome);

        server = await startServer();
        const base = server.base;

        const browserTarball = makeTarGz([
            {
                name: "package/dist/log-strings-mapping.json",
                content: JSON.stringify({
                    logStrings: {
                        aaaaaa: "browser-A",
                        shared: "browser-shared",
                    },
                }),
            },
        ]);
        const commonTarball = makeTarGz([
            {
                name: "package/dist-browser/log-strings-mapping.json",
                content: JSON.stringify({
                    logStrings: {
                        bbbbbb: "common-B",
                        shared: "common-shared",
                    },
                }),
            },
        ]);

        server.setRoutes({
            "/@azure/msal-browser": {
                body: JSON.stringify({
                    versions: {
                        "1.0.0": {
                            dist: { tarball: `${base}/browser-tarball` },
                            dependencies: { "@azure/msal-common": "2.0.0" },
                        },
                    },
                }),
            },
            "/@azure/msal-common": {
                body: JSON.stringify({
                    versions: {
                        "2.0.0": {
                            dist: { tarball: `${base}/common-tarball` },
                            dependencies: {},
                        },
                    },
                }),
            },
            "/browser-tarball": { body: browserTarball },
            "/common-tarball": { body: commonTarball },
        });

        const result = await decoder.fetchRemoteMapping(
            "@azure/msal-browser",
            "1.0.0",
            base
        );

        expect(result).not.toBeNull();
        // Own (msal-browser) string.
        expect(result.logStrings.aaaaaa).toBe("browser-A");
        // Transitively merged msal-common string that would otherwise be labeled
        // with the msal-browser package name in logs.
        expect(result.logStrings.bbbbbb).toBe("common-B");
        // On a hash collision, the own-package string wins over the dependency's.
        expect(result.logStrings.shared).toBe("browser-shared");
    });

    it("fetchRemoteMapping extracts the lib/custom-auth-path mapping from a remote tarball", async () => {
        // Isolate the on-disk cache to a temp home directory. The decoder reads
        // the cache dir via `require("os").homedir()`, so the spy must target
        // that same module singleton rather than the `import * as os` namespace
        // copy (which ts-jest creates and which a plain spy would not affect).
        const tempHome = fs.mkdtempSync(
            path.join(os.tmpdir(), "msal-decoder-home-")
        );
        tempDirs.push(tempHome);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        jest.spyOn(require("os"), "homedir").mockReturnValue(tempHome);

        server = await startServer();
        const base = server.base;

        // msal-browser publishes a second mapping file under
        // lib/custom-auth-path in addition to dist. The standalone (remote)
        // flow must locate and merge both from the tarball.
        const browserTarball = makeTarGz([
            {
                name: "package/dist/log-strings-mapping.json",
                content: JSON.stringify({
                    logStrings: { aaaaaa: "browser-core" },
                }),
            },
            {
                name: "package/lib/custom-auth-path/log-strings-mapping.json",
                content: JSON.stringify({
                    logStrings: { cccccc: "custom-auth-message" },
                }),
            },
        ]);

        server.setRoutes({
            "/@azure/msal-browser": {
                body: JSON.stringify({
                    versions: {
                        "1.0.0": {
                            dist: { tarball: `${base}/browser-tarball` },
                            dependencies: {},
                        },
                    },
                }),
            },
            "/browser-tarball": { body: browserTarball },
        });

        const result = await decoder.fetchRemoteMapping(
            "@azure/msal-browser",
            "1.0.0",
            base
        );

        expect(result).not.toBeNull();
        expect(result.logStrings.aaaaaa).toBe("browser-core");
        // The custom-auth-path mapping is extracted and merged from the tarball.
        expect(result.logStrings.cccccc).toBe("custom-auth-message");
    });
});

describe("decode-logs script - in-house (local) use case", () => {
    const tempDirs: string[] = [];

    beforeEach(() => {
        decoder.setVerbose(false);
    });

    afterEach(() => {
        while (tempDirs.length) {
            fs.rmSync(tempDirs.pop() as string, {
                recursive: true,
                force: true,
            });
        }
    });

    it("getLocalMappingPaths resolves dist and lib/custom-auth-path (not dist/custom-auth-path)", () => {
        const scriptDir = path.join("root", "scripts");
        const paths: string[] = decoder.getLocalMappingPaths(
            "@azure/msal-browser",
            scriptDir
        );

        expect(paths).toContain(
            path.join(scriptDir, "..", "dist", "log-strings-mapping.json")
        );
        expect(paths).toContain(
            path.join(
                scriptDir,
                "..",
                "lib",
                "custom-auth-path",
                "log-strings-mapping.json"
            )
        );
        // The custom-auth mapping is emitted under lib/, never dist/.
        expect(
            paths.some((p) => p.includes(path.join("dist", "custom-auth-path")))
        ).toBe(false);
    });

    it("loadLocalMapping loads a mapping from a sibling directory relative to the script", () => {
        const pkgDir = fs.mkdtempSync(
            path.join(os.tmpdir(), "msal-decoder-pkg-")
        );
        tempDirs.push(pkgDir);
        const scriptDir = path.join(pkgDir, "scripts");
        const distDir = path.join(pkgDir, "dist");
        fs.mkdirSync(scriptDir);
        fs.mkdirSync(distDir);
        fs.writeFileSync(
            path.join(distDir, "log-strings-mapping.json"),
            JSON.stringify({ logStrings: { xxxxxx: "local-message" } })
        );

        const mapping = decoder.loadLocalMapping(
            "@azure/msal-browser",
            scriptDir
        );

        expect(mapping).not.toBeNull();
        expect(mapping.logStrings.xxxxxx).toBe("local-message");
    });

    it("decodeLogEntries falls back across mappings when a hash is not in its own module@version mapping", () => {
        // This is the mechanism that let local runs decode msal-common strings
        // that are labeled with the msal-browser package name.
        const line = "t : [] : @azure/msal-browser@1.0.0 : Trace - aaaaaa";
        const parsed = decoder.parseLogLine(line);
        const entries = [{ ...parsed, lineIndex: 0 }];
        const allLines = [line];

        const mappings = {
            // The own module@version mapping exists but does not contain the
            // hash, so the decoder must fall back to searching the other
            // package mappings to resolve it.
            "@azure/msal-browser@1.0.0": {
                logStrings: {},
            },
            "@azure/msal-common@2.0.0": {
                logStrings: { aaaaaa: "resolved from msal-common" },
            },
        };

        const { decodedLines, stats } = decoder.decodeLogEntries(
            entries,
            mappings,
            allLines,
            false
        );

        expect(decodedLines[0]).toContain("resolved from msal-common");
        expect(stats.decoded).toBe(1);
    });

    it("decodeLogEntries decodes from the module-specific mapping when present", () => {
        const line = "t : [] : @azure/msal-browser@1.0.0 : Trace - aaaaaa";
        const parsed = decoder.parseLogLine(line);
        const entries = [{ ...parsed, lineIndex: 0 }];
        const allLines = [line];

        const mappings = {
            "@azure/msal-browser@1.0.0": {
                logStrings: { aaaaaa: "initialize called" },
            },
        };

        const { decodedLines, stats } = decoder.decodeLogEntries(
            entries,
            mappings,
            allLines,
            false
        );

        expect(decodedLines[0]).toContain("initialize called");
        expect(stats.decoded).toBe(1);
    });
});
