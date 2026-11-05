using MachineConnector.InstallerHelper.Services;
using MachineConnector.InstallerHelper.Utils;

if (args.Length < 3)
{
    Console.WriteLine("Usage: verify <MachineCode> <ServerBaseUrl> [OutputPath]");
    Environment.Exit(ExitCodes.InvalidArguments);
}

var command = args[0].ToLower();

if (command != "verify")
{
    Console.WriteLine("Unknown command.");
    Environment.Exit(ExitCodes.InvalidArguments);
}

var machineCode = args[1];
var baseUrl = args[2];

if (string.IsNullOrWhiteSpace(baseUrl))
{
    Console.WriteLine("Server URL is required.");
    Environment.Exit(ExitCodes.InvalidArguments);
}

var api = new ApiService(baseUrl);

try
{
    var result = await api.VerifyMachineAsync(machineCode);

    if (result == null)
    {
        Console.WriteLine("Invalid response from server.");
        Environment.Exit(ExitCodes.InvalidResponse);
    }

    if (!result.Success || result.Data == null)
    {
        Console.WriteLine(result.Message);
        Environment.Exit(ExitCodes.MachineNotFound);
    }

    // Save configuration locally
    var outputPath = args.Length >= 4
        ? args[3]
        : Path.Combine(AppContext.BaseDirectory, "connector.json");

    // Save configuration
    ConfigService.Save(result.Data, outputPath, baseUrl);

    Console.WriteLine("Configuration saved successfully.");
    Console.WriteLine($"File: {outputPath}");

    Environment.Exit(ExitCodes.Success);
}
catch (HttpRequestException)
{
    Console.WriteLine("Unable to connect to MES server.");
    Environment.Exit(ExitCodes.ServerUnavailable);
}
catch (Exception ex)
{
    Console.WriteLine(ex.Message);
    Environment.Exit(ExitCodes.UnknownError);
}