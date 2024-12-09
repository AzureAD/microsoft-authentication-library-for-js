import { signin } from "./SignInSample.js";

export async function test_signin(): Promise<void> {
    signin("shen.j@outlook.com", "123456789");
}

test_signin();
