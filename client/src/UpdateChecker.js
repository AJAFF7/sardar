import React, { useEffect, useState } from 'react';

const UpdateChecker = () => {
  const [status, setStatus] = useState("Checking for updates...");

  useEffect(() => {
    if (window.electronUpdater) {
      window.electronUpdater.checkForUpdates();

      window.electronUpdater.onUpdateAvailable(() => {
        setStatus("🔄 Update is available. Downloading...");
      });

      window.electronUpdater.onUpdateDownloaded(() => {
        setStatus("✅ Update downloaded. Restarting to install...");
        setTimeout(() => {
          window.location.reload(); // or use IPC to trigger `autoUpdater.quitAndInstall()`
        }, 5000);
      });
    } else {
      setStatus("⚠️ Electron updater not available.");
    }
  }, []);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>Update Checker</h2>
      <p>{status}</p>
    </div>
  );
};

export default UpdateChecker;