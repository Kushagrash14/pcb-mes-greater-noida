using System.Diagnostics;
using System.Net.Http.Json;
using MachineConnector.Models;

namespace MachineConnector.Services;


public static class ApiService
{
    private static readonly SocketsHttpHandler handler = new()
    {
        PooledConnectionLifetime = TimeSpan.FromMinutes(10),
        PooledConnectionIdleTimeout = TimeSpan.FromMinutes(10),
        MaxConnectionsPerServer = 10
    };
    private static readonly HttpClient client = new HttpClient(handler);

   public static async Task<bool> SendMachineResult(MachineResult result)
    {
        try
        {
            // Add connector information
            result.MachineCode = ConfigService.Settings.Machine.MachineCode;
            result.MachineName = ConfigService.Settings.Machine.Name;
            result.StationCode = ConfigService.Settings.Machine.StationCode;
            result.LineCode = ConfigService.Settings.Machine.LineCode;

            var response = await client.PostAsJsonAsync(
                ConfigService.Settings.Api.Url,
                result
            );

            if (response.IsSuccessStatusCode)
            {
                if (Environment.UserInteractive)
                {
                    Console.WriteLine("✅ Sent Successfully");
                };
                return true;
            }

             if (Environment.UserInteractive)
                {
                    
                    Console.WriteLine($"❌ Server Error : {response.StatusCode}");
                };
            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
            return false;
        }
    }

}