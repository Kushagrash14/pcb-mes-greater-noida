namespace MachineConnector.Services;

public static class ConfigurationValidator
{
    public static void Validate()
    {
        var config = ConfigService.Settings;

        if (string.IsNullOrWhiteSpace(config.Api.Url))
            throw new Exception("Configuration Error: API URL is missing.");

        if (string.IsNullOrWhiteSpace(config.Paths.Watch))
            throw new Exception("Configuration Error: Watch folder is missing.");

        if (!Directory.Exists(config.Paths.Watch))
            throw new Exception($"Watch folder not found: {config.Paths.Watch}");

        if (string.IsNullOrWhiteSpace(config.Machine.Name))
            throw new Exception("Configuration Error: Machine name is missing.");

        if (config.Api.BatchSize <= 0)
            throw new Exception("Configuration Error: BatchSize must be greater than zero.");

        if (config.Api.RetryIntervalMs <= 0)
            throw new Exception("Configuration Error: RetryIntervalMs must be greater than zero.");
    }
}