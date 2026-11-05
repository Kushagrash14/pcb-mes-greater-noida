using System.Text.Json;
using MachineConnector.InstallerHelper.Models;

namespace MachineConnector.InstallerHelper.Services;

public class ApiService
{
    private readonly HttpClient _client;
    private readonly string _baseUrl;

    public ApiService(string baseUrl)
    {
        _baseUrl = baseUrl.TrimEnd('/');
        
        _client = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(10)
        };
    }

    public async Task<MachineResponse?> VerifyMachineAsync(string machineCode)
    {
        var response = await _client.GetAsync(
            $"{_baseUrl}/api/external-sources/machine/{machineCode}"
        );

        if (!response.IsSuccessStatusCode)
        {
            return new MachineResponse
            {
                Success = false,
                Message = $"HTTP {(int)response.StatusCode}"
            };
        }

        var json = await response.Content.ReadAsStringAsync();

        return JsonSerializer.Deserialize<MachineResponse>(
            json,
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
    }
}