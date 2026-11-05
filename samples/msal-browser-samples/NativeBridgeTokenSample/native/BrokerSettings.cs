namespace NativeBridgeTokenSample;

public sealed record BrokerChild(int Number, string ClientId, string BrokerHostClientId, string RedirectUri, string[] Scopes)
{
    public string HostName => Number == 1 ? "bridge-poc.local" : $"app{Number}.bridge-poc.local";
    public string PageUrl => $"https://{HostName}/index.html";
}

public sealed record BrokerSettings(string HostClientId, string TenantId, BrokerChild[] Children)
{
    public string Authority => $"https://login.microsoftonline.com/{TenantId}";

    public static BrokerSettings Placeholders()
    {
        const string hostId = "11111111-1111-1111-1111-111111111111";
        return new(hostId, "organizations",
        [
            new(1, "22222222-2222-2222-2222-222222222222", hostId, "brk-multihub://bridge-poc.local", ["User.Read"]),
            new(2, "33333333-3333-3333-3333-333333333333", hostId, "brk-multihub://app2.bridge-poc.local", ["User.Read"]),
        ]);
    }

    public void Validate()
    {
        if (!ValidId(HostClientId) || !(TenantId == "organizations" || ValidId(TenantId)) ||
            Children is not { Length: 2 } || !Children.Select(child => child.Number).Order().SequenceEqual(new[] { 1, 2 }))
            throw new ArgumentException("Configure one host and exactly two numbered child registrations.");
        var ids = new HashSet<Guid> { Guid.Parse(HostClientId) };
        foreach (var child in Children)
        {
            if (!ValidId(child.ClientId) || !ids.Add(Guid.Parse(child.ClientId)) ||
                !Guid.TryParse(child.BrokerHostClientId, out var brokerId) || brokerId != Guid.Parse(HostClientId) ||
                child.RedirectUri != $"brk-multihub://{child.HostName}" ||
                child.Scopes is not { Length: > 0 } || child.Scopes.Any(string.IsNullOrWhiteSpace))
                throw new ArgumentException("Each child needs a unique client ID, matching broker host, exact origin redirect, and scopes.");
        }
    }

    private static bool ValidId(string value) => Guid.TryParse(value, out var parsed) && parsed != Guid.Empty;
}