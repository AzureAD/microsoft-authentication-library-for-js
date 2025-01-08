/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    ServerTelemetryManager,
} from "@azure/msal-browser";
import {
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

        this.setCommonApiHeaders();
    }

    public headers: Record<string, string> = {};

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
