/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { spawn, ChildProcess } from "child_process";
import path from "path";

/**
 * Starts a CORS proxy server for testing purposes
 * 
 * @param {string} domain - The domain for the CORS proxy (e.g., "MSIDLABCIAM6")
 * @param {string} tenantId - The tenant ID for the CORS proxy
 * @param {number} port - The port to run the CORS proxy on
 * @returns {Promise<ChildProcess>} A Promise that resolves with the proxy server process
 */
export function startCorsProxy(
    domain: string = "MSIDLABCIAM6", 
    tenantId: string = "fe362aec-5d43-45d1-b730-9755e60dc3b9", 
    port: number = 30001
): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
        try {
            // Start the CORS proxy server
            const corsProcess = spawn(
                "node",
                [
                    path.join(__dirname, "../cors.js"),
                    "-d",
                    domain,
                    "-t",
                    tenantId,
                    "-p",
                    port.toString(),
                ],
                {
                    stdio: "inherit",
                    cwd: path.join(__dirname, ".."),
                }
            );
            
            // Set up error handling
            corsProcess.on('error', (err) => {
                console.error('Failed to start CORS proxy:', err);
                reject(err);
            });
            
            // Wait a bit to ensure the proxy is up before resolving the promise
            setTimeout(() => {
                console.log(`CORS proxy started on port ${port} for domain ${domain}`);
                resolve(corsProcess);
            }, 2000);

        } catch (error) {
            console.error('Error starting CORS proxy:', error);
            reject(error);
        }
    });
}

/**
 * Stops the CORS proxy server
 * 
 * @param {ChildProcess | null} corsProcess - The CORS proxy process to stop
 */
export function stopCorsProxy(corsProcess: ChildProcess | null): void {
    if (corsProcess) {
        try {
            corsProcess.kill();
            console.log('CORS proxy stopped');
        } catch (error) {
            console.error('Error stopping CORS proxy:', error);
        }
    }
}


