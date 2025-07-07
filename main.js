// main.js
const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater"); // ✅ Add updater
const log = require("electron-log"); // Optional: log updater info

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1700,
    height: 1167,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      enableRemoteModule: false,
      webviewTag: true,
    },
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
  });

  // Load local index.html immediately
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

  // Explicitly set the feed URL for updates
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "AJAFF7",
    repo: "sardar",
    // token: "<your_token_if_private>", // optional for private repos
  });

  autoUpdater.on("checking-for-update", () => {
    log.info("🔍 Checking for update...");
  });

  autoUpdater.on("update-available", (info) => {
    log.info("⬇️ Update available.", info);
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("✅ No updates available.", info);
  });

  autoUpdater.on("error", (err) => {
    log.error("❌ Error in auto-updater.", err);
  });

  autoUpdater.on("download-progress", (progress) => {
    log.info(`📦 Downloading update: ${Math.floor(progress.percent)}%`);
  });

  // PROMPT USER before installing update
  autoUpdater.on("update-downloaded", () => {
    log.info("✅ Update downloaded; prompting user to install now...");

    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: "question",
      buttons: ["Restart Now", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Update Available",
      message:
        "An update has been downloaded. Would you like to restart the app now to apply the update?",
    });

    if (choice === 0) {
      autoUpdater.quitAndInstall();
    } else {
      log.info("User chose to install the update later.");
    }
  });

  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  const serverPath = path.join(__dirname, "server.js");

  if (!fs.existsSync(serverPath)) {
    console.error("❌ server.js not found:", serverPath);
    return;
  }

  require(serverPath);
  createWindow();

  // ✅ Start update check after everything is initialized
  setupAutoUpdater();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
