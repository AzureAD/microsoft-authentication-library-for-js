/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const Constants = {

    /**
     * An existing file was the target of an operation that required that the target not exist
     */
    EEXIST_ERROR: "EEXIST",

    /**
     * No such file or directory: Commonly raised by fs operations to indicate that a component
     * of the specified pathname does not exist. No entity (file or directory) could be found
     * by the given path
     */
    ENOENT_ERROR: "ENOENT",

    /**
     * Operation not permitted. An attempt was made to perform an operation that requires 
     * elevated privileges. 
     */
    EPERM_ERROR: "EPERM",
    
    /**
     * Default service name for using MSAL Keytar
     */
    DEFAULT_SERVICE_NAME: "msal-node-extensions",
};
