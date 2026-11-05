namespace MachineConnector.InstallerHelper.Models;

public class ConnectorConfig
{
    public MachineSettings Machine { get; set; } = new();
    public ApiSettings Api { get; set; } = new();
    public PathSettings Paths { get; set; } = new();
}

public class MachineSettings
{
    public string MachineCode { get; set; } = "";
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public string StationCode { get; set; } = "";
    public string LineCode { get; set; } = "";
}

public class ApiSettings
{
    public string Url { get; set; } = "";
    public int RetryIntervalMs { get; set; } = 300;
    public int BatchSize { get; set; } = 10;
    public int MaxRetryCount { get; set; } = 50;
}

public class PathSettings
{
    public string Watch { get; set; } = "";
    public string Filter { get; set; } = "*.*";
    public string Processed { get; set; } = "";
    public string Failed { get; set; } = "";
}