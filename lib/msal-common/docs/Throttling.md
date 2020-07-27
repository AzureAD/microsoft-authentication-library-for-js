# Client-side throttling
`msaljs` implements protection measures against the AAD backend through client-side throttling. It blocks requests that will only result in erroneous calls, and can often be alleviated with user interaction. It identifies a unique call based on a `RequestThumbprint` type:

```ts
export type RequestThumbprint = {
    clientId: string;
    authority: string;
    scopes: Array<string>;
    homeAccountIdentifier?: string;
};
```

Before making a call, `msaljs` checks to see if a unique `RequestThumbprint` is currently being throttled, and if so, will not make that call and return an error back to the user. The default throttling time is 60 seconds, and maximum possible throttling time is 3600 seconds.

```ts
export const ThrottleConstants = {
    DEFAULT_THROTTLE_TIME_SECONDS: 60,
    DEFAULT_MAX_THROTTLE_TIME_SECONDS: 3600
}
```