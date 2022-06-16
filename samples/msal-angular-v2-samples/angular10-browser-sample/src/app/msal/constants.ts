import { InjectionToken } from "@angular/core";

export const MSAL_INSTANCE = new InjectionToken<string>("MSAL_INSTANCE");

export const MSAL_GUARD_CONFIG = new InjectionToken<string>("MSAL_GUARD_CONFIG");

export const MSAL_INTERCEPTOR_CONFIG = new InjectionToken<string>("MSAL_INTERCEPTOR_CONFIG");
