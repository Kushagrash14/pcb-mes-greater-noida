using Microsoft.Data.Sqlite;
using MachineConnector.Models;

namespace MachineConnector.Services;

public class FileQueueStore
{
    private readonly string connectionString = $"Data Source={DatabaseInitializer.DatabasePath}";

    private SqliteConnection CreateConnection()
    {
        var connection = new SqliteConnection(connectionString);
        connection.Open();
        return connection;
    }

    private static string Status(QueueStatus status)
        => status.ToString().ToUpperInvariant();

    private static QueueItem Map(SqliteDataReader reader)
    {
        return new QueueItem
        {
            Id = reader.GetInt32(0),
            FilePath = reader.GetString(1),
            Status = Enum.Parse<QueueStatus>(reader.GetString(2), true),
            RetryCount = reader.GetInt32(3),
            CreatedAt = DateTime.Parse(reader.GetString(4)),
            UploadedAt = reader.IsDBNull(5)
                ? null
                : DateTime.Parse(reader.GetString(5))
        };
    }

    public QueueItem? Get(string filePath)
    {
        using var connection = CreateConnection();
        using var command = connection.CreateCommand();

        command.CommandText =
        """
        SELECT
            id,
            file_path,
            status,
            retry_count,
            created_at,
            uploaded_at
        FROM file_queue
        WHERE file_path = $path;
        """;

        command.Parameters.AddWithValue("$path", filePath);

        using var reader = command.ExecuteReader();

        return reader.Read() ? Map(reader) : null;
    }

    public void AddPending(string filePath)
    {
        using var connection = CreateConnection();
        using var command = connection.CreateCommand();

        command.CommandText =
        """
        INSERT OR IGNORE INTO file_queue
        (
            file_path,
            status,
            retry_count,
            created_at
        )
        VALUES
        (
            $path,
            $status,
            0,
            $created
        );
        """;

        command.Parameters.AddWithValue("$path", filePath);
        command.Parameters.AddWithValue("$status", Status(QueueStatus.Pending));
        command.Parameters.AddWithValue("$created", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

        command.ExecuteNonQuery();
    }

    public void MarkUploaded(string filePath)
    {
        using var connection = CreateConnection();
        using var command = connection.CreateCommand();

        command.CommandText =
        """
        UPDATE file_queue
        SET
            status = $status,
            uploaded_at = $uploaded
        WHERE file_path = $path;
        """;

        command.Parameters.AddWithValue("$status", Status(QueueStatus.Uploaded));
        command.Parameters.AddWithValue("$path", filePath);
        command.Parameters.AddWithValue(
            "$uploaded",
            DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

        command.ExecuteNonQuery();
    }

    public void MarkFailed(string filePath, string error)
    {
        using var connection = CreateConnection();
        using var command = connection.CreateCommand();

        command.CommandText =
        """
        UPDATE file_queue
        SET
            status = $status,
            retry_count = retry_count + 1,
            last_retry_at = $retry,
            last_error = $error
        WHERE file_path = $path;
        """;

        command.Parameters.AddWithValue("$status", Status(QueueStatus.Failed));
        command.Parameters.AddWithValue("$retry",  DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
        command.Parameters.AddWithValue("$error",  error);
        command.Parameters.AddWithValue("$path",   filePath);

        command.ExecuteNonQuery();
    }

    public void IncreaseRetry(string filePath)
    {
        using var connection = CreateConnection();
        using var command = connection.CreateCommand();

        command.CommandText =
        """
        UPDATE file_queue
        SET retry_count = retry_count + 1
        WHERE file_path = $path;
        """;

        command.Parameters.AddWithValue("$path", filePath);

        command.ExecuteNonQuery();
    }

    public void MarkRetryFailed(string filePath)
    {
        IncreaseRetry(filePath);
        MarkFailed(filePath, "Retry failed");
    }

    public List<QueueItem> GetPendingFiles()
    {
        return GetFilesByStatus(
            QueueStatus.Pending,
            ConfigService.Settings.Api.MaxRetryCount,
            int.MaxValue
        );
    }

    public List<QueueItem> GetFailedFiles(int limit, int maxRetryCount)
    {
        return GetFilesByStatus(
            QueueStatus.Failed,
            maxRetryCount,
            limit
        );
    }

    private List<QueueItem> GetFilesByStatus(QueueStatus status, int maxRetryCount, int limit)
    {
        var files = new List<QueueItem>();

        using var connection = CreateConnection();
        using var command = connection.CreateCommand();

        command.CommandText =
        """
        SELECT
            id,
            file_path,
            status,
            retry_count,
            created_at,
            uploaded_at
        FROM file_queue
        WHERE status = $status
          AND retry_count < $maxRetryCount
        ORDER BY
            retry_count ASC,
            created_at ASC
        LIMIT $limit;
        """;

        command.Parameters.AddWithValue("$status", Status(status));
        command.Parameters.AddWithValue("$maxRetryCount", maxRetryCount);
        command.Parameters.AddWithValue("$limit", limit);

        using var reader = command.ExecuteReader();

        while (reader.Read())
        {
            files.Add(Map(reader));
        }

        return files;
    }
}