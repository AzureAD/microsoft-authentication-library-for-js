namespace Identity.NativeBridge;

public interface IBridgeTokenExecutor
{
    Task<NativeToken> ExecuteAsync(NativeRequest request, CancellationToken cancellation);
}