import { Request } from "express";
import { Session } from "express-session";

export type RequestWithPKCE = Request & {
    session: Session & {
        pkceCodes: {
            challengeMethod: string;
            challenge?: string;
            verifier?: string;
        };
    };
};
