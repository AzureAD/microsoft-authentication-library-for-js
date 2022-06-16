import { AuthenticationResult, AuthError, InteractionStatus, InteractionType, PopupRequest, RedirectRequest, SilentRequest } from "@azure/msal-browser";
import { Ref, ref, watch } from "vue";
import { useMsal } from "./useMsal";

export type MsalAuthenticationResult = {
    acquireToken: Function;
    result: Ref<AuthenticationResult|null>;
    error: Ref<AuthError|null>;
    inProgress: Ref<boolean>;
}

export function useMsalAuthentication(interactionType: InteractionType, request: PopupRequest|RedirectRequest|SilentRequest): MsalAuthenticationResult {
    const { instance, inProgress } = useMsal();

    const localInProgress = ref<boolean>(false);
    const result = ref<AuthenticationResult|null>(null);
    const error = ref<AuthError|null>(null);

    const acquireToken = async (requestOverride?: PopupRequest|RedirectRequest|SilentRequest) => {
        if (!localInProgress.value) {
            localInProgress.value = true;
            const tokenRequest = requestOverride || request;

            if (inProgress.value === InteractionStatus.Startup || inProgress.value === InteractionStatus.HandleRedirect) {
                try {
                    const response = await instance.handleRedirectPromise()
                    if (response) {
                        result.value = response;
                        error.value = null;
                        return;
                    }
                } catch (e) {
                    result.value = null;
                    error.value = e as AuthError;
                    return;
                };
            }

            try {
                const response = await instance.acquireTokenSilent(tokenRequest);
                result.value = response;
                error.value = null;
            } catch(e) {
                if (inProgress.value !== InteractionStatus.None) {
                    return;
                }

                if (interactionType === InteractionType.Popup) {
                    instance.loginPopup(tokenRequest).then((response) => {
                        result.value = response;
                        error.value = null;
                    }).catch((e) => {
                        error.value = e;
                        result.value = null;
                    });
                } else if (interactionType === InteractionType.Redirect) {
                    await instance.loginRedirect(tokenRequest).catch((e) => {
                        error.value = e;
                        result.value = null;
                    });
                }
            };
            localInProgress.value = false;
        }
    }

    const stopWatcher = watch(inProgress, () => {
        if (!result && !error) {
            acquireToken();
        } else {
            stopWatcher();
        }
    });

    acquireToken();
    
    return {
        acquireToken,
        result,
        error,
        inProgress: localInProgress
    }
}