namespace MachineConnector.Models;

public class QueueItem
{
    public int Id { get; set; }

    public string FilePath { get; set; } = "";

    public QueueStatus Status { get; set; }

    public int RetryCount { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UploadedAt { get; set; }
}