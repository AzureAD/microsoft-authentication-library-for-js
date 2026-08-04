/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Discriminator for the category of a native auth V2 error.
 *
 * Stored on {@link CustomAuthV2Error.errorType} (classified once at
 * construction) and compared against by the error's public isXxx() detectors,
 * mirroring Android's stored-error-type model. Not itself part of the public
 * export surface.
 */
export type CustomAuthV2ErrorType =
    | "notImplemented"
    | "userNotFound"
    | "invalidUsername"
    | "invalidCode"
    | "invalidChallenge"
    | "invalidPassword"
    | "invalidCredentials"
    | "userDoesNotHavePassword"
    | "userAlreadyExists"
    | "authMethodBlocked"
    | "verificationContactBlocked"
    | "invalidInput"
    | "invalidAttributes"
    | "browserRequired"
    | "generalError";
