using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace MachineConnector.Services;

public class FileWatcher : IDisposable
{
    private readonly FileProcessor processor;
    private readonly string watchPath;
    private readonly ILogger<FileWatcher> _logger;

    private readonly ConcurrentDictionary<string, byte> processingFiles = new();

    private FileSystemWatcher? watcher;

    public FileWatcher(string watchPath, FileProcessor processor, ILogger<FileWatcher> logger)
    {
        this.watchPath = watchPath;
        this.processor = processor;
        _logger = logger;
    }

    public void Start()
    {
        if (!Directory.Exists(watchPath))
        {
            Directory.CreateDirectory(watchPath);

            _logger.LogWarning("Watch folder did not exist. Created: {Path}", watchPath);
        }

        watcher = new FileSystemWatcher(watchPath)
        {
            Filter = ConfigService.Settings.Paths.Filter,

            NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite,

            IncludeSubdirectories = true
        };

        // Separate handlers
        watcher.Created += OnCreated;
        watcher.Changed += OnChanged;

        watcher.EnableRaisingEvents = true;

        _logger.LogInformation("Watching : {Path}", watchPath);
    }

    // =========================================================
    // NEW FILE
    // Read from beginning
    // =========================================================
    private async void OnCreated(object? sender, FileSystemEventArgs e)
    {
        await HandleFileEvent(e, isNewFile: true);
    }

    // =========================================================
    // EXISTING FILE CHANGED
    // Read only from stored offset
    // =========================================================
    private async void OnChanged(object? sender, FileSystemEventArgs e)
    {
        await HandleFileEvent(e, isNewFile: false);
    }

    // =========================================================
    // MAIN EVENT HANDLER
    // =========================================================
    private async Task HandleFileEvent(FileSystemEventArgs e, bool isNewFile)
    {
        if (!processingFiles.TryAdd(e.FullPath, 0))
        {
            _logger.LogDebug("Duplicate file event ignored: {FilePath}", e.FullPath);

            return;
        }

        try
        {
            _logger.LogInformation("File Event : {FilePath}", e.FullPath);

            await Task.Delay(100);

            if (!File.Exists(e.FullPath))
                return;

            if (!processor.IsInitialized(e.FullPath))
            {
                processor.Initialize(e.FullPath, skipExisting: !isNewFile);
            }

            await processor.Process(e.FullPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while processing file.");
        }
        finally
        {
            processingFiles.TryRemove(e.FullPath, out _);
        }
    }

    public void Dispose()
    {
        if (watcher is null)
            return;

        watcher.EnableRaisingEvents = false;

        watcher.Created -= OnCreated;
        watcher.Changed -= OnChanged;

        watcher.Dispose();

        _logger.LogInformation("FileWatcher stopped.");
    }
}