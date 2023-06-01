import { authProvider } from "~/services/auth";

export default async function ForcedPage() {
    const account = await authProvider.getAccount();

    if (!account) {
        throw new Error("How did this happen?");
    }

    return <div>Hello {account.name}</div>;
}

