using System;
using Xunit;
using Microsoft.Extensions.Configuration;

namespace ToDoListAPI.Tests;
public class ConfigurationTests
{
    public static IConfiguration InitConfiguration()
    {
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .Build();

        return config;
    }

    [Fact]
    public void ShouldNotContainClientId()
    {
        var myConfiguration = ConfigurationTests.InitConfiguration();
        var clientId = myConfiguration.GetSection("AzureAd")["ClientId"];

        Assert.False(Guid.TryParse(clientId, out var theGuid));
    }

    [Fact]
    public void ShouldNotContainTenantId()
    {
        var myConfiguration = ConfigurationTests.InitConfiguration();
        var tenantId = myConfiguration.GetSection("AzureAd")["TenantId"];

        Assert.False(Guid.TryParse(tenantId, out var theGuid));
    }

    [Fact]
    public void ShouldNotContainDomain()
    {
        var myConfiguration = ConfigurationTests.InitConfiguration();
        var domain = $"https://{myConfiguration.GetSection("AzureAd")["Domain"]}";

        Assert.False(Uri.TryCreate(domain, UriKind.Absolute, out var uri));
    }
}