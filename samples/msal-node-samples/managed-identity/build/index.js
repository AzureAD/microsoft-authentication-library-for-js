"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const msal_node_1 = require("@azure/msal-node");
const config = {
    system: {
        loggerOptions: {
            logLevel: msal_node_1.LogLevel.Verbose,
        },
    },
};
const managedIdentityIdParams = {
    userAssignedClientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
};
const systemAssignedManagedIdentityApplication = new msal_node_1.ManagedIdentityApplication(config);
const userAssignedClientIdManagedIdentityApplication = new msal_node_1.ManagedIdentityApplication(Object.assign(Object.assign({}, config), { managedIdentityIdParams }));
const managedIdentityRequestParams = {
    resource: "https://management.azure.com",
};
// self executing anonymous function, needed for async/await usage
(() => __awaiter(void 0, void 0, void 0, function* () {
    // system assigned
    try {
        const tokenResponse = yield systemAssignedManagedIdentityApplication.acquireToken(managedIdentityRequestParams);
        console.log(tokenResponse);
    }
    catch (error) {
        console.log(error);
        throw error;
    }
    // user assigned client id
    try {
        const tokenResponse = yield userAssignedClientIdManagedIdentityApplication.acquireToken(managedIdentityRequestParams);
        console.log(tokenResponse);
    }
    catch (error) {
        console.log(error);
        throw error;
    }
}))();
