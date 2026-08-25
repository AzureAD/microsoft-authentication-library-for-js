/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface SignUpAttributeV2 {
    attributeId: string;
    inputType?: string;
    required?: boolean;
    canChange?: boolean;
    label?: string;
    regex?: string;
}

export interface SignUpStartApiResultV2 {
    continuationToken: string;
    submitAttributesHref: string;
    attributes?: SignUpAttributeV2[];
}
