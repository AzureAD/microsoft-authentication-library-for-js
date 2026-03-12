import { Component, OnInit } from '@angular/core';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

@Component({
  selector: 'app-redirect',
  template: '<p>Processing authentication...</p>',
  standalone: false
})
export class RedirectComponent implements OnInit {
  ngOnInit(): void {
    // Call broadcastResponseToMainFrame when component initializes
    broadcastResponseToMainFrame().catch((error: Error) => {
      console.error('Error broadcasting response to main frame:', error);
    });
  }
}
