"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
var msal_service_1 = require("./msal.service");
var msal_guard_service_1 = require("./msal-guard.service");
var broadcast_service_1 = require("./broadcast.service");
var MsalModule = /** @class */ (function () {
    function MsalModule() {
    }
    MsalModule_1 = MsalModule;
    MsalModule.forRoot = function (config) {
        return {
            ngModule: MsalModule_1,
            providers: [
                { provide: msal_service_1.MSAL_CONFIG, useValue: config }, msal_service_1.MsalService, { provide: Window, useValue: window }
            ]
        };
    };
    MsalModule = MsalModule_1 = __decorate([
        core_1.NgModule({
            imports: [common_1.CommonModule],
            declarations: [],
            providers: [msal_guard_service_1.MsalGuard, broadcast_service_1.BroadcastService],
        })
    ], MsalModule);
    return MsalModule;
    var MsalModule_1;
}());
exports.MsalModule = MsalModule;
