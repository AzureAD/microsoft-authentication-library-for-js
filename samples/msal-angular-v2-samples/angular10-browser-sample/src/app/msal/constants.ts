import { InjectionToken } from "@angular/core";

export const MSAL_INSTANCE = new InjectionToken<string>("MSAL_INSTANCE");

export const MSAL_GUARD_CONFIG = new InjectionToken<string>("MSAL_GUARD_CONFIG");

export enum InteractionType {
    REDIRECT = "redirect",
    POPUP = "popup",
    SILENT = "silent"
}
