import { Routes } from "@angular/router";
import { SignInComponent } from "./components/sign-in/sign-in.component";
import { ProfileComponent } from "./components/profile/profile.component";
import { OtpComponent } from "./components/otp/otp.component";

export const routes: Routes = [
    { path: "", redirectTo: "sign-in", pathMatch: "full" },
    { path: "sign-in", component: SignInComponent },
    { path: "profile", component: ProfileComponent },
    { path: "otp", component: OtpComponent },
];
