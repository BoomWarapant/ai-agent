using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Security.Cryptography;
using System.Windows.Forms;

internal static class CrdBotSetup
{
    static readonly Assembly Self = Assembly.GetExecutingAssembly();
    static readonly string Version = Self.GetName().Version.ToString(3);
    static readonly string Title = "crd-bot Setup " + Version;

    static string Digest(Stream content)
    {
        using (var sha = SHA256.Create())
            return BitConverter.ToString(sha.ComputeHash(content)).Replace("-", "").ToLowerInvariant();
    }

    static void CheckPackage(string root)
    {
        using (var stream = Self.GetManifestResourceStream("package.zip"))
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Read))
        {
            foreach (var entry in zip.Entries)
            {
                using (var original = entry.Open())
                using (var extracted = File.OpenRead(Path.Combine(root, entry.FullName)))
                    if (Digest(original) != Digest(extracted))
                        throw new InvalidDataException("Package file differs: " + entry.FullName);
            }
        }
    }

    static void Unpack(string root)
    {
        using (var stream = Self.GetManifestResourceStream("package.zip"))
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Read))
            zip.ExtractToDirectory(root);
        CheckPackage(root);
    }

    static string InstallFiles(bool verifyOnly)
    {
        string parent = verifyOnly ? Path.GetTempPath() : Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "crd-bot", "releases");
        Directory.CreateDirectory(parent);
        string target = Path.Combine(parent, Version);
        if (!verifyOnly && Directory.Exists(target))
        {
            CheckPackage(target);
            return target;
        }
        var staging = Directory.CreateDirectory(Path.Combine(parent, "crd-setup-" + Guid.NewGuid().ToString("N")));
        try
        {
            Unpack(staging.FullName);
            if (!verifyOnly)
            {
                try { Directory.Move(staging.FullName, target); }
                catch (IOException) { if (!Directory.Exists(target)) throw; CheckPackage(target); }
            }
            return target;
        }
        finally { if (Directory.Exists(staging.FullName)) Directory.Delete(staging.FullName, true); }
    }

    [STAThread]
    static int Main(string[] args)
    {
        bool verifyOnly = args.Length == 1 && args[0] == "--verify";
        try
        {
            if (args.Length != 0 && !verifyOnly) return 2;
            if (verifyOnly) { InstallFiles(true); return 0; }
            string prompt = "ติดตั้ง crd-bot " + Version + " หรืออัปเดตชุด crd-bot-team ที่มีอยู่สำหรับผู้ใช้ Windows คนนี้ครับ\n\n"
                + "เครื่องต้องมี WSL 2 และ Ubuntu-24.04 ที่เปิดใช้งาน systemd แล้วครับ "
                + "ตัวติดตั้งจะใช้อินเทอร์เน็ตเพื่อติดตั้ง Docker ใน Ubuntu และดาวน์โหลดส่วนประกอบครับ\n\n"
                + "เมื่อติดตั้งเสร็จ ให้เปิด crd-bot-team จาก Desktop และเชื่อมต่อโมเดลของผู้ใช้ครับ";
            if (MessageBox.Show(prompt, Title, MessageBoxButtons.OKCancel, MessageBoxIcon.Information)
                != DialogResult.OK) return 0;
            string root = InstallFiles(false);
            string script = Path.Combine(root, "Install-crd-bot.ps1");
            string powershell = Path.Combine(Environment.SystemDirectory, @"WindowsPowerShell\v1.0\powershell.exe");
            var start = new ProcessStartInfo(powershell, "-NoProfile -ExecutionPolicy Bypass -File \"" + script + "\" -FromSetup");
            start.UseShellExecute = false;
            start.WorkingDirectory = root;
            using (var child = Process.Start(start))
            {
                child.WaitForExit();
                if (child.ExitCode != 0)
                    throw new InvalidOperationException("ติดตั้งไม่สำเร็จครับ หากยังไม่มี Ubuntu-24.04 "
                        + "ให้ติดตั้งด้วย wsl --install -d Ubuntu-24.04 จาก PowerShell แบบ Administrator "
                        + "แล้วเปิด Ubuntu เพื่อตั้งค่าครั้งแรกครับ\n\n"
                        + "ตรวจข้อความจากตัวติดตั้งอีกครั้งได้ด้วยคำสั่งครับ\n"
                        + "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"" + script + "\" -FromSetup");
            }
            return 0;
        }
        catch (Exception error)
        {
            if (!verifyOnly) MessageBox.Show(error.Message, Title, MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
}
