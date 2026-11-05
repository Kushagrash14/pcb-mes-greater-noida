using MachineConnector;
using MachineConnector.Services;
using Microsoft.Extensions.Hosting.WindowsServices;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.FromLogContext()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File(
        "Logs/log-.txt",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        shared: true,
        outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

using IHost host = Host.CreateDefaultBuilder(args)
    .UseWindowsService(options =>
    {
        options.ServiceName = "PG SIMSE Connector";
    })
    .UseSerilog()
    .ConfigureServices(services =>  
    {
        services.AddSingleton<FileProcessor>();
        services.AddSingleton<FileQueueStore>();

        services.AddHostedService<RetryService>();
        services.AddHostedService<ConnectorHost>();
    })
    .Build();

try
{
    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Machine Connector terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}
