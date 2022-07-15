import { TestBed } from '@angular/core/testing';
import { EventType, InteractionStatus, InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { MsalBroadcastService } from './msal.broadcast.service';
import { MsalModule, MSAL_BROADCAST_CONFIG } from './public-api';
import { ReplaySubject, Subject, Subscription } from "rxjs";
import { Logger } from '@azure/msal-browser';

let broadcastService: MsalBroadcastService;
let subscription: Subscription;

const msalInstance = new PublicClientApplication({
      auth: {
        clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
        redirectUri: 'http://localhost:4200'
      }
});

function initializeMsal(providers: any[] = []) {
  TestBed.resetTestingModule();

  TestBed.configureTestingModule({
    imports: [
      MsalModule.forRoot(msalInstance, null, {interactionType: InteractionType.Popup, protectedResourceMap: new Map()})
    ],
    providers: [
      MsalBroadcastService,
      ...providers
    ]
  });
  broadcastService = TestBed.inject(MsalBroadcastService);
}

describe('MsalBroadcastService', () => {

  beforeEach(() => {
    initializeMsal();
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

  it('broadcasts previous events if MsalBroadcastConfig set and eventsToReplay is greater than 0', (done) => {
    initializeMsal([{
      provide: MSAL_BROADCAST_CONFIG,
      useValue: {
        eventsToReplay: 3
      }
    }]);

    const expectedMsalSubjectFirstSubscription = [
      {
        eventType: EventType.LOGIN_START,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }
    ];
    let firstIndex = 0;

    subscription = broadcastService.msalSubject$.subscribe((result) => {
      expect(result.eventType).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].eventType);
      expect(result.interactionType).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].interactionType);
      expect(result.payload).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].payload);
      expect(result.error).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].error);
      expect(result.timestamp).toBeInstanceOf(Number);
      if (firstIndex === (expectedMsalSubjectFirstSubscription.length - 1)) {
        return;
      } else {
        firstIndex++;
      }
    });

    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Redirect);

    subscription.unsubscribe();

    let index = 0;
    const expectedMsalSubject = [
      {
        eventType: EventType.LOGIN_START,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }, 
      {
        eventType: EventType.HANDLE_REDIRECT_START,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }, 
      {
        eventType: EventType.HANDLE_REDIRECT_END,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }
    ];

    const newSubscription = broadcastService.msalSubject$.subscribe((result) => {
      expect(result.eventType).toEqual(expectedMsalSubject[index].eventType);
      expect(result.interactionType).toEqual(expectedMsalSubject[index].interactionType);
      expect(result.payload).toEqual(expectedMsalSubject[index].payload);
      expect(result.error).toEqual(expectedMsalSubject[index].error);
      expect(result.timestamp).toBeInstanceOf(Number);
      if (index === (expectedMsalSubject.length - 1)) {
        done();
      } else {
        index++;
      }
    });

    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_START, InteractionType.Redirect);
    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);

    newSubscription.unsubscribe();
  });

  it('broadcasts the set number of past events if MsalBroadcastConfig and eventsToReplay is set', (done) => {
    initializeMsal([{
      provide: MSAL_BROADCAST_CONFIG,
      useValue: {
        eventsToReplay: 1
      }
    }]);

    const expectedMsalSubjectFirstSubscription = [
      {
        eventType: EventType.INITIALIZE_START,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }, 
      {
        eventType: EventType.LOGIN_START,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }
    ];
    let firstIndex = 0;

    subscription = broadcastService.msalSubject$.subscribe((result) => {
      expect(result.eventType).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].eventType);
      expect(result.interactionType).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].interactionType);
      expect(result.payload).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].payload);
      expect(result.error).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].error);
      expect(result.timestamp).toBeInstanceOf(Number);
      if (firstIndex === (expectedMsalSubjectFirstSubscription.length - 1)) {
        return;
      } else {
        firstIndex++;
      }
    });

    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.INITIALIZE_START, InteractionType.Redirect);
    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Redirect);

    subscription.unsubscribe();

    let index = 0;
    const expectedMsalSubject = [
      {
        eventType: EventType.LOGIN_START,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }, 
      {
        eventType: EventType.HANDLE_REDIRECT_START,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }, 
      {
        eventType: EventType.HANDLE_REDIRECT_END,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }
    ];

    const newSubscription = broadcastService.msalSubject$.subscribe((result) => {
      expect(result.eventType).toEqual(expectedMsalSubject[index].eventType);
      expect(result.interactionType).toEqual(expectedMsalSubject[index].interactionType);
      expect(result.payload).toEqual(expectedMsalSubject[index].payload);
      expect(result.error).toEqual(expectedMsalSubject[index].error);
      expect(result.timestamp).toBeInstanceOf(Number);
      if (index === (expectedMsalSubject.length - 1)) {
        done();
      } else {
        index++;
      }
    });

    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_START, InteractionType.Redirect);
    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);

    newSubscription.unsubscribe();
  });

  it('does not broadcasts previous events if MsalBroadcastConfig is not set', (done) => {
    const expectedMsalSubjectFirstSubscription = [
      {
        eventType: EventType.LOGIN_START,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }
    ];
    let firstIndex = 0;

    subscription = broadcastService.msalSubject$.subscribe((result) => {
      expect(result.eventType).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].eventType);
      expect(result.interactionType).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].interactionType);
      expect(result.payload).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].payload);
      expect(result.error).toEqual(expectedMsalSubjectFirstSubscription[firstIndex].error);
      expect(result.timestamp).toBeInstanceOf(Number);
      if (firstIndex === (expectedMsalSubjectFirstSubscription.length - 1)) {
        return;
      } else {
        firstIndex++;
      }
    });

    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Redirect);

    subscription.unsubscribe();

    let index = 0;
    const expectedMsalSubject = [
      {
        eventType: EventType.HANDLE_REDIRECT_START,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }, 
      {
        eventType: EventType.HANDLE_REDIRECT_END,
        interactionType: InteractionType.Redirect,
        payload: null,
        error: null,
      }
    ];

    const newSubscription = broadcastService.msalSubject$.subscribe((result) => {
      expect(result.eventType).toEqual(expectedMsalSubject[index].eventType);
      expect(result.interactionType).toEqual(expectedMsalSubject[index].interactionType);
      expect(result.payload).toEqual(expectedMsalSubject[index].payload);
      expect(result.error).toEqual(expectedMsalSubject[index].error);
      expect(result.timestamp).toBeInstanceOf(Number);
      if (index === (expectedMsalSubject.length - 1)) {
        done();
      } else {
        index++;
      }
    });

    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_START, InteractionType.Redirect);
    // @ts-ignore
    msalInstance.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);

    newSubscription.unsubscribe();
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
