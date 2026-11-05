namespace MachineConnector.InstallerHelper.Utils;

public static class ExitCodes
{
    public const int Success = 0;

    public const int InvalidArguments = 1;

    public const int MachineNotFound = 2;

    public const int ServerUnavailable = 3;

    public const int InvalidResponse = 4;

    public const int ConfigSaveFailed = 5;

    public const int UnknownError = 99;
}