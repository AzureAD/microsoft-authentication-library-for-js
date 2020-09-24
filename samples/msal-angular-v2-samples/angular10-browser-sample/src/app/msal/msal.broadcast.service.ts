import { Injectable } from '@angular/core';
import { BroadcastService, BroadcastMessage, BroadcastEvent } from '@azure/msal-browser';

// Broadcast service from msal-browser
@Injectable()
export class BrowserBroadcastService extends BroadcastService {

}

// export interface BrowserBroadcastMessage extends BroadcastMessage {

// }

// export enum BrowserBroadcastEvent {
//   BroadcastEvent = BroadcastEvent,
// }
