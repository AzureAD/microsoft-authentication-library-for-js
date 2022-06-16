/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PersistenceError } from "../error/PersistenceError";
import { Constants } from "../utils/Constants";
import { IPersistence } from "./IPersistence";

export abstract class BasePersistence {
    public abstract createForPersistenceValidation(): Promise<IPersistence>; 

    public async verifyPersistence(): Promise<boolean> {
        // We are using a different location for the test to avoid overriding the functional cache
        const persistenceValidator = await this.createForPersistenceValidation();

        try {
            await persistenceValidator.save(Constants.PERSISTENCE_TEST_DATA);

            const retrievedDummyData = await persistenceValidator.load();

            if (!retrievedDummyData) {
                throw PersistenceError.createCachePersistenceError(
                    "Persistence check failed. Data was written but it could not be read. " +
                    "Possible cause: on Linux, LibSecret is installed but D-Bus isn't running because it cannot be started over SSH."
                );
            }

            if (retrievedDummyData !== Constants.PERSISTENCE_TEST_DATA) {
                throw PersistenceError.createCachePersistenceError(
                    `Persistence check failed. Data written ${Constants.PERSISTENCE_TEST_DATA} is different from data read ${retrievedDummyData}`
                );
            }
            await persistenceValidator.delete();
            return true;
        } catch (e) {
            throw PersistenceError.createCachePersistenceError(`Verifing persistence failed with the error: ${e}`);
        }
    }

}
