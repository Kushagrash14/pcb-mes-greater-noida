using Microsoft.Data.Sqlite;

namespace MachineConnector.Services;

public static class DatabaseInitializer
{
    private static readonly string DataFolder =
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "PG Technoplast",
            "Machine Connector",
            "DB");

    public static readonly string DatabasePath =
        Path.Combine(DataFolder, "connector.db");

    public static void Initialize()
    {
        Directory.CreateDirectory(DataFolder);

        var schemaPath = Path.Combine(
            AppContext.BaseDirectory,
            "DB",
            "Schema.sql");

        var sql = File.ReadAllText(schemaPath);

        using var connection = new SqliteConnection($"Data Source={DatabasePath}");
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();

        Console.WriteLine($"SQLite initialized: {DatabasePath}");
    }

    
}