const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

let mainWindow;

// 🪟 Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1700,
    height: 1167,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  // Load initial HTML file (fallback)
  mainWindow.loadFile(path.join(__dirname, "index.html")).catch((err) => {
    console.error("❌ Failed to load local HTML:", err);
  });

  // Inject custom background image
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

  // Load React app after 3s delay
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

// 🔄 Auto-updater setup
function setupAutoUpdater() {
  // Log config
  log.transports.file.level = "info";
  autoUpdater.logger = log;

  // Optional: manually set feed URL (not needed for public GitHub repos)
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "AJAFF7",
    repo: "sardar",
  });

  autoUpdater.on("checking-for-update", () => {
    log.info("🔍 Checking for update...");
  });

  autoUpdater.on("update-available", () => {
    log.info("⬇️ Update available");
    if (mainWindow) mainWindow.webContents.send("update_available");
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
    if (mainWindow) mainWindow.webContents.send("update_downloaded");

    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: "question",
      buttons: ["Restart Now", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Update Ready",
      message:
        "An update has been downloaded. Do you want to restart the app now to apply it?",
    });

    if (choice === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  // Start checking
  autoUpdater.checkForUpdatesAndNotify();
}

// IPC: manual trigger from renderer (optional)
ipcMain.on("check_for_updates", () => {
  log.info("🧠 Received check_for_updates from renderer");
  autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.on("restart_app", () => {
  log.info("♻️ Received restart_app from renderer");
  autoUpdater.quitAndInstall();
});

// 🔄 App startup
app.whenReady().then(() => {
  const serverPath = path.join(__dirname, "server.js");

  if (!fs.existsSync(serverPath)) {
    console.error("❌ server.js not found:", serverPath);
    return;
  }

  require(serverPath); // Start backend
  createWindow();       // Start UI
  setupAutoUpdater();   // Setup auto-updates
});

// macOS: keep app open until user quits
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});