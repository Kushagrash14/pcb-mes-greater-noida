using System.Text;

namespace MachineConnector.Machines.FCT;

public class FCTTailReader
{
    private readonly Dictionary<string, long> _offsets = new();
    private readonly Dictionary<string, StringBuilder> _buffers = new();
    private readonly Dictionary<string, Encoding> _encodings = new();

    private const string Separator ="----------------Info-----------------";

    public List<string> Read(string filePath)
    {
        var records = new List<string>();

        if (!_offsets.TryGetValue(filePath, out long lastPosition))
        {
            Initialize(filePath, skipExisting: true);
            return records;
        }

        try
        {
            using var stream = new FileStream(
                filePath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.ReadWrite
            );

            // File was truncated or recreated
            if (stream.Length < lastPosition)
            {
                lastPosition = 0;
                _offsets[filePath] = 0;

                _buffers[filePath] = new StringBuilder();

                // Re-detect encoding because this may be a new file
                _encodings[filePath] = DetectEncoding(filePath);
            }

            if (!_encodings.TryGetValue(filePath, out Encoding? encoding))
            {
                encoding = DetectEncoding(filePath);
                _encodings[filePath] = encoding;
            }

            stream.Seek(lastPosition, SeekOrigin.Begin);

            using var reader = new StreamReader(
                stream,
                encoding,
                detectEncodingFromByteOrderMarks: true,
                leaveOpen: true
            );

            string newText = reader.ReadToEnd();

            // Store actual byte position
            _offsets[filePath] = stream.Position;

            if (string.IsNullOrWhiteSpace(newText))
                return records;

            Console.WriteLine("========= NEW DATA =========");
            Console.WriteLine(newText);
            Console.WriteLine("============================");

            if (!_buffers.TryGetValue(
                filePath,
                out var bufferBuilder
            ))
            {
                bufferBuilder = new StringBuilder();

                _buffers[filePath] = bufferBuilder;
            }

            bufferBuilder.Append(newText);

            string buffer = bufferBuilder.ToString();

            // =====================================================
            // OLD MAGMET FORMAT
            // =====================================================

            while (true)
            {
                int first = buffer.IndexOf(Separator, StringComparison.Ordinal);

                if (first == -1)
                    break;

                int second = buffer.IndexOf(Separator, first + Separator.Length, StringComparison.Ordinal);

                // Record still incomplete
                if (second == -1)
                    break;

                string record = buffer
                    .Substring(first, second - first)
                    .Trim();

                if (!string.IsNullOrWhiteSpace(record))
                {
                    records.Add(record);
                }

                buffer = buffer.Substring(second);
            }

            // =====================================================
            // NEW CVTE / FCT FORMAT
            // =====================================================

            string remaining = buffer.Trim();

            if (!string.IsNullOrWhiteSpace(remaining))
            {
                bool hasLotSnCode = remaining.Contains("LotSnCode",StringComparison.OrdinalIgnoreCase);
                bool hasPassResult = remaining.Contains("TestResult:PASS",StringComparison.OrdinalIgnoreCase);
                bool hasFailResult = remaining.Contains("TestResult:FAIL", StringComparison.OrdinalIgnoreCase);
                bool isNewCVTERecord = hasLotSnCode && (hasPassResult || hasFailResult);

                // =================================================
                // OLD MAGMET FORMAT
                // =================================================

                bool isOldMagmetRecord = remaining.Contains("条码",StringComparison.OrdinalIgnoreCase) &&
                    (
                        remaining.Contains("PASS",StringComparison.OrdinalIgnoreCase) ||
                        remaining.Contains("FAIL",StringComparison.OrdinalIgnoreCase)
                    );

                if (isOldMagmetRecord || isNewCVTERecord)
                {
                    Console.WriteLine("✅ COMPLETE FCT RECORD DETECTED");
                    records.Add(remaining);
                    // Clear buffer after successful record
                    buffer = "";
                }
            }

            // Preserve incomplete record
            bufferBuilder.Clear();
            bufferBuilder.Append(buffer);
        }
        catch (IOException)
        {
            // Machine may still be writing the file.
            // Retry will happen from FCTProcessor.
        }

        return records;
    }

    public void Initialize(string filePath, bool skipExisting)
    {
        try
        {
            using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);

            _offsets[filePath] = skipExisting? stream.Length : 0;

            _buffers[filePath] = new StringBuilder();

            // Detect and store encoding once
            Encoding encoding = DetectEncoding(filePath);

            _encodings[filePath] = encoding;

            Console.WriteLine($"Encoding detected: {encoding.EncodingName}");
        }
        catch (IOException)
        {
            // File may still be locked temporarily
        }
    }

    public bool IsInitialized(string filePath)
    {
        return _offsets.ContainsKey(filePath);
    }

    private static Encoding DetectEncoding(
        string filePath
    )
    {
        using var stream = new FileStream(
            filePath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.ReadWrite
        );

        byte[] buffer = new byte[100];

        int bytesRead =
            stream.Read(buffer, 0, buffer.Length);

        // -----------------------------------------
        // UTF-8 BOM
        // -----------------------------------------

        if (
            bytesRead >= 3 &&
            buffer[0] == 0xEF &&
            buffer[1] == 0xBB &&
            buffer[2] == 0xBF
        )
        {
            return Encoding.UTF8;
        }

        // -----------------------------------------
        // UTF-16 LE BOM
        // -----------------------------------------

        if (
            bytesRead >= 2 &&
            buffer[0] == 0xFF &&
            buffer[1] == 0xFE
        )
        {
            return Encoding.Unicode;
        }

        // -----------------------------------------
        // UTF-16 BE BOM
        // -----------------------------------------

        if (
            bytesRead >= 2 &&
            buffer[0] == 0xFE &&
            buffer[1] == 0xFF
        )
        {
            return Encoding.BigEndianUnicode;
        }

        // -----------------------------------------
        // UTF-16 WITHOUT BOM DETECTION
        //
        // Check for lots of NULL bytes.
        // UTF-16 English text usually looks like:
        // S 0 N 0 : 0 ...
        // -----------------------------------------

        int nullCount = 0;

        for (int i = 0; i < bytesRead; i++)
        {
            if (buffer[i] == 0x00)
            {
                nullCount++;
            }
        }

        if (
            bytesRead > 0 &&
            nullCount > bytesRead / 4
        )
        {
            Console.WriteLine(
                "Detected UTF-16 LE without BOM"
            );

            return Encoding.Unicode;
        }

        // -----------------------------------------
        // Default UTF-8
        // -----------------------------------------

        Console.WriteLine(
            "Detected UTF-8"
        );

        return Encoding.UTF8;
    }
}