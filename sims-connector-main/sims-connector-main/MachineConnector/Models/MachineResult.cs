namespace MachineConnector.Models;

public class MachineResult
{
    public string? Program { get; set; } = "";
    public string? SerialNo { get; set; } = "";
    public string? Result { get; set; } = "";
    public DateTime TestTime { get; set; }

    public string? MachineCode { get; set; } = "";
    public string? MachineName { get; set; } = "";
    public string? StationCode { get; set; } = "";
    public string? LineCode { get; set; } = "";
}