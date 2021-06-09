const { ipcMain, shell } = require('electron')
const electron = require("electron");
// const { TaobaoCrawler, PuppeteerInstaller, PuppeteerPool } = require('flex-crawling')

function getUserDataPath() {
  return (electron.app || electron.remote.app).getPath('userData')
}

const appPath = getUserDataPath()
// const installer = new PuppeteerInstaller(appPath)
// const puppeteerPool = new PuppeteerPool({ appPath, installer })

// const taobao = new TaobaoCrawler({ appPath, installer })

module.exports = {
  bind: (mainWindow) => {
    const printToWebConsole = (message) => {
      mainWindow.webContents.send('print', message)
    }

/*    ipcMain.handle('existsBrowser', (event, _) => {
      printToWebConsole('existsBrowser called')

      return installer.existsBrowser
    })*/

/*    ipcMain.handle('parseURL', async (event, payload) => {
      printToWebConsole('parseURL called')

      const url = payload.url
      const product = await taobao.crawl(url)

      return product
    })*/

    /*ipcMain.handle('downloadBrowser', async (event, _) => {
      printToWebConsole('downloadBrowser called')

      const downloadProgressStatus = (downloaded, total) => {
        const progress = (downloaded / total * 100).toFixed(0)
        mainWindow.webContents.send('downloadProgress', progress)
      }

      return await installer.downloadBrowser(downloadProgressStatus)
    })

    ipcMain.handle('openDefaultBrowser', async (event, payload) => {
      printToWebConsole('openDefaultBrowser called')

      const url = payload.url
      shell.openExternal(url)
    })

    ipcMain.handle('openPuppeteerWindow', async (event, payload) => {
      printToWebConsole('openPuppeteerWindow called')

      const url = payload.url
      return await puppeteerPool.openBrowser(url)
    })

    ipcMain.handle('setCookies', async (event, payload) => {
      printToWebConsole('setCookies called')
      printToWebConsole(payload)

      const cookies = payload.cookies
      const json = JSON.parse(cookies)
      return await puppeteerPool.setCookies(json)
    })*/
  }
}
