import { Component, inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  MSAL_BROADCAST_CONFIG,
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
} from "./constants";

describe("Injection Tokens", () => {
  it("should produce helpful type errors on mismatch", async () => {
    // These are all cases where a type error is expected.
    // While Jest cannot verify the type errors, we can use TypeScript's
    // type checking to verify that the errors are present.
    @Component({
      selector: "app-strongly-typed-functional-injection",
      template: "",
    })
    class MistypedFunctionalInjection {
      // @ts-expect-error MSAL_INSTANCE is not a string.
      msalInstance: string = inject(MSAL_INSTANCE);
      // @ts-expect-error MSAL_GUARD_CONFIG is not a string.
      guardConfig: string = inject(MSAL_GUARD_CONFIG);
      // @ts-expect-error MSAL_INTERCEPTOR_CONFIG is not a string.
      interceptorConfig: string = inject(MSAL_INTERCEPTOR_CONFIG);
      // @ts-expect-error MSAL_BROADCAST_CONFIG is not a string.
      broadcastConfig: string = inject(MSAL_BROADCAST_CONFIG);
    }

    await TestBed.configureTestingModule({
      providers: [
        MSAL_INSTANCE,
        MSAL_GUARD_CONFIG,
        MSAL_INTERCEPTOR_CONFIG,
        MSAL_BROADCAST_CONFIG,
      ].map((provide, useValue) => ({
        provide,
        useValue,
      })),
    }).compileComponents();

    const fixture = TestBed.createComponent(MistypedFunctionalInjection);
    const instance = fixture.componentInstance;

    expect(instance.msalInstance).toBeDefined();
    expect(instance.guardConfig).toBeDefined();
    expect(instance.interceptorConfig).toBeDefined();
    expect(instance.broadcastConfig).toBeDefined();
  });
});
