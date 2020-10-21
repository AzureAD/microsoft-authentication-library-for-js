
import { TestBed } from '@angular/core/testing';

import { MsalInterceptor } from './msal.interceptor';

describe('MsalInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      MsalInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: MsalInterceptor = TestBed.inject(MsalInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
