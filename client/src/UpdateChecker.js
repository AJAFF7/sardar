import React, { useEffect, useState } from 'react';

const UpdateChecker = () => {
  const [status, setStatus] = useState('🔍 Checking for updates...');

  useEffect(() => {
    if (window.electronUpdater) {
      window.electronUpdater.onUpdateAvailable(() => {
        setStatus("🔄 Update available. Downloading...");
      });

      window.electronUpdater.onUpdateDownloaded(() => {
        setStatus("✅ Update downloaded. Restarting in 5 seconds...");
        setTimeout(() => {
          window.electronUpdater.restartApp();
        }, 5000);
      });
    } else {
      setStatus("⚠️ Updater not available");
    }
  }, []);

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>Update Checker</h2>
      <p>{status}</p>
    </div>
  );
};

export default UpdateChecker;