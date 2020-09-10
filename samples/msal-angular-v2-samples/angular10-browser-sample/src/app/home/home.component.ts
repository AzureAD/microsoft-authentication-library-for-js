import { Component, OnInit } from '@angular/core';
import { MsalService } from '../msal';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private authService: MsalService) { }

  ngOnInit(): void {
    this.authService.handleRedirectObservable().subscribe({
      next: (response) => console.log(response),
      error: (error) => console.log(error)
    });
  }

}
