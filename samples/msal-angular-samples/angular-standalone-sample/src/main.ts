import { bootstrapApplication } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

async function bootstrap() {
  if (
    window.location.pathname === '/redirect' ||
    window.location.pathname === '/redirect/'
  ) {
    const { RedirectComponent } = await import(
      './app/redirect/redirect.component'
    );
    return bootstrapApplication(RedirectComponent);
  }

  const [{ AppComponent }, { appConfig }] = await Promise.all([
    import('./app/app.component'),
    import('./app/app.config'),
  ]);
  return bootstrapApplication(AppComponent, appConfig);
}

bootstrap().catch((err) => console.error(err));
