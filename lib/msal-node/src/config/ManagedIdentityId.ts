/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../error/ManagedIdentityError";
import {
    DEFAULT_MANAGED_IDENTITY_ID,
    ManagedIdentityIdType,
} from "../utils/Constants";
import { ManagedIdentityIdParams } from "./Configuration";

export class ManagedIdentityId {
    private id: string;
    private idType: ManagedIdentityIdType;
    private isUserAssignedId: boolean;

    constructor(managedIdentityIdParams?: ManagedIdentityIdParams) {
        const userAssignedClientId =
            managedIdentityIdParams?.userAssignedClientId;
        const userAssignedResourceId =
            managedIdentityIdParams?.userAssignedResourceId;
        const userAssignedObjectId =
            managedIdentityIdParams?.userAssignedObjectId;

        if (userAssignedClientId) {
            if (userAssignedResourceId || userAssignedObjectId) {
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidManagedIdentityIdType
                );
            }

            this.id = userAssignedClientId;
            this.idType = ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID;
            this.isUserAssignedId = true;
        } else if (userAssignedResourceId) {
            if (userAssignedClientId || userAssignedObjectId) {
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidManagedIdentityIdType
                );
            }

            this.id = userAssignedResourceId;
            this.idType = ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID;
            this.isUserAssignedId = true;
        } else if (userAssignedObjectId) {
            if (userAssignedClientId || userAssignedResourceId) {
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidManagedIdentityIdType
                );
            }

            this.id = userAssignedObjectId;
            this.idType = ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID;
            this.isUserAssignedId = true;
        } else {
            this.id = DEFAULT_MANAGED_IDENTITY_ID;
            this.idType = ManagedIdentityIdType.SYSTEM_ASSIGNED;
            this.isUserAssignedId = false;
        }
    }

    /**
     * Creates an instance of ManagedIdentityId for a system assigned managed identity
     */
    public static createSystemAssigned(): ManagedIdentityId {
        return new ManagedIdentityId();
    }

    // /**
    //  * Creates an instance of ManagedIdentityId for a user assigned managed identity from a client id
    //  * @param clientId Client id of the user assigned managed identity assigned to the azure resource
    //  * @returns Instance of ManagedIdentityId
    //  */
    // public static createUserAssignedClientId(
    //     clientId: string
    // ): ManagedIdentityId {
    //     if (!clientId) {
    //         throw createManagedIdentityError(
    //             ManagedIdentityErrorCodes.missingId
    //         );
    //     }

    /*
     *     return new ManagedIdentityId({ userAssignedClientId: clientId });
     * }
     */

    // /**
    //  * Creates an instance of ManagedIdentityId for a user assigned managed identity from a resource id
    //  * @param resourceId Resource id of the user assigned managed identity assigned to the azure resource
    //  * @returns Instance of ManagedIdentityId
    //  */
    // public static createUserAssignedResourceId(
    //     resourceId: string
    // ): ManagedIdentityId {
    //     if (!resourceId) {
    //         throw createManagedIdentityError(
    //             ManagedIdentityErrorCodes.missingId
    //         );
    //     }

    /*
     *     return new ManagedIdentityId({ userAssignedResourceId: resourceId });
     * }
     */

    // /**
    //  * Creates an instance of ManagedIdentityId for a user assigned managed identity from an object id
    //  * @param objectId Object id of the user assigned managed identity assigned to the azure resource
    //  * @returns Instance of ManagedIdentityId
    //  */
    // public static createUserAssignedObjectId(
    //     objectId: string
    // ): ManagedIdentityId {
    //     if (!objectId) {
    //         throw createManagedIdentityError(
    //             ManagedIdentityErrorCodes.missingId
    //         );
    //     }

    /*
     *     return new ManagedIdentityId({ userAssignedObjectId: objectId });
     * }
     */

    public get getId(): string {
        return this.id;
    }

    public get getIdType(): ManagedIdentityIdType {
        return this.idType;
    }

    public get getIsUserAssignedId(): boolean {
        return this.isUserAssignedId;
    }
}
