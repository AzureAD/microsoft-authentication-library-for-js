/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UserAccountAttributeError } from "./core/error/UserAccountAttributeError.js";
import { InvalidAttributeErrorCode } from "./core/error/UserAccountAttributeErrorCodes.js";

export class UserAccountAttributes {
    private attributes: Record<string, string>;

    constructor() {
        this.attributes = {};
    }

    setCustomAttribute(name: string, value: string): void {
        if (!name) {
            throw new UserAccountAttributeError(
                InvalidAttributeErrorCode,
                name,
                value
            );
        }

        this.attributes[name] = value;
    }

    setCity(value: string): void {
        this.attributes["city"] = value;
    }

    setCountry(value: string): void {
        this.attributes["country"] = value;
    }

    setDisplayName(value: string): void {
        this.attributes["displayName"] = value;
    }

    setGivenName(value: string): void {
        this.attributes["givenName"] = value;
    }

    setJobTitle(value: string): void {
        this.attributes["jobTitle"] = value;
    }

    setPostalCode(value: string): void {
        this.attributes["postalCode"] = value;
    }

    setState(value: string): void {
        this.attributes["state"] = value;
    }

    setStreetAddress(value: string): void {
        this.attributes["streetAddress"] = value;
    }

    setSurname(value: string): void {
        this.attributes["surname"] = value;
    }

    toRecord(): Record<string, string> {
        return this.attributes;
    }
}
