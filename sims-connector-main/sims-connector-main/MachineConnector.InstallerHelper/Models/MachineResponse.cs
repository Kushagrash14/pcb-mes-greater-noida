namespace MachineConnector.InstallerHelper.Models;

public class MachineResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = "";
    public MachineData? Data { get; set; }
}

public class MachineData
{
    public string MachineCode { get; set; } = "";
    public string MachineName { get; set; } = "";
    public string MachineType { get; set; } = "";
    public string LineCode { get; set; } = "";
    public string StageName { get; set; } = "";
    public string SourceType { get; set; } = "";
    public string WatchFolder { get; set; } = "";
    public int PollInterval { get; set; }
    public string FileExtensions { get; set; } = "";
}