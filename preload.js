// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronUpdater", {
  checkForUpdates: () => ipcRenderer.send("check-for-updates"),
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on("update-downloaded", callback),
});