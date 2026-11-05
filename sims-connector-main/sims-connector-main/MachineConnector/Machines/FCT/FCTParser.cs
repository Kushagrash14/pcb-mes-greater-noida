using System.Globalization;
using System.Text.RegularExpressions;
using MachineConnector.Models;

namespace MachineConnector.Machines.FCT;

public class FCTParser
{
    private static readonly Regex SerialRegex = new(
        @"(?:条码|serial[\s_.-]*(?:no|number)?|sn|lotsncode)\s*[""]?\s*[:=：,-]\s*[""]?(?<serial>[^,""\r\n\s}]+)",
        RegexOptions.IgnoreCase |
        RegexOptions.IgnorePatternWhitespace
    );

    private static readonly Regex ResultRegex = new(
        @"\b(?<result>PASS|FAIL)\b",
        RegexOptions.IgnoreCase
    );

    private static readonly Regex ChineseTimeRegex = new(
        @"时间\s*[:：]\s*(?<time>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})",
        RegexOptions.IgnorePatternWhitespace
    );

    private static readonly Regex JsonTimeRegex = new(
        @"""(?:TestStartDate|TestTime|TestEndDate)""\s*:\s*""(?<time>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})""",
        RegexOptions.IgnoreCase |
        RegexOptions.IgnorePatternWhitespace
    );

    public MachineResult? Parse(string record)
    {
        if (string.IsNullOrWhiteSpace(record))
            return null;

        var result = new MachineResult();

        // -----------------------------
        // SERIAL NUMBER
        // -----------------------------
        var serialMatch = SerialRegex.Match(record);

        if (serialMatch.Success)
        {
            result.SerialNo =serialMatch.Groups["serial"].Value.Trim();
        }

        // -----------------------------
        // PASS / FAIL
        // Can exist anywhere in record
        // -----------------------------
        var resultMatch = ResultRegex.Match(record);

        if (resultMatch.Success)
        {
            result.Result =resultMatch.Groups["result"].Value.ToUpperInvariant();
        }

        // -----------------------------
        // TIME (optional)
        // Chinese format
        // -----------------------------
        var timeMatch = ChineseTimeRegex.Match(record);

        if (!timeMatch.Success)
        {
            // JSON format
            timeMatch = JsonTimeRegex.Match(record);
        }

        if (timeMatch.Success &&
            DateTime.TryParseExact(
                timeMatch.Groups["time"].Value,
                "yyyy-MM-dd HH:mm:ss",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var testTime))
        {
            result.TestTime = testTime;
        }

        // -----------------------------
        // INVALID RECORD
        // Don't crash.
        // Don't send.
        // Just ignore.
        // -----------------------------
        if (string.IsNullOrWhiteSpace(result.SerialNo) ||
            string.IsNullOrWhiteSpace(result.Result))
        {
            return null;
        }

        return result;
    }
}