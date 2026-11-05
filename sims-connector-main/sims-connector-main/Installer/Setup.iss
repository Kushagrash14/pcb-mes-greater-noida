#define BuildArch GetEnv("BUILD_ARCH")
#if BuildArch == ""
  #define BuildArch "x64"
#endif

#define MyAppName "Machine Connector"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "PG Technoplast"
#define MyAppExeName "MachineConnector.exe"
#define ServiceName "MachineConnector"

[Setup]
AppId={{A8D50D6A-5E67-4A4E-8D9A-123456789ABC}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\PG Technoplast\Machine Connector
DefaultGroupName={#MyAppName}
OutputDir=..\Output
OutputBaseFilename=MachineConnectorSetup_{#BuildArch}
Compression=lzma
SolidCompression=yes
WizardStyle=modern

#if BuildArch == "x64"
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
#else
ArchitecturesAllowed=x86 x64compatible
#endif

[Files]

; Helper used during verification (extract to temp only)
Source: "..\InstallerFiles\MachineConnector.InstallerHelper.exe"; Flags: dontcopy

; Application files
Source: "..\InstallerFiles\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Machine Connector"; Filename: "{app}\MachineConnector.exe"
Name: "{commondesktop}\Machine Connector"; Filename: "{app}\MachineConnector.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional icons:"

[Dirs]
Name: "{commonappdata}\PG Technoplast\Machine Connector\DB"; Permissions: users-modify



[Code]

var
  IsMachineVerified: Boolean;

  ServerPage: TWizardPage;
  ServerUrlLabel: TLabel;
  ServerUrlEdit: TNewEdit;
  ServerBaseUrl: String;

  MachinePage: TWizardPage;

  MachineCodeLabel: TLabel;
  MachineCodeEdit: TNewEdit;
  VerifyButton: TButton;

  StatusLabel: TLabel;

  MachineCodeConfirmLabel: TLabel;
  MachineNameLabel: TLabel;
  MachineTypeLabel: TLabel;
  LineCodeLabel: TLabel;
  StageLabel: TLabel;
  SourceTypeLabel: TLabel;
  WatchFolderLabel: TLabel;

  ResultCode: Integer;
  HelperExe: String;
  TempConfigFile: String;
  HelperLogFile: String;
  VerifyBatchFile: String;

  VerifyProgress: TNewProgressBar;


function ReadFileToString(FileName: String): String;
var
  S: AnsiString;
begin
  if LoadStringFromFile(FileName, S) then
    Result := String(S)
  else
    Result := '';
end;


{ Distinguishes a genuine helper-reported failure from a silent
  process launch failure (e.g. blocked by antivirus/endpoint
  protection before it could run at all). }
function GetVerifyFailureDetails(LogFile: String): String;
var
  Output: String;
begin
  if not FileExists(LogFile) then
  begin
    Result :=
      'No output was captured at all — the verification tool may ' +
      'have been blocked before it could run (commonly caused by ' +
      'antivirus/endpoint protection software, e.g. Seqrite). ' +
      'Please check your security software logs for a blocked ' +
      'execution of MachineConnector.InstallerHelper.exe.';
    Exit;
  end;

  Output := Trim(ReadFileToString(LogFile));

  if Output = '' then
  begin
    Result :=
      'The verification tool ran but produced no output. This can ' +
      'also indicate the process was terminated by security ' +
      'software before completing.';
    Exit;
  end;

  Result := Output;
end;


function GetJsonValue(Json, Key: String): String;
var
  StartPos, EndPos: Integer;
  SearchKey: String;
  UpperJson: String;
begin
  Result := '';

  SearchKey := Uppercase('"' + Key + '":');
  UpperJson := Uppercase(Json);

  StartPos := Pos(SearchKey, UpperJson);

  if StartPos = 0 then
  begin
    Result := 'N/A';
    Exit;
  end;

  StartPos := StartPos + Length(SearchKey);

  while (StartPos <= Length(Json)) and
        ((Json[StartPos] = ' ') or (Json[StartPos] = '"') or
         (Json[StartPos] = #9)) do
    Inc(StartPos);

  EndPos := StartPos;

  while (EndPos <= Length(Json)) and
        (Json[EndPos] <> '"') and
        (Json[EndPos] <> ',') and
        (Json[EndPos] <> '}') and
        (Json[EndPos] <> #13) and
        (Json[EndPos] <> #10) do
    Inc(EndPos);

  Result := Trim(Copy(Json, StartPos, EndPos - StartPos));

  if Result = '' then
    Result := 'N/A';
end;


{ Ensures the entered server URL has a scheme and no trailing slash,
  e.g. "192.168.19.100:5000" becomes "http://192.168.19.100:5000". }
function NormalizeServerUrl(RawUrl: String): String;
var
  Normalized: String;
begin
  Normalized := Trim(RawUrl);

  if (Pos('http://', Lowercase(Normalized)) <> 1) and
     (Pos('https://', Lowercase(Normalized)) <> 1) then
    Normalized := 'http://' + Normalized;

  while (Length(Normalized) > 0) and
        (Normalized[Length(Normalized)] = '/') do
    Delete(Normalized, Length(Normalized), 1);

  Result := Normalized;
end;


procedure ResetMachineInfoLabels();
begin
  MachineCodeConfirmLabel.Caption := 'Machine Code : -';
  MachineNameLabel.Caption := 'Machine Name : -';
  MachineTypeLabel.Caption := 'Machine Type : -';
  LineCodeLabel.Caption := 'Line Code : -';
  StageLabel.Caption := 'Stage : -';
  SourceTypeLabel.Caption := 'File Filter : -';
  WatchFolderLabel.Caption := 'Watch Folder : -';
end;


{ Keeps the Next button state correct on the Server URL page as the
  user types, mirroring the same pattern used on Machine Registration. }
procedure ServerUrlEditChange(Sender: TObject);
begin
  WizardForm.NextButton.Enabled := (Trim(ServerUrlEdit.Text) <> '');
end;


{ Forces the machine code field to always display uppercase text
  while typing, and invalidates any previous verification whenever
  the code is edited after a successful verify. }
procedure MachineCodeEditChange(Sender: TObject);
var
  CursorPos: Integer;
  UpperText: String;
begin
  UpperText := Uppercase(MachineCodeEdit.Text);

  if UpperText <> MachineCodeEdit.Text then
  begin
    CursorPos := MachineCodeEdit.SelStart;
    MachineCodeEdit.Text := UpperText;
    MachineCodeEdit.SelStart := CursorPos;
  end;

  if IsMachineVerified then
  begin
    IsMachineVerified := False;
    WizardForm.NextButton.Enabled := False;
    StatusLabel.Caption := 'Status : NOT VERIFIED';
    ResetMachineInfoLabels();
  end;
end;


procedure VerifyButtonClick(Sender: TObject);
var
  Json: String;
  WatchFolder: String;
begin
  if Trim(MachineCodeEdit.Text) = '' then
  begin
    MsgBox('Please enter a Machine Code before verifying.', mbError, MB_OK);
    Exit;
  end;

  HelperExe := ExpandConstant('{tmp}\MachineConnector.InstallerHelper.exe');
  TempConfigFile := ExpandConstant('{tmp}\connector.json');
  HelperLogFile := ExpandConstant('{tmp}\verify_log.txt');
  VerifyBatchFile := ExpandConstant('{tmp}\run_verify.bat');

  ExtractTemporaryFile('MachineConnector.InstallerHelper.exe');

  StatusLabel.Caption := 'Status : VERIFYING...';
  VerifyButton.Enabled := False;
  MachineCodeEdit.Enabled := False;
  VerifyProgress.Position := 0;
  VerifyProgress.Visible := True;

  { Force the UI to repaint immediately, since Exec below blocks
    until the helper process finishes. }
  StatusLabel.Repaint;
  VerifyButton.Repaint;
  VerifyProgress.Repaint;

  { Write the command to a small batch file rather than building one
    long cmd /C string with several quoted args and a redirection
    operator inline — that pattern is prone to cmd.exe quote-parsing
    failures (Exit Code 1, no output captured at all). A batch file
    avoids the ambiguity entirely since each line is plain text. }
  SaveStringToFile(
    VerifyBatchFile,
    '@echo off' + #13#10 +
    '"' + HelperExe + '" verify "' + Trim(MachineCodeEdit.Text) +
    '" "' + ServerBaseUrl + '" "' + TempConfigFile +
    '" > "' + HelperLogFile + '" 2>&1' + #13#10 +
    'exit /b %ERRORLEVEL%' + #13#10,
    False
  );

  if Exec(
      ExpandConstant('{cmd}'),
      '/C "' + VerifyBatchFile + '"',
      '',
      SW_HIDE,
      ewWaitUntilTerminated,
      ResultCode
  ) then
  begin
    if ResultCode = 0 then
    begin
      if not FileExists(TempConfigFile) then
      begin
        IsMachineVerified := False;
        WizardForm.NextButton.Enabled := False;
        StatusLabel.Caption := 'Status : NOT VERIFIED';

        MsgBox(
          'Machine verified, but the configuration file could not be found.' + #13#10 +
          'Please try again or contact support.',
          mbError,
          MB_OK
        );
      end
      else
      begin
        Json := ReadFileToString(TempConfigFile);

        if Trim(Json) = '' then
        begin
          IsMachineVerified := False;
          WizardForm.NextButton.Enabled := False;
          StatusLabel.Caption := 'Status : NOT VERIFIED';

          MsgBox(
            'Machine verified, but the configuration data is empty.' + #13#10 +
            'Please try again or contact support.',
            mbError,
            MB_OK
          );
        end
        else
        begin
          IsMachineVerified := True;

          StatusLabel.Caption := 'Status : VERIFIED';

          MachineCodeConfirmLabel.Caption :=
            'Machine Code : ' + GetJsonValue(Json, 'MachineCode');

          MachineNameLabel.Caption :=
            'Machine Name : ' + GetJsonValue(Json, 'Name');

          MachineTypeLabel.Caption :=
            'Machine Type : ' + GetJsonValue(Json, 'Type');

          LineCodeLabel.Caption :=
            'Line Code : ' + GetJsonValue(Json, 'LineCode');

          StageLabel.Caption :=
            'Stage : ' + GetJsonValue(Json, 'StationCode');

          SourceTypeLabel.Caption :=
            'File Filter : ' + GetJsonValue(Json, 'Filter');

          WatchFolder := GetJsonValue(Json, 'Watch');
          WatchFolderLabel.Caption := 'Watch Folder : ' + WatchFolder;

          WizardForm.NextButton.Enabled := True;
        end;
      end;
    end
    else
    begin
      IsMachineVerified := False;
      WizardForm.NextButton.Enabled := False;
      StatusLabel.Caption := 'Status : NOT VERIFIED';
      ResetMachineInfoLabels();

      MsgBox(
        'Machine verification failed.' + #13#10 + #13#10 +
        'Exit Code: ' + IntToStr(ResultCode) + #13#10 +
        'Details: ' + GetVerifyFailureDetails(HelperLogFile),
        mbError,
        MB_OK
      );
    end;
  end
  else
  begin
    IsMachineVerified := False;
    WizardForm.NextButton.Enabled := False;
    StatusLabel.Caption := 'Status : NOT VERIFIED';

    MsgBox(
      'Unable to run the verification tool.' + #13#10 +
      'Please contact support.',
      mbError,
      MB_OK
    );
  end;

  VerifyProgress.Visible := False;
  VerifyButton.Enabled := True;
  MachineCodeEdit.Enabled := True;
end;


function ServiceExists(ServiceName: String): Boolean;
var
  ResultCode: Integer;
begin
  Result :=
    Exec(
      ExpandConstant('{cmd}'),
      '/C sc query "' + ServiceName + '"',
      '',
      SW_HIDE,
      ewWaitUntilTerminated,
      ResultCode
    ) and (ResultCode = 0);
end;

procedure StopService(ServiceName: String);
var
  ResultCode: Integer;
begin
  Exec(
    ExpandConstant('{cmd}'),
    '/C sc stop "' + ServiceName + '"',
    '',
    SW_HIDE,
    ewWaitUntilTerminated,
    ResultCode
  );
end;

procedure DeleteService(ServiceName: String);
var
  ResultCode: Integer;
begin
  Exec(
    ExpandConstant('{cmd}'),
    '/C sc delete "' + ServiceName + '"',
    '',
    SW_HIDE,
    ewWaitUntilTerminated,
    ResultCode
  );
end;

procedure CreateService(ServicePath: String);
var
  ResultCode: Integer;
begin
  Exec(
    ExpandConstant('{cmd}'),
    '/C sc create "{#ServiceName}" binPath= "' +
    ServicePath + '" start= auto',
    '',
    SW_HIDE,
    ewWaitUntilTerminated,
    ResultCode
  );
end;

procedure StartService();
var
  ResultCode: Integer;
begin
  Exec(
    ExpandConstant('{cmd}'),
    '/C sc start "{#ServiceName}"',
    '',
    SW_HIDE,
    ewWaitUntilTerminated,
    ResultCode
  );
end;


procedure InitializeWizard();
begin
  IsMachineVerified := False;
  ServerBaseUrl := '';

  { -----------------------------------------------------------
    Page 1: Server URL
  ----------------------------------------------------------- }
  ServerPage := CreateCustomPage(
    wpWelcome,
    'Server Configuration',
    'Enter the MES server address for this installation.'
  );

  WizardForm.NextButton.Enabled := False;

  ServerUrlLabel := TLabel.Create(ServerPage);
  ServerUrlLabel.Parent := ServerPage.Surface;
  ServerUrlLabel.Caption := 'Server URL';
  ServerUrlLabel.Left := 10;
  ServerUrlLabel.Top := 10;

  ServerUrlEdit := TNewEdit.Create(ServerPage);
  ServerUrlEdit.Parent := ServerPage.Surface;
  ServerUrlEdit.Left := 10;
  ServerUrlEdit.Top := 30;
  ServerUrlEdit.Width := 320;
  ServerUrlEdit.OnChange := @ServerUrlEditChange;

  { -----------------------------------------------------------
    Page 2: Machine Registration
    Anchored to ServerPage.ID (not wpWelcome) so it is inserted
    immediately after the Server URL page, not before it.
  ----------------------------------------------------------- }
  MachinePage := CreateCustomPage(
    ServerPage.ID,
    'Machine Registration',
    'Enter the Machine Code provided by SIMSE.'
  );

  MachineCodeLabel := TLabel.Create(MachinePage);
  MachineCodeLabel.Parent := MachinePage.Surface;
  MachineCodeLabel.Caption := 'Machine Code';
  MachineCodeLabel.Left := 10;
  MachineCodeLabel.Top := 10;

  MachineCodeEdit := TNewEdit.Create(MachinePage);
  MachineCodeEdit.Parent := MachinePage.Surface;
  MachineCodeEdit.Left := 10;
  MachineCodeEdit.Top := 30;
  MachineCodeEdit.Width := 220;
  MachineCodeEdit.OnChange := @MachineCodeEditChange;

  VerifyButton := TButton.Create(MachinePage);
  VerifyButton.Parent := MachinePage.Surface;
  VerifyButton.Caption := 'Verify';
  VerifyButton.Left := 240;
  VerifyButton.Top := 28;
  VerifyButton.Width := 80;
  VerifyButton.OnClick := @VerifyButtonClick;

  StatusLabel := TLabel.Create(MachinePage);
  StatusLabel.Parent := MachinePage.Surface;
  StatusLabel.Left := 10;
  StatusLabel.Top := 70;
  StatusLabel.Caption := 'Status : NOT VERIFIED';

  MachineCodeConfirmLabel := TLabel.Create(MachinePage);
  MachineCodeConfirmLabel.Parent := MachinePage.Surface;
  MachineCodeConfirmLabel.Left := 10;
  MachineCodeConfirmLabel.Top := 100;
  MachineCodeConfirmLabel.Caption := 'Machine Code : -';

  MachineNameLabel := TLabel.Create(MachinePage);
  MachineNameLabel.Parent := MachinePage.Surface;
  MachineNameLabel.Left := 10;
  MachineNameLabel.Top := 120;
  MachineNameLabel.Caption := 'Machine Name : -';

  MachineTypeLabel := TLabel.Create(MachinePage);
  MachineTypeLabel.Parent := MachinePage.Surface;
  MachineTypeLabel.Left := 10;
  MachineTypeLabel.Top := 140;
  MachineTypeLabel.Caption := 'Machine Type : -';

  LineCodeLabel := TLabel.Create(MachinePage);
  LineCodeLabel.Parent := MachinePage.Surface;
  LineCodeLabel.Left := 10;
  LineCodeLabel.Top := 160;
  LineCodeLabel.Caption := 'Line Code : -';

  StageLabel := TLabel.Create(MachinePage);
  StageLabel.Parent := MachinePage.Surface;
  StageLabel.Left := 10;
  StageLabel.Top := 180;
  StageLabel.Caption := 'Stage : -';

  SourceTypeLabel := TLabel.Create(MachinePage);
  SourceTypeLabel.Parent := MachinePage.Surface;
  SourceTypeLabel.Left := 10;
  SourceTypeLabel.Top := 200;
  SourceTypeLabel.Caption := 'File Filter : -';

  WatchFolderLabel := TLabel.Create(MachinePage);
  WatchFolderLabel.Parent := MachinePage.Surface;
  WatchFolderLabel.Left := 10;
  WatchFolderLabel.Top := 220;
  WatchFolderLabel.Caption := 'Watch Folder : -';

  VerifyProgress := TNewProgressBar.Create(MachinePage);
  VerifyProgress.Parent := MachinePage.Surface;
  VerifyProgress.Left := 10;
  VerifyProgress.Top := 250;
  VerifyProgress.Width := 310;
  VerifyProgress.Height := 16;
  VerifyProgress.Style := npbstMarquee;
  VerifyProgress.Visible := False;
end;


{ Inno Setup re-enables the Next button by default whenever a page
  is displayed. This overrides that behavior on both custom pages
  so Next stays locked until each page's requirement is satisfied. }
procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = ServerPage.ID then
    WizardForm.NextButton.Enabled := (Trim(ServerUrlEdit.Text) <> '');

  if CurPageID = MachinePage.ID then
    WizardForm.NextButton.Enabled := IsMachineVerified;
end;


{ Safety net: even if the Next button state is somehow bypassed,
  block leaving either custom page without its requirement met. }
function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;

  if CurPageID = ServerPage.ID then
  begin
    if Trim(ServerUrlEdit.Text) = '' then
    begin
      MsgBox(
        'Please enter the Server URL before continuing.',
        mbError,
        MB_OK
      );
      Result := False;
      Exit;
    end;

    ServerBaseUrl := NormalizeServerUrl(ServerUrlEdit.Text);
    ServerUrlEdit.Text := ServerBaseUrl;
  end;

  if (CurPageID = MachinePage.ID) and (not IsMachineVerified) then
  begin
    MsgBox(
      'Please verify the Machine Code before continuing.',
      mbError,
      MB_OK
    );
    Result := False;
  end;
end;


procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
  ServicePath: String;
begin
  if CurStep = ssPostInstall then
  begin
    if not FileExists(TempConfigFile) then
    begin
      MsgBox(
        'Machine configuration was not found.' + #13#10 +
        'Installation cannot continue.',
        mbError,
        MB_OK
      );
      Abort;
    end;

    if not CopyFile(
        TempConfigFile,
        ExpandConstant('{app}\connector.json'),
        False
    ) then
    begin
      MsgBox(
        'Failed to copy the machine configuration to the installation directory.',
        mbError,
        MB_OK
      );
      Abort;
    end;

    ServicePath := ExpandConstant('{app}\MachineConnector.exe');

    { Stop old service, if present }
    Exec(
      ExpandConstant('{cmd}'),
      '/C sc stop "MachineConnector"',
      '',
      SW_HIDE,
      ewWaitUntilTerminated,
      ResultCode
    );

    { Delete old service, if present }
    Exec(
      ExpandConstant('{cmd}'),
      '/C sc delete "MachineConnector"',
      '',
      SW_HIDE,
      ewWaitUntilTerminated,
      ResultCode
    );

    { Create service }
    Exec(
      ExpandConstant('{cmd}'),
      '/C sc create "MachineConnector" binPath= "' +
      ServicePath + '" start= auto',
      '',
      SW_HIDE,
      ewWaitUntilTerminated,
      ResultCode
    );

    { Start service }
    Exec(
      ExpandConstant('{cmd}'),
      '/C sc start "MachineConnector"',
      '',
      SW_HIDE,
      ewWaitUntilTerminated,
      ResultCode
    );
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    Exec(
      ExpandConstant('{cmd}'),
      '/C sc stop "MachineConnector"',
      '',
      SW_HIDE,
      ewWaitUntilTerminated,
      ResultCode
    );

    Exec(
      ExpandConstant('{cmd}'),
      '/C sc delete "MachineConnector"',
      '',
      SW_HIDE,
      ewWaitUntilTerminated,
      ResultCode
    );
  end;
end;
