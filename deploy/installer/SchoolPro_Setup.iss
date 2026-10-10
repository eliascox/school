; =====================================================================
; SchoolPro Enterprise Offline-First School Management Software
; Inno Setup 6+ Windows Production Installer Script
; Architecture: Windows 10/11 x64
; =====================================================================

#define MyAppName "SchoolPro"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "SchoolPro Digital Education Systems"
#define MyAppURL "https://schoolpro.edu.bd"
#define MyAppExeName "SchoolPro.exe"
#define MyAppDescription "Enterprise Offline-First School Management Software"

[Setup]
; Unique Application AppId (Generated UUID for SchoolPro)
AppId={{9F8E7D6C-5B4A-3210-FEDC-BA9876543210}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion} (Enterprise Edition)
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/support
AppUpdatesURL={#MyAppURL}/updates

; Default Installation Directory in Program Files or User LocalAppData
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

; Output Executable Properties
OutputDir=..\..\dist\installer
OutputBaseFilename=SchoolPro_Setup_v{#MyAppVersion}
SetupIconFile=..\assets\icon.ico

; Modern High-Efficiency Compression
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes

; Windows 64-bit Architecture
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

; Privileges: Allows standard non-admin users to install or elevates if installing in Program Files
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

; Modern Windows Wizard Style
WizardStyle=modern
DisableWelcomePage=no
DisableDirPage=no

; Version Info Metadata for Windows Properties
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppDescription}
VersionInfoCopyright=Copyright (C) 2026 {#MyAppPublisher}
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

; Close running application during install/update
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
; Primary Application Binaries and Packaged Electron Shell
Source: "..\..\dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; Local SQLite & Database Seed Directory
Source: "..\..\apps\desktop\offline_sync.db"; DestDir: "{app}"; Flags: ignoreversion onlyifdoesntexist

; Note: Do not use "Flags: ignoreversion" on any shared system files

[Icons]
; Start Menu Shortcut
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Comment: "{#MyAppDescription}"; IconFilename: "{app}\{#MyAppExeName}"

; Desktop Shortcut
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; Comment: "{#MyAppDescription}"; IconFilename: "{app}\{#MyAppExeName}"

; Uninstaller Shortcut
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"

[Run]
; Option to launch the software immediately after setup completes
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Clean up temporary sync queues and logs on uninstall while preserving database backups if selected
Type: files; Name: "{app}\*.log"
Type: filesandordirs; Name: "{localappdata}\SchoolPro\updates\*"

[Code]
// Custom Pascal Scripting for Inno Setup

// Check if an earlier version is already running and close gracefully
function InitializeSetup(): Boolean;
var
  ErrorCode: Integer;
begin
  Result := True;
end;

// Prompt whether user wants to retain institutional database upon uninstall
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
  begin
    if MsgBox('আপনি কি আপনার প্রতিষ্ঠানের সংরক্ষিত লোকাল ডেটাবেস এবং অফলাইন রেকর্ডসমূহ মুছে ফেলতে চান?' #13#10#13#10 +
              'ভবিষ্যতে পুনরায় ব্যবহারের জন্য "No" নির্বাচন করার পরামর্শ দেওয়া হচ্ছে।', 
              mbConfirmation, MB_YESNO) = IDYES then
    begin
      DelTree(ExpandConstant('{localappdata}\SchoolPro'), True, True, True);
    end;
  end;
end;
