import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
    selector: "app-otp",
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: "./otp.component.html",
    styleUrls: ["./otp.component.scss"],
})
export class OtpComponent implements OnInit {
    otpForm!: FormGroup;
    isLoading = false;
    errorMessage = "";
    codeLength = 6; // Default value

    constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {}

    ngOnInit(): void {
        this.codeLength = this.authService.getCodeLength();
        this.initForm();
    }

    private initForm(): void {
        this.otpForm = this.formBuilder.group({
            code: [
                "",
                [
                    Validators.required,
                    Validators.minLength(this.codeLength),
                    Validators.maxLength(this.codeLength),
                    Validators.pattern("^[0-9]*$"),
                ],
            ],
        });
    }

    onSubmit(): void {
        if (this.otpForm.invalid) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = "";

        const { code } = this.otpForm.value;

        this.authService
            .submitOtp(code)
            .then(() => {
                this.isLoading = false;
                this.router.navigate(["/profile"]);
            })
            .catch((error) => {});
    }
}
