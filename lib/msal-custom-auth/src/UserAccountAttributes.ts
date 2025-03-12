/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidAttributeErrorCode, UserAccountAttributeError } from "./core/error/UserAccountAttributeError.js";

/**
 * Represents the attributes of a user account.
 */
export class UserAccountAttributes {
    private attributes: Record<string, string>;

    constructor() {
        this.attributes = {};
    }

    /**
     * Sets a custom attribute on the user account.
     * @param {string} name - The name of the attribute.
     * @param {string} value - The value of the attribute.
     * @returns {void}
     */
    setCustomAttribute(name: string, value: string): void {
        if (!name) {
            throw new UserAccountAttributeError(InvalidAttributeErrorCode, name, value);
        }

        this.attributes[name] = value;
    }

    /**
     * Sets the city attribute on the user account.
     * @param {string} value - The city of the user.
     * @returns {void}
     */
    setCity(value: string): void {
        this.attributes["city"] = value;
    }

    /**
     * Sets the country attribute on the user account.
     * @param {string} value - The country of the user.
     * @returns {void}
     */
    setCountry(value: string): void {
        this.attributes["country"] = value;
    }

    /**
     * Sets the display name attribute on the user account.
     * @param {string} value - The display name of the user.
     * @returns {void}
     */
    setDisplayName(value: string): void {
        this.attributes["displayName"] = value;
    }

    /**
     * Sets the given name attribute on the user account.
     * @param {string} value - The given name of the user.
     * @returns {void}
     */
    setGivenName(value: string): void {
        this.attributes["givenName"] = value;
    }

    /**
     * Sets the job title attribute on the user account.
     * @param {string} value - The job title of the user.
     * @returns {void}
     */
    setJobTitle(value: string): void {
        this.attributes["jobTitle"] = value;
    }

    /**
     * Sets the postal code attribute on the user account.
     * @param {string} value - The postal code of the user.
     * @returns {void}
     */
    setPostalCode(value: string): void {
        this.attributes["postalCode"] = value;
    }

    /**
     * Sets the state attribute on the user account.
     * @param {string} value - The state of the user.
     * @returns {void}
     */
    setState(value: string): void {
        this.attributes["state"] = value;
    }

    /**
     * Sets the street address attribute on the user account.
     * @param {string} value - The street address of the user.
     * @returns {void}
     */
    setStreetAddress(value: string): void {
        this.attributes["streetAddress"] = value;
    }

    /**
     * Sets the surname attribute on the user account.
     * @param {string} value - The surname of the user.
     * @returns {void}
     */
    setSurname(value: string): void {
        this.attributes["surname"] = value;
    }

    /**
     * Return the attributes as a Record object.
     * @returns {Record<string, string>} A set of user account attributes.
     */
    toRecord(): Record<string, string> {
        return this.attributes;
    }
}
