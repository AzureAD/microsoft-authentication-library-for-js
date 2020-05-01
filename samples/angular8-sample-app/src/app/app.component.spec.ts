import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BroadcastService, MsalService } from '@azure/msal-angular';
import { Account } from 'msal';
import { MatToolbarModule } from '@angular/material';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let nativeElement: any;
  let mockMsalService: any;
  let mockBroadcastService: any;

  mockMsalService = jasmine.createSpyObj(['getAccount', 'handleRedirectCallback', 'setLogger']);
  mockBroadcastService = jasmine.createSpyObj(['subscribe']);

  function getMockLoggedInAccount() {
    return new Account('mockAccountId', 'mockHomeAccountId', 'mockUserName',
    'mockName', { mockClaimKey: 'mockClaimValue' }, 'mockSid', 'mockEnvironment');
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule, MatToolbarModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: BroadcastService, useValue: mockBroadcastService },
        { provide: MsalService, useValue: mockMsalService }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.debugElement.nativeElement;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    fixture.detectChanges();
    expect(nativeElement.querySelector('.title').textContent).toContain('MSAL - Angular 8 Sample App');
  });

  it('should show Login button when user is not logged in', () => {
    mockMsalService.getAccount.and.returnValue(null);
    fixture.detectChanges();
    expect(nativeElement.querySelector('button').textContent).toContain('Login');
  });

  it('should show Logout button when user is logged in', () => {
    mockMsalService.getAccount.and.returnValue(getMockLoggedInAccount());
    fixture.detectChanges();
    expect(nativeElement.querySelector('button').textContent).toContain('Logout');
  });

});
