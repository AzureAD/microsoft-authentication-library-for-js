/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    DEFAULT_MANAGED_IDENTITY_ID,
    ManagedIdentityIdType,
} from "../utils/Constants";

export class ManagedIdentityId {
    private _id: string;
    private idType: ManagedIdentityIdType;
    private isUserAssignedId: boolean;

    constructor(idType: ManagedIdentityIdType, id?: string) {
        this.idType = idType;
        this._id = id || DEFAULT_MANAGED_IDENTITY_ID;

        switch (idType) {
            case ManagedIdentityIdType.SYSTEM_ASSIGNED:
                this.isUserAssignedId = false;
                break;
            case ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID:
            case ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID:
            case ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID:
                this.isUserAssignedId = true;
                break;
            default:
                // TODO: throw error
                break;
        }
    }

    /**
     * Creates an instance of ManagedIdentityId for a system assigned managed identity
     */
    public static createSystemAssigned(): ManagedIdentityId {
        return new ManagedIdentityId(ManagedIdentityIdType.SYSTEM_ASSIGNED);
    }

    /**
     * Creates an instance of ManagedIdentityId for a user assigned managed identity from a client id
     * @param clientId Client id of the user assigned managed identity assigned to the azure resource
     * @returns Instance of ManagedIdentityId
     */
    public static createUserAssignedClientId(
        clientId: string
    ): ManagedIdentityId {
        // TODO: throw exception if clientId is null
        return new ManagedIdentityId(
            ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID,
            clientId
        );
    }

    /**
     * Creates an instance of ManagedIdentityId for a user assigned managed identity from a resource id
     * @param resourceId Resource id of the user assigned managed identity assigned to the azure resource
     * @returns Instance of ManagedIdentityId
     */
    public static createUserAssignedResourceId(
        resourceId: string
    ): ManagedIdentityId {
        // TODO: throw exception if resourceID is null
        return new ManagedIdentityId(
            ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID,
            resourceId
        );
    }

    /**
     * Creates an instance of ManagedIdentityId for a user assigned managed identity from an object id
     * @param objectId Object id of the user assigned managed identity assigned to the azure resource
     * @returns Instance of ManagedIdentityId
     */
    public static createUserAssignedObjectId(
        objectId: string
    ): ManagedIdentityId {
        // TODO: throw exception if objectId is null
        return new ManagedIdentityId(
            ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID,
            objectId
        );
    }

    public get id(): string {
        return this._id;
    }
}
