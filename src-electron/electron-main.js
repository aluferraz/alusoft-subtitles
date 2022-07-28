import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron'
import path from 'path'
import os from 'os'

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

try {
  if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
  }
}
catch (_) { }

let mainWindow



import {
  // convertSample,
  // uploadSample,
  storeData,
  readData,
  clearData,
  openCredFile,
  openFile,
  createSubs
} from './alusoft-video-subtitles'
import { channels } from './alusoft-channels';

function createWindow() {


  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.ico'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
    },
    //frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#2B0056',
      symbolColor: '#74b1be'
    }
  })
  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools()
  }
  else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  //LMF
  // ipcMain.handle(channels.sample.convert, convertSample);
  // ipcMain.handle(channels.sample.upload, uploadSample);

  ipcMain.handle(channels.storage.store, storeData);
  ipcMain.handle(channels.storage.read, readData);
  ipcMain.handle(channels.storage.clear, clearData);

  ipcMain.handle(channels.file.openCredFile, openCredFile);
  ipcMain.handle(channels.file.open, openFile);
  ipcMain.handle(channels.subtitle.create, async (event, data) => {
    return await createSubs(event, data, mainWindow);
  });
  // ipcMain.on('subtitle-update', async (msg) => {
  //   mainWindow.webContents.send("update-message", msg)
  // })

  // setTimeout(() => { mainWindow.flashFrame(false) }, 6000)
  // mainWindow.flashFrame(true)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

