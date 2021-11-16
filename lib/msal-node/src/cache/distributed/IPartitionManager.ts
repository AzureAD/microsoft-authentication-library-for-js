/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface IPartitionManager {
    /**
     * This function will fetch the partition key from the cache as
     * most suited for the application.
     * 
     * See [here](https://identitydivision.visualstudio.com/DevEx/_git/AuthLibrariesApiReview?path=/MSALJS_V2/Distributed-Token-Cache.md&version=GBderisen/node-distributed-caching&_a=preview&anchor=helpers-for-acquiring-the-partition-key) for more pointers on the same.
     * 
     * @returns Promise<string|null>
     */
    getKey(): Promise<string|null>
  
    /**
     * This function given the account entity would extract the 
     * appropriate partition key best suited for the
     * application.
     * 
     * @param accountEntity: AccountInfo
     * @returns Promise<string|null>
     */
    extractKey(accountEntity: AccountInfo): Promise<string|null>
}
  