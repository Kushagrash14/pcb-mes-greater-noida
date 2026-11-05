using MachineConnector.Models;
using MachineConnector.Services;

namespace MachineConnector.Machines.FCT;

public class FCTProcessor
{
    private readonly FCTTailReader _reader = new();
    private readonly FCTParser _parser = new();

    private const int RetryIntervalMs = 500;
    private const int InactivityTimeoutMs = 5000;
    private const int MaxProcessingTimeMs = 30000;

    public void Initialize(string filePath, bool skipExisting)
    {
        _reader.Initialize(filePath, skipExisting);
    }

    public bool IsInitialized(string filePath)
    {
        return _reader.IsInitialized(filePath);
    }

    public async Task Process(string filePath)
    {
        DateTime startedAt = DateTime.UtcNow;
        DateTime lastActivityAt = DateTime.UtcNow;

        long lastFileSize = -1;

        while (true)
        {
            if (!File.Exists(filePath))
            {
                Console.WriteLine($"File no longer exists: {filePath}");
                return;
            }

            // ---------------------------------------------
            // Check hard timeout
            // ---------------------------------------------
            if ((DateTime.UtcNow - startedAt).TotalMilliseconds
                >= MaxProcessingTimeMs)
            {
                Console.WriteLine(
                    $"Processing timeout after {MaxProcessingTimeMs} ms: {filePath}"
                );

                return;
            }

            try
            {
                long currentFileSize = new FileInfo(filePath).Length;

                // File is still growing
                if (currentFileSize != lastFileSize)
                {
                    lastFileSize = currentFileSize;
                    lastActivityAt = DateTime.UtcNow;
                }

                // ---------------------------------------------
                // Read ONLY new bytes
                // ---------------------------------------------
                List<string> records = _reader.Read(filePath);

                bool processedAnyRecord = false;

                foreach (string record in records)
                {
                    MachineResult? result = _parser.Parse(record);

                    if (result == null)
                    {
                        continue;
                    }

                    result.MachineName = ConfigService.Settings.Machine.Name;

                    result.StationCode = ConfigService.Settings.Machine.StationCode;

                    result.LineCode =ConfigService.Settings.Machine.LineCode;

                    await ApiService.SendMachineResult(result);

                    processedAnyRecord = true;
                }

                // ---------------------------------------------
                // Result found and sent
                // ---------------------------------------------
                if (processedAnyRecord)
                {
                    return;
                }

                // ---------------------------------------------
                // File stopped changing
                // No valid result found
                // ---------------------------------------------
                if ((DateTime.UtcNow - lastActivityAt)
                    .TotalMilliseconds >= InactivityTimeoutMs)
                {
                    Console.WriteLine(
                        $"File inactive for {InactivityTimeoutMs} ms. Stopping: {filePath}"
                    );

                    return;
                }
            }
            catch (IOException)
            {
                // Machine may still have the file open.
                // Don't fail immediately.
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error while processing {filePath}: {ex.Message}");
            }

            await Task.Delay(RetryIntervalMs);
        }
    }
}