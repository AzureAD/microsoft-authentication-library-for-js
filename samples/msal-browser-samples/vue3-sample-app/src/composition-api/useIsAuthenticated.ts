import { Ref, ref, watch } from "vue";
import { useMsal } from "./useMsal";

export function useIsAuthenticated(): Ref<boolean> {
    const { accounts } = useMsal();
    const isAuthenticated = ref(accounts.value.length > 0);

    watch(accounts, () => {
        isAuthenticated.value = accounts.value.length > 0;
    });

    return isAuthenticated;
}