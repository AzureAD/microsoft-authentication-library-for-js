import { InteractionType } from "./constants";

export type MsalGuardConfiguration = {
    interactionType: InteractionType.POPUP | InteractionType.REDIRECT;
}
