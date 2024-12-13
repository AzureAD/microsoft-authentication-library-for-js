import { signin } from "./SignInSample.js";

export async function test_signin(): Promise<void> {
    signin("{TestAccount}}", "{TestPassword}");
}

test_signin();
