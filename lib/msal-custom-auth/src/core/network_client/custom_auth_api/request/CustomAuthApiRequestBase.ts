/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    Constants,
    ServerTelemetryManager,
} from "@azure/msal-browser";
import {
    ChallengeType,
    DefaultPackageInfo,
    HttpHeaderKeys,
} from "../../../../CustomAuthConstants.js";
import { ArgumentValidator } from "../../../utils/ArgumentValidator.js";

export abstract class CustomAuthApiRequestBase {
    protected constructor(
        public correlationId: string,
        private telemetryManager: ServerTelemetryManager
    ) {
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "correlationId",
            correlationId
        );

        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "telemetryManager",
            telemetryManager,
            correlationId
        );

        this.setCommonApiHeaders();
    }

    public headers: Record<string, string> = {};

    protected static getChallengeTypes(
        configuredChallengeTypes: string[]
    ): string {
        let challengeTypes = configuredChallengeTypes;

        if (!challengeTypes || challengeTypes.length === 0) {
            challengeTypes = [
                ChallengeType.PASSWORD,
                ChallengeType.OOB,
                ChallengeType.REDIRECT,
            ];
        }

        return challengeTypes.join(" ");
    }

    protected static getScopes(scopes: string[]): string[] {
        if (!scopes || scopes.length === 0) {
            return [
                Constants.OPENID_SCOPE,
                Constants.PROFILE_SCOPE,
                Constants.OFFLINE_ACCESS_SCOPE,
            ];
        }

        return scopes;
    }

    private setCommonApiHeaders(): void {
        this.headers = {};

        // Correlation id header
        this.headers[AADServerParamKeys.CLIENT_REQUEST_ID] = this.correlationId;

        // Client info headers
        this.headers[AADServerParamKeys.X_CLIENT_SKU] = DefaultPackageInfo.SKU;
        this.headers[AADServerParamKeys.X_CLIENT_VER] =
            DefaultPackageInfo.VERSION;
        this.headers[AADServerParamKeys.X_CLIENT_OS] = DefaultPackageInfo.OS;
        this.headers[AADServerParamKeys.X_CLIENT_CPU] = DefaultPackageInfo.CPU;

        // API telemetry headers
        this.headers[AADServerParamKeys.X_CLIENT_CURR_TELEM] =
            this.telemetryManager.generateCurrentRequestHeaderValue();
        this.headers[AADServerParamKeys.X_CLIENT_LAST_TELEM] =
            this.telemetryManager.generateLastRequestHeaderValue();

        // Content-Type header
        this.headers[HttpHeaderKeys.CONTENT_TYPE] =
            "application/x-www-form-urlencoded";
    }
}
