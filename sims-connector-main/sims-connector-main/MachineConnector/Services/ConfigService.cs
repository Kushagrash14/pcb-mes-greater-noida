using Microsoft.Extensions.Configuration;
using MachineConnector.Configuration;

namespace MachineConnector.Services;

public static class ConfigService
{
    public static AppSettings Settings { get; }
    private const string AppSettingsFile = "appsettings.json";
    private const string ConnectorFile = "connector.json";

    static ConfigService()
    {
        IConfiguration config = new ConfigurationBuilder()
        .SetBasePath(AppContext.BaseDirectory)
        .AddJsonFile(AppSettingsFile, optional: false, reloadOnChange: true)
        .AddJsonFile(ConnectorFile, optional: true, reloadOnChange: true)
        .Build();

        Settings = new AppSettings();

        config.Bind(Settings);
    }

    public static readonly string ConnectorConfigPath = Path.Combine(AppContext.BaseDirectory, "connector.json");
    public static bool IsConfigured => File.Exists(ConnectorConfigPath);

}