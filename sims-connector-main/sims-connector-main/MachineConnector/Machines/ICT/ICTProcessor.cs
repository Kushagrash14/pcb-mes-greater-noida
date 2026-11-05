using System.Diagnostics;
using MachineConnector.Models;

using MachineConnector.Services;


public class ICTProcessor
{
    private readonly FileQueueStore queue = new();
    public async Task Process(string filePath)
    {
        QueueItem? item = queue.Get(filePath);

        if (item == null)
    {
        queue.AddPending(filePath);
    }
    else
    {
        switch (item.Status)
        {
            case QueueStatus.Uploaded:
                Console.WriteLine("Already Uploaded");
                return;

            case QueueStatus.Pending:
                Console.WriteLine("Already Pending");
                return;

            case QueueStatus.Failed:
                Console.WriteLine("Retrying failed upload...");
                break;
        }
    }
    // If status == Failed, continue and retry upload.

    Stopwatch sw = Stopwatch.StartNew();

    try
    {
        string content = ReadFileWithRetry(filePath);

        Console.WriteLine($"Read : {sw.ElapsedMilliseconds} ms");

        MachineResult ictResult = ICTParser.Parse(content);

        ictResult.MachineName = ConfigService.Settings.Machine.Name;
        ictResult.StationCode = ConfigService.Settings.Machine.StationCode;
        ictResult.LineCode = ConfigService.Settings.Machine.LineCode;

        Console.WriteLine($"Parse : {sw.ElapsedMilliseconds} ms");

        bool success = await ApiService.SendMachineResult(ictResult);

        if (success)
        {
            queue.MarkUploaded(filePath);
            Console.WriteLine("✅ Uploaded Successfully");
        }
        else
        {
            queue.MarkRetryFailed(filePath);
            Console.WriteLine("❌ Upload Failed");
        }
    }
    catch (Exception ex)
    {
        queue.MarkRetryFailed(filePath);
        Console.WriteLine($"❌ Error : {ex.Message}");
    }

    Console.WriteLine($"API : {sw.ElapsedMilliseconds} ms");
    Console.WriteLine("================================");

    sw.Stop();
}

    private string ReadFileWithRetry(string path)
    {
        long lastSize = -1;

        for (int i = 0; i < 100; i++)
        {
            try
            {
                FileInfo file = new(path);

                if (file.Length == lastSize)
                {
                    return File.ReadAllText(path);
                }

                lastSize = file.Length;
            }
            catch
            {
            }

            Thread.Sleep(10);
        }

        throw new Exception("Unable to read complete file.");
    }
}

