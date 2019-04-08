export default class  TelemetryBlogEventNames {
    public static MsalCorrelationIdConstStrKey = "Microsoft.MSAL.correlation_id";
    // public const string ApiIdConstStrKey = "Microsoft_MSAL_api_id";

    // todo(mats): make this the primary api id and deprecate the other one
    public static ApiTelemIdConstStrKey = "msal.api_telem_id";

    // todo(mats): use the ApiTelemId values instead of this one..
    public static ApiIdConstStrKey = "msal.api_id";
    public static BrokerAppConstStrKey = "Microsoft_MSAL_broker_app";
    public static CacheEventCountConstStrKey = "Microsoft_MSAL_cache_event_count";
    public static HttpEventCountTelemetryBatchKey = "Microsoft_MSAL_http_event_count";
    public static IdpConstStrKey = "Microsoft_MSAL_idp";
    public static IsSilentTelemetryBatchKey = "";
    public static IsSuccessfulConstStrKey = "Microsoft_MSAL_is_successful";
    public static ResponseTimeConstStrKey = "Microsoft_MSAL_response_time";
    public static TenantIdConstStrKey = "Microsoft_MSAL_tenant_id";
    public static UiEventCountTelemetryBatchKey = "Microsoft_MSAL_ui_event_count";
}