using MachineConnector.Machines;
using MachineConnector.Machines.FCT;

namespace MachineConnector.Services;

public class FileProcessor
{
    private readonly ICTProcessor _ict = new();
    private readonly FCTProcessor _fct = new();
    public void Initialize(string filePath, bool skipExisting)
    {
        if (ConfigService.Settings.Machine.Type == "FCT")
        {
            _fct.Initialize(filePath, skipExisting);
        }
    }

    public bool IsInitialized(string filePath)
    {
        if (ConfigService.Settings.Machine.Type == "FCT")
        {
            return _fct.IsInitialized(filePath);
        }

        return true;
    }
    public async Task Process(string filePath)
    {
        switch (ConfigService.Settings.Machine.Type.ToUpper())
        {
            case "ICT":
                await _ict.Process(filePath);
                break;

            case "FCT":
                await _fct.Process(filePath);
                break;

            case "HIPORT":
                await _fct.Process(filePath);
                break;

            default:
                throw new Exception("Unsupported Machine Type");
        }
    }
}