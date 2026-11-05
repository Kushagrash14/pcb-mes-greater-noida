using MachineConnector.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
namespace MachineConnector;


public class ConnectorHost : IHostedService
{
    private readonly ILogger<ConnectorHost> _logger;
    private readonly ILogger<FileWatcher> _watcherLogger;

    private readonly FileProcessor _processor;
    private FileWatcher? _watcher;
    
    public ConnectorHost(FileProcessor processor, ILogger<ConnectorHost> logger, ILogger<FileWatcher> watcherLogger)
    {
        _processor = processor;
        _logger = logger;
         _watcherLogger = watcherLogger;
    }


    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("StartAsync entered.");

        ConfigurationValidator.Validate();
        _logger.LogInformation("Configuration validated.");

        DatabaseInitializer.Initialize();
        _logger.LogInformation("Database initialized.");

        _watcher = new FileWatcher(
            ConfigService.Settings.Paths.Watch,
            _processor,
            _watcherLogger);

        _watcher.Start();

        _logger.LogInformation("Watcher started.");
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _watcher?.Dispose();

        _logger.LogInformation("Machine connector stopped.");

        return Task.CompletedTask;
    }
}