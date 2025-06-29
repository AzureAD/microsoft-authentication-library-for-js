/*
 * UserAccountAttributes implementation for MSAL Native Auth Sample
 * 
 * This is a simplified implementation of the MSAL UserAccountAttributes class
 * that provides the necessary methods for sign-up with first name and last name.
 */

export class UserAccountAttributes {
    constructor() {
        this.attributes = {};
    }

    setCustomAttribute(name, value) {
        if (!name) {
            throw new Error("Invalid attribute name");
        }

        this.attributes[name] = value;
    }

    setGivenName(value) {
        this.attributes["givenName"] = value;
    }

    setSurname(value) {
        this.attributes["surname"] = value;
    }

    setDisplayName(value) {
        this.attributes["displayName"] = value;
    }

    toRecord() {
        return this.attributes;
    }
}
