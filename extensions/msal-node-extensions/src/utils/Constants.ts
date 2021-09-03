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

    /**
     * Test data used to verify underlying persistence mechanism
     */
    PERSISTENCE_TEST_DATA: "Dummy data to verify underlying persistence mechanism",

    /**
     * This is the value of a the guid if the process is being ran by the root user
     */
    LINUX_ROOT_USER_GUID: 0,

    /**
     * List of environment variables
     */
    ENVIRONMENT: {
        HOME: "HOME",
        LOGNAME: "LOGNAME",
        USER: "USER",
        LNAME: "LNAME",
        USERNAME: "USERNAME",
        PLATFORM: "platform",
        LOCAL_APPLICATION_DATA: "LOCALAPPDATA"
    },

    // Name of the default cache file
    DEFAULT_CACHE_FILE_NAME: "cache.json"
};

export enum Platform {
    WINDOWS = "win32",
    LINUX = "linux",
    MACOS = "darwin"
};
