const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");
const isDev = require("electron-is-dev");

const ipc = require("./ipc");

let mainWindow;

function getUserDataPath() {
  return (electron.app || electron.remote.app).getPath('userData')
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      nodeIntegration: true,
      webviewTag: true,
      // enableRemoteModule: true,
      webSecurity: false,
      devTools: true,
    },
    icon: path.join(__dirname, 'logo.png')
  });

  ipc.bind(mainWindow)

  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `https://ui.ddjiz54usibps.amplifyapp.com/`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.setResizable(true);
  mainWindow.on('closed', () => (mainWindow = null));
  mainWindow.focus();

}


app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
