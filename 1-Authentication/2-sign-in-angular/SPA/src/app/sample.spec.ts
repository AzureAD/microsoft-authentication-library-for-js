import { Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { InteractionType } from '@azure/msal-browser';

import { msalConfig } from './auth-config';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

describe('Sanitize the configuration object', () => {

  it('should define the config object', () => {
    expect(msalConfig).toBeDefined();
    expect(msalConfig.auth.clientId).toBeDefined();
    expect(msalConfig.auth.authority).toBeDefined();
    expect(msalConfig.auth.redirectUri).toBeDefined();
  });

  it('should not contain client id', () => {
    const regexGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(regexGuid.test(msalConfig.auth.clientId)).toBe(false);
  });

  it('should not contain tenant id', () => {
    const regexGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(regexGuid.test(msalConfig.auth.authority!.split(".com/")[1])).toBe(false);
  });
});

describe('Ensure that the app starts', () => {
  it('should boot the app', () => {
    const bootApplication = () => {
      const { router, run } = setup();

      run(() => router.initialNavigation());
    };

    expect(bootApplication).not.toThrow();
  });

  it(`should have as title 'Microsoft identity platform'`, async () => {
    const { fixture } = setup();
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Microsoft identity platform');
  });

  it('should navigate to unguarded route', async () => {
    const { router, run } = setup();

    const canNavigate = await run(() => router.navigateByUrl('/'));

    expect(canNavigate).toBe(true);
  });

  it('should not navigate to guarded component', async () => {
    const { router, run } = setup();

    const canNavigate = await run(() => router.navigateByUrl('/guarded'));

    expect(canNavigate).toBe(false);
  });
});

function setup() {

  function MSALGuardConfigFactory(): MsalGuardConfiguration {
    return {
      interactionType: InteractionType.Redirect,
    };
  }

  TestBed.configureTestingModule({
    imports: [
      AppModule,
      RouterTestingModule,
    ],
    providers: [
      {
        provide: MSAL_GUARD_CONFIG,
        useFactory: MSALGuardConfigFactory
      }
    ]
  }).compileComponents();

  let rootFixture: ComponentFixture<AppComponent>;
  const initializeRootFixture = () => {
    if (rootFixture == null) {
      rootFixture = TestBed.createComponent(AppComponent);
    }
  };

  return {
    get router() {
      initializeRootFixture();

      return TestBed.inject(Router);
    },
    run<TResult>(task: () => TResult) {
      initializeRootFixture();

      return rootFixture.ngZone == null
        ? task()
        : rootFixture.ngZone.run(task);
    },
    fixture: TestBed.createComponent(AppComponent)
  };
}
