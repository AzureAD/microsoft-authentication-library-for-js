import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../services/auth.service";

@Component({
    selector: "app-profile",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="profile-container" *ngIf="userData">
            <h2>Welcome!</h2>
            <div class="profile-info">
                <div class="info-item"><strong>Username:</strong> {{ userData.username }}</div>
                <pre>{{ userData | json }} </pre>
            </div>
            <button (click)="signOut()" class="sign-out-btn">Sign Out</button>
        </div>

        <div *ngIf="!userData" class="loading">Loading user data...</div>
    `,
    styles: [
        `
            .profile-container {
                max-width: 600px;
                margin: 2rem auto;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .profile-info {
                margin: 1.5rem 0;
                overflow: auto;
            }

            .info-item {
                margin: 0.5rem 0;
                padding: 0.5rem;
                background-color: #f8f9fa;
                border-radius: 4px;
            }

            .sign-out-btn {
                background-color: #dc3545;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
            }

            .sign-out-btn:hover {
                background-color: #c82333;
            }

            .loading {
                text-align: center;
                padding: 2rem;
            }
        `,
    ],
})
export class ProfileComponent implements OnInit {
    userData: any = null;

    constructor(private authService: AuthService, private router: Router) {}

    ngOnInit() {
        this.userData = this.authService.getUserData();
    }

    signOut() {
        this.authService.signOut();
        this.router.navigate(["/sign-in"]);
    }
}
