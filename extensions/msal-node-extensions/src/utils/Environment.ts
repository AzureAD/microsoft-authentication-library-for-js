/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import path from "path";
import { Constants, Platform } from "./Constants.js";
import { PersistenceError } from "../error/PersistenceError.js";

export class Environment {
    static get homeEnvVar(): string {
        return this.getEnvironmentVariable(Constants.ENVIRONMENT.HOME);
    }

    static get lognameEnvVar(): string {
        return this.getEnvironmentVariable(Constants.ENVIRONMENT.LOGNAME);
    }

    static get userEnvVar(): string {
        return this.getEnvironmentVariable(Constants.ENVIRONMENT.USER);
    }

    static get lnameEnvVar(): string {
        return this.getEnvironmentVariable(Constants.ENVIRONMENT.LNAME);
    }

    static get usernameEnvVar(): string {
        return this.getEnvironmentVariable(Constants.ENVIRONMENT.USERNAME);
    }

    static getEnvironmentVariable(name: string): string {
        return process.env[name] || "";
    }

    static getEnvironmentPlatform(): string {
        return process.platform;
    }

    static isWindowsPlatform(): boolean {
        return this.getEnvironmentPlatform() === Platform.WINDOWS;
    }

    static isLinuxPlatform(): boolean {
        return this.getEnvironmentPlatform() === Platform.LINUX;
    }

    static isMacPlatform(): boolean {
        return this.getEnvironmentPlatform() === Platform.MACOS;
    }

    static isLinuxRootUser(): boolean {
        if (typeof process.getuid !== "function") {
            return false;
        }

        return process.getuid() === Constants.LINUX_ROOT_USER_GUID;
    }

    static getUserRootDirectory(): string | null {
        return !this.isWindowsPlatform()
            ? this.getUserHomeDirOnUnix()
            : this.getUserHomeDirOnWindows();
    }

    static getUserHomeDirOnWindows(): string {
        return this.getEnvironmentVariable(
            Constants.ENVIRONMENT.LOCAL_APPLICATION_DATA
        );
    }

    static getUserHomeDirOnUnix(): string | null {
        if (this.isWindowsPlatform()) {
            throw PersistenceError.createNotSupportedError(
                "Getting the user home directory for unix is not supported in windows"
            );
        }

        if (this.homeEnvVar) {
            return this.homeEnvVar;
        }

        let username = null;
        if (this.lognameEnvVar) {
            username = this.lognameEnvVar;
        } else if (this.userEnvVar) {
            username = this.userEnvVar;
        } else if (this.lnameEnvVar) {
            username = this.lnameEnvVar;
        } else if (this.usernameEnvVar) {
            username = this.usernameEnvVar;
        }

        if (this.isMacPlatform()) {
            return username ? path.join("/Users", username) : null;
        } else if (this.isLinuxPlatform()) {
            if (this.isLinuxRootUser()) {
                return "/root";
            } else {
                return username ? path.join("/home", username) : null;
            }
        } else {
            throw PersistenceError.createNotSupportedError(
                "Getting the user home directory for unix is not supported in windows"
            );
        }
    }
}
