import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { SignInState } from "@azure/msal-custom-auth";

@Component({
    selector: "app-sign-in",
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: "./sign-in.component.html",
    styleUrls: ["./sign-in.component.scss"],
})
export class SignInComponent implements OnInit {
    signInForm!: FormGroup;
    isLoading = false;
    errorMessage = "";
    showOtpForm = false;

    constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {}

    ngOnInit(): void {
        this.signInForm = this.formBuilder.group({
            username: ["", [Validators.required, Validators.email]],
            password: ["", Validators.required],
        });
    }

    onSubmit(): void {
        if (this.signInForm.invalid) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = "";

        const { username, password } = this.signInForm.value;

        this.authService
            .signIn(username, password)
            .then((result) => {
                this.isLoading = false;
                if (result.state?.type === SignInState.Completed) {
                    this.router.navigate(["/profile"]); // Updated to navigate to profile
                } else if (result.state?.type === SignInState.CodeRequired) {
                    this.router.navigate(["/otp"]);
                } else {
                    this.errorMessage = "An error occurred during sign-in";
                }
            })
            .catch((error) => {
                this.isLoading = false;
                this.errorMessage = error.message || "An error occurred during sign-in";
            });
    }
}
