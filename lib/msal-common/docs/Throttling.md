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

`msaljs` will throttle a specific `RequestThumbprint` if the server returns one of the following cases after making a call:

* Response contains a 429 or 5xx HTTP status.
* Response contains a `Retry-After` header *and* does not have a 2xx HTTP status.
* The request requires user interaction, represented in `msaljs` as `UserInteractionRequiredError`.

Before making a silent call, `msaljs` checks to see if a unique `RequestThumbprint` is currently being throttled, and if so, will not make that call and return an error back to the user. Interactive calls bypass this gate as they are made to alleviate the problem. Additionally, a throttled `RequestThumbprint` will be cleared upon a successful interactive response from the server.

If the server does not provide a time to throttle a `RequestThumbprint`, the default length is 60 seconds. The maximum possible length is 3600 seconds, which `msaljs` will use to override if the server provides something longer.

```ts
export const ThrottleConstants = {
    DEFAULT_THROTTLE_TIME_SECONDS: 60,
    DEFAULT_MAX_THROTTLE_TIME_SECONDS: 3600
}
```