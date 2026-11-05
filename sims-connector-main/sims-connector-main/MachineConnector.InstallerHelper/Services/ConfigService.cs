using System.Text.Json;
using MachineConnector.InstallerHelper.Models;

namespace MachineConnector.InstallerHelper.Services;

public static class ConfigService
{

    public const string ApiBaseUrl = "http://192.168.19.152:5000";
    public static void Save( MachineData machine, string outputPath, string apiBaseUrl)
    {
        var directory = Path.GetDirectoryName(outputPath);

        if (!string.IsNullOrEmpty(directory))
            Directory.CreateDirectory(directory);

        apiBaseUrl = apiBaseUrl.TrimEnd('/');

        var config = new ConnectorConfig
        {
            Machine = new MachineSettings
            {
                MachineCode = machine.MachineCode,
                Name = machine.MachineName,
                Type = machine.MachineType,
                StationCode = machine.StageName,
                LineCode = machine.LineCode
            },

            Api = new ApiSettings
            {
                Url = $"{apiBaseUrl}/api/ict/save/result",
                RetryIntervalMs = 300,
                BatchSize = 10,
                MaxRetryCount = 50
            },

            Paths = new PathSettings
            {
                Watch = machine.WatchFolder,
                Filter = NormalizeFilter(machine.FileExtensions),
                Processed = Path.Combine(
                    machine.WatchFolder,
                    "Processed"
                ),
                Failed = Path.Combine(
                    machine.WatchFolder,
                    "Failed"
                )
            }
        };

        var json = JsonSerializer.Serialize(
            config,
            new JsonSerializerOptions
            {
                WriteIndented = true
            });

        File.WriteAllText(outputPath, json);
    }

    public static MachineData? Load(string path)
    {
        if (!File.Exists(path))
            return null;

        var json = File.ReadAllText(path);

        return JsonSerializer.Deserialize<MachineData>(json);
    }

    private static string NormalizeFilter(string extension)
    {
        if (string.IsNullOrWhiteSpace(extension))
            return "*.*";

        extension = extension.Trim();

        if (extension.StartsWith('*'))
            return extension;

        if (extension.StartsWith('.'))
            return "*" + extension;

        return "*." + extension;
    }
}