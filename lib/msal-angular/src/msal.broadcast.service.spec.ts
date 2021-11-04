import { TestBed } from '@angular/core/testing';
import { EventType, InteractionStatus, InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { MsalBroadcastService } from './msal.broadcast.service';
import { MsalModule } from './public-api';
import { Subscription } from "rxjs";

const msalInstance = new PublicClientApplication({
      auth: {
        clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
        redirectUri: 'http://localhost:4200'
      }
});

describe('MsalBroadcastService', () => {
  let broadcastService: MsalBroadcastService;
  let subscription: Subscription;

  beforeEach(() => {
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      imports: [
        MsalModule.forRoot(msalInstance, null, {interactionType: InteractionType.Popup, protectedResourceMap: new Map()})
      ],
      providers: [
        MsalBroadcastService
      ]
    });
    broadcastService = TestBed.inject(MsalBroadcastService);
  });

  afterEach(() => {
    subscription.unsubscribe();
  })
  
  it('broadcasts event from PublicClientApplication', (done) => {
    const sub = broadcastService.msalSubject$.subscribe((result) => {
      expect(result.eventType).toEqual(EventType.LOGIN_START);
      expect(result.interactionType).toEqual(InteractionType.Popup);
      expect(result.payload).toEqual(null);
      expect(result.error).toEqual(null);
      expect(result.timestamp).toBeInstanceOf(Number);
      sub.unsubscribe();
      done();
    });

    const expectedInProgress = [InteractionStatus.Startup, InteractionStatus.Login];
    let index = 0;

    subscription = broadcastService.inProgress$.subscribe((result) => {
      expect(result).toEqual(expectedInProgress[index]);
      if (index === (expectedInProgress.length - 1)) {
        done();
      } else {
        index++;
      }
    });

    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
  });

  it('LOGIN_SUCCESS event does not set inProgress to None if handleRedirect is still in progress', (done) => {
    const expectedInProgress = [InteractionStatus.Startup, InteractionStatus.HandleRedirect];
    let index = 0;

    subscription = broadcastService.inProgress$.subscribe((result) => {
      expect(result).toEqual(expectedInProgress[index]);
      if (index === (expectedInProgress.length - 1)) {
        done();
      } else {
        index++;
      }
    });

    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_START, InteractionType.Redirect);
    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.LOGIN_SUCCESS, InteractionType.Redirect);
  });

  it('HANDLE_REDIRECT_END event sets inProgress to None if handleRedirect is in progress', (done) => {
    const expectedInProgress = [InteractionStatus.Startup, InteractionStatus.HandleRedirect, InteractionStatus.None];
    let index = 0;

    subscription = broadcastService.inProgress$.subscribe((result) => {
      expect(result).toEqual(expectedInProgress[index]);
      if (index === (expectedInProgress.length - 1)) {
        done();
      } else {
        index++;
      }
    });

    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_START, InteractionType.Redirect);
    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.LOGIN_SUCCESS, InteractionType.Redirect);
    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);
  });

  it('HANDLE_REDIRECT_END event does not set inProgress to None if login is in progress', (done) => {
    const expectedInProgress = [InteractionStatus.Startup, InteractionStatus.HandleRedirect, InteractionStatus.Login];
    let index = 0;

    subscription = broadcastService.inProgress$.subscribe((result) => {
      expect(result).toEqual(expectedInProgress[index]);
      if (index === (expectedInProgress.length - 1)) {
        done();
      } else {
        index++;
      }
    });

    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_START, InteractionType.Redirect);
    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Redirect);
    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);
  });

});
