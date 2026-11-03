import { Component, OnInit } from '@angular/core';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

@Component({
  selector: 'app-root',
  template: '<p>Processing authentication...</p>',
  standalone: true,
})
export class RedirectComponent implements OnInit {
  ngOnInit(): void {
    broadcastResponseToMainFrame().catch((error: Error) => {
      console.error('Error broadcasting response to main frame:', error);
    });
  }
}
