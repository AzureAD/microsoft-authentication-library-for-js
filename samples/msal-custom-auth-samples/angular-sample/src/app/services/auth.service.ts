import { Injectable } from "@angular/core";
import {
    CustomAuthPublicClientApplication,
    ICustomAuthPublicClientApplication,
    SignInInputs,
    SignInResult,
    SignInState,
} from "@azure/msal-custom-auth";
import { customAuthConfig } from "../config/auth-config";

@Injectable({
    providedIn: "root",
})
export class AuthService {
    private customAuthApp: ICustomAuthPublicClientApplication | null = null;

    private currentState: any = null;
    private userData: any = null;
    constructor() {
        this.initializeMsal();
    }

    private async initializeMsal(): Promise<void> {
        try {
            this.customAuthApp = await CustomAuthPublicClientApplication.create(customAuthConfig);
            const currentAccount = this.customAuthApp.getCurrentAccount();
            if (currentAccount) {
                this.userData = currentAccount.data?.getAccount();
            }
        } catch (error) {
            console.error("Error initializing MSAL:", error);
        }
    }

    public async signIn(username: string, password: string): Promise<SignInResult> {
        if (!this.customAuthApp) {
            return Promise.reject(new Error("MSAL instance not initialized"));
        }
        const signInRequest: SignInInputs = {
            username,
            password,
            scopes: ["openid", "profile", "email"],
        };

        return this.customAuthApp.signIn(signInRequest).then((result: SignInResult) => {
            this.currentState = result.state;
            if (result.state?.type === SignInState.Completed) {
                this.userData = result.data?.getAccount();
            }
            return result;
        });
    }

    public submitOtp(code: string): Promise<SignInResult> {
        if (!this.customAuthApp) {
            return Promise.reject(new Error("MSAL instance not initialized"));
        }

        return this.currentState.submitCode(code).then((result: SignInResult) => {
            if (result.state?.type === SignInState.Completed) {
                this.userData = result.data;
            }

            this.currentState = result.data;
            return result;
        });
    }

    public signOut(): void {
        if (this.customAuthApp) {
            this.userData = null;
            //this.customAuthApp.signOut();
            sessionStorage.clear();
        }
    }

    public isAuthenticated(): boolean {
        return this.userData !== null;
    }

    public getUserData(): any {
        return this.userData;
    }

    public getCodeLength(): number {
        if (this.currentState && "codeLength" in this.currentState) {
            return this.currentState.codeLength || 6;
        }
        return 6;
    }
}
