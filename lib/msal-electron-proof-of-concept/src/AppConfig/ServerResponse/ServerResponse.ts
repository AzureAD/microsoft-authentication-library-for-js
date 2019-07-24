// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as url from 'url';

type QueryParameters = {
    code?: string;
    error?: string;
    error_description?: string;
};

export abstract class ServerResponse {
    private url: url.UrlWithParsedQuery;
    private query: QueryParameters;

    constructor(rawUrl: string) {
        this.url = url.parse(rawUrl, true);
        this.query = this.url.query;
    }

    public get queryParams(): QueryParameters {
        return this.url.query;
    }
}
