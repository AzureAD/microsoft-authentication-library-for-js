/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import path from "path";
import { Constants, Platform } from "./Constants";
import { PersistenceError } from "../error/PersistenceError";
import { StringUtils } from "@azure/msal-common";

export class Environment {
    static get homeEnvVar() {
        return this.getEnvironmentVariable(Constants.ENVIRONMENT.HOME);
    }
    
    static get lognameEnvVar() {
        return this.getEnvironmentVariable(Constants.ENVIRONMENT.LOGNAME);
    }

    static get userEnvVar() {
        return this.getEnvironmentVariable(Constants.ENVIRONMENT.USER);
    }

    static get lnameEnvVar() {
        return this.getEnvironmentVariable(Constants.ENVIRONMENT.LNAME);
    }

    static get usernameEnvVar() {
        return this.getEnvironmentVariable(Constants.ENVIRONMENT.USERNAME);
    }

    static getEnvironmentVariable(name: string): string {
        return process.env[name];
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
        return process.getuid() == Constants.LINUX_ROOT_USER_GUID;
    }

    static getUserRootDirectory(): string {
        return !this.isWindowsPlatform ?
            this.getUserHomeDirOnUnix() :
            this.getUserHomeDirOnWindows()
    }

    static getUserHomeDirOnWindows(): string {
        return this.getEnvironmentVariable(Constants.ENVIRONMENT.LOCAL_APPLICATION_DATA);
    }

    static getUserHomeDirOnUnix(): string | null {
        if (this.isWindowsPlatform()) {
            throw PersistenceError.createNotSupportedError("Getting the user home directory for unix is not supported in windows")
        }

        if (!StringUtils.isEmpty(this.homeEnvVar)) {
            return this.homeEnvVar;
        }

        let username = null;
        if (!StringUtils.isEmpty(this.lognameEnvVar)) {
            username = this.lognameEnvVar;
        } else if (!StringUtils.isEmpty(this.userEnvVar)) {
            username = this.userEnvVar;
        } else if (!StringUtils.isEmpty(this.lnameEnvVar)) {
            username = this.lnameEnvVar;
        } else if (!StringUtils.isEmpty(this.usernameEnvVar)) {
            username = this.usernameEnvVar;
        }

        if (this.isMacPlatform()) {
            return !StringUtils.isEmpty(username) ? path.join("/Users", username) : null;
        } else if (this.isLinuxPlatform()) {
            if (this.isLinuxRootUser()) {
                return "/root";
            } else {
                return !StringUtils.isEmpty(username) ? path.join("/home", username) : null;
            }
        } else {
            throw PersistenceError.createNotSupportedError("Getting the user home directory for unix is not supported in windows")
        }

    }
}
