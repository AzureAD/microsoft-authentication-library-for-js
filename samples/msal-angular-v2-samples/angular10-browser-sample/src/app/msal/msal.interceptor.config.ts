import { InteractionType } from "./constants";

export type MsalInterceptorConfig = {
    interactionType: InteractionType.POPUP | InteractionType.REDIRECT;
    protectedResourceMap: Map<string, Array<string>>;
}
