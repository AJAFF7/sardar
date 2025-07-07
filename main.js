const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1700,
    height: 1167,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // ✅ Preload script
      nodeIntegration: false, // 🔒 Important for contextBridge
      contextIsolation: true, // ✅ Required for preload to work
      webviewTag: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html")).catch((err) => {
    console.error("Failed to load local HTML:", err);
  });

  mainWindow.webContents.on("dom-ready", () => {
    const imagePath =
      "file:///C:/Users/jaff/Environments/Alfa/resources/icons/k8s-bg.png";

    mainWindow.webContents.insertCSS(`
      * {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      ::-webkit-scrollbar { display: none; }

      body {
        background-image: url("${imagePath}");
        background-size: cover;
        background-position: center;
        overflow: hidden !important;
        margin: 0;
        height: 100vh;
        width: 100vw;
        border-radius: 14px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        background-color: transparent;
        font-family: 'Courier New', Courier, monospace;
      }

      html {
        border-radius: 12px;
        overflow: hidden;
        background-color: transparent;
      }
    `);
  });

  setTimeout(() => {
    mainWindow.loadURL("http://localhost:3535");
  }, 3000);

  mainWindow.webContents.on("did-fail-load", (event, code, description) => {
    console.error(`❌ Failed to load frontend: ${description} (code: ${code})`);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("✅ Frontend loaded successfully");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Auto updater setup
function setupAutoUpdater() {
  log.transports.file.level = "info";
  autoUpdater.logger = log;

  autoUpdater.on("checking-for-update", () => {
    log.info("🔍 Checking for update...");
  });

  autoUpdater.on("update-available", () => {
    log.info("⬇️ Update available");
    mainWindow.webContents.send("update_available");
  });

  autoUpdater.on("update-not-available", () => {
    log.info("✅ No updates available");
  });

  autoUpdater.on("error", (err) => {
    log.error("❌ Auto-updater error:", err);
  });

  autoUpdater.on("download-progress", (progress) => {
    log.info(`📦 Downloading update: ${Math.floor(progress.percent)}%`);
  });

  autoUpdater.on("update-downloaded", () => {
    log.info("✅ Update downloaded");
    mainWindow.webContents.send("update_downloaded");

    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: "question",
      buttons: ["Restart Now", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Update Ready",
      message: "An update has been downloaded. Restart the app now to apply the update?",
    });

    if (choice === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.checkForUpdatesAndNotify();
}

// Listen from preload (React) side
ipcMain.on("check_for_updates", () => {
  autoUpdater.checkForUpdatesAndNotify();
});

// App ready
app.whenReady().then(() => {
  const serverPath = path.join(__dirname, "server.js");

  if (!fs.existsSync(serverPath)) {
    console.error("❌ server.js not found:", serverPath);
    return;
  }

  require(serverPath);
  createWindow();
  setupAutoUpdater();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});