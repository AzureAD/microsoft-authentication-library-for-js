/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class UserAttribute {
    constructor(
        public name?: string,
        public type?: string,
        public required?: boolean,
        public options?: UserAttributeOption
    ) {}
}

export class UserAttributeOption {
    constructor(public regex?: string) {
        this.regex = regex;
    }
}
