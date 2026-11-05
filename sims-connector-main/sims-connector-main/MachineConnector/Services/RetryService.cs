using MachineConnector.Models;
using Microsoft.Extensions.Logging;
namespace MachineConnector.Services;

using Microsoft.Extensions.Hosting;

public class RetryService : BackgroundService
{
    private readonly FileQueueStore _queue;

    private readonly FileProcessor _processor;

    private readonly ILogger<RetryService> _logger;

    

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)    
    {

        if (!ConfigService.IsConfigured)
        {
            _logger.LogError("connector.json not found. Machine Connector is not configured.");
            return;
        }
        
        _logger.LogInformation(
        "Retry service started. Interval: {Interval} ms, Batch Size: {BatchSize}",
        ConfigService.Settings.Api.RetryIntervalMs,
        ConfigService.Settings.Api.BatchSize
        );

        using var timer = new PeriodicTimer(
            TimeSpan.FromMilliseconds(ConfigService.Settings.Api.RetryIntervalMs));

        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await RetryPending();
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Retry Service stopped.");
        }
    }

    private async Task RetryPending()
    {
        List<QueueItem> files = _queue.GetFailedFiles(
            ConfigService.Settings.Api.BatchSize,
            ConfigService.Settings.Api.MaxRetryCount
        );

        if (files.Count == 0)
            return;

        _logger.LogInformation("Retry cycle started. Pending files: {Count}", files.Count);

        foreach (QueueItem item in files)
        {
            try
            {
                await _processor.Process(item.FilePath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Retry failed for file {File}.",
                    item.FilePath);
            }
        }

        _logger.LogInformation("Retry cycle completed. Processed {Count} file(s).", files.Count);
    }

    public RetryService(FileProcessor processor, FileQueueStore queue, ILogger<RetryService> logger)
    {
        _processor = processor;
        _queue = queue;
        _logger = logger;
    }



}