/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseOperatingContext } from "./BaseOperatingContext";
import { IBridgeProxy } from "../naa/IBridgeProxy";
import { BridgeProxy } from "../naa/BridgeProxy";
import { AccountInfo } from "../naa/AccountInfo";

export class TeamsAppOperatingContext extends BaseOperatingContext {
    protected bridgeProxy: IBridgeProxy | undefined = undefined;
    protected activeAccount: AccountInfo | undefined = undefined;

    /*
     * TODO: Once we have determine the bundling code return here to specify the name of the bundle
     * containing the implementation for this operating context
     */
    static readonly MODULE_NAME: string = "";

    /**
     * Unique identifier for the operating context
     */
    static readonly ID: string = "TeamsAppOperatingContext";

    /**
     * Return the module name.  Intended for use with import() to enable dynamic import
     * of the implementation associated with this operating context
     * @returns
     */
    getModuleName(): string {
        return TeamsAppOperatingContext.MODULE_NAME;
    }
    /**
     * Returns the unique identifier for this operating context
     * @returns string
     */
    getId(): string {
        return TeamsAppOperatingContext.ID;
    }

    getBridgeProxy(): IBridgeProxy | undefined {
        return this.bridgeProxy;
    }

    getActiveAccount(): AccountInfo | undefined {
        return this.activeAccount;
    }

    setActiveAccount(account: AccountInfo): void {
        this.activeAccount = account;
    }

    /**
     * Checks whether the operating context is available.
     * Confirms that the code is running a browser rather.  This is required.
     * @returns Promise<boolean> indicating whether this operating context is currently available.
     */
    async initialize(): Promise<boolean> {
        /*
         * TODO: Add implementation to check for presence of inject Nested App Auth Bridge JavaScript interface
         *
         */
        try {
            if (typeof window !== "undefined") {
                const bridgeProxy: IBridgeProxy = await BridgeProxy.create();
                /*
                 * Because we want single sign on we need to attempt to
                 * grab the active account as part of initialization
                 * this.activeAccount = await bridgeProxy.getActiveAccount();
                 */
                try {
                    this.activeAccount = await bridgeProxy.getActiveAccount();
                } catch (e) {
                    this.activeAccount = undefined;
                }
                this.bridgeProxy = bridgeProxy;
                this.available = bridgeProxy !== undefined;
            } else {
                this.available = false;
            }
        } catch (e) {
            this.available = false;
        } finally {
            return this.available;
        }
    }
}
