import { async, ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ProfileComponent } from './profile.component';
import { MsalService } from '@azure/msal-angular';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let nativeElement: any;
  let httpTestingController: HttpTestingController;
  // tslint:disable-next-line: prefer-const
  let mockMsalService: any;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [ ProfileComponent ],
      providers: [
        { provide: MsalService, useValue: mockMsalService }
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.debugElement.nativeElement;
    httpTestingController = TestBed.get(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show user name when user is logged in', fakeAsync(() => {
    fixture.detectChanges();
    const request = httpTestingController.expectOne({
      url:  'https://graph.microsoft.com/v1.0/me',
      method: 'GET'
    });
    request.flush({displayName: 'mockDisplayName'});

    flush();
    fixture.detectChanges();

    httpTestingController.verify();
    expect(nativeElement.querySelector('p').textContent).toContain('Welcome mockDisplayName');
  }));

});
