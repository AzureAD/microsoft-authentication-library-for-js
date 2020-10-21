import { TestBed } from '@angular/core/testing';

import { MsalAngularService } from './msal-angular.service';

describe('MsalAngularService', () => {
  let service: MsalAngularService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MsalAngularService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
