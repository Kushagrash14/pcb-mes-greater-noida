using MachineConnector.Models;
using System.Text.RegularExpressions;

namespace MachineConnector.Services;

public static class ICTParser
{
    private static readonly Regex IdentifierLabelRegex = new(
        @"^(serial[\s_.-]*(?:no|number)?[\s_.-]*:?|sn[\s_.-]*:?|code[\s_.-]*:?)$",
        RegexOptions.IgnoreCase
    );

    public static MachineResult Parse(string content)
    {
        var result = new MachineResult();

        var tokens = content.Split(
            new[] { ',', '\r', '\n' },
            StringSplitOptions.RemoveEmptyEntries
        );

        for (int i = 0; i < tokens.Length; i++)
        {
            var value = tokens[i]
                .Trim()
                .Trim('"');

            // Find Serial Number / Code
            if (IdentifierLabelRegex.IsMatch(value))
            {
                if (i + 1 < tokens.Length)
                {
                    var nextValue = tokens[i + 1]
                        .Trim()
                        .Trim('"');

                    if (!string.IsNullOrWhiteSpace(nextValue))
                    {
                        result.SerialNo = nextValue;
                    }
                }
            }

            // Find PASS / FAIL
            if (value.Equals("PASS", StringComparison.OrdinalIgnoreCase))
            {
                result.Result = "PASS";
            }
            else if (value.Equals("FAIL", StringComparison.OrdinalIgnoreCase))
            {
                result.Result = "FAIL";
            }
        }

        if (string.IsNullOrWhiteSpace(result.SerialNo))
            throw new Exception("Serial Number not found in ICT log.");

        if (string.IsNullOrWhiteSpace(result.Result))
            throw new Exception("Test Result (PASS/FAIL) not found in ICT log.");

        return result;
    }
}