import { is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, Menu, Notification, screen, shell, Tray } from 'electron'
import { exec } from 'child_process'
import { join } from 'path'
import icon from '../../resources/favicon-96x96.png'

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  const windowWidth = 370
  const windowHeight = 500

  // Calculate the position: 20px away from the right and bottom edges
  const x = width - windowWidth - 20
  const y = height - windowHeight - 20

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 370,
    height: 500,
    resizable: false,
    show: false,
    autoHideMenuBar: true,
    x: x,
    y: y,
    icon: join(__dirname, '../../resources/favicon-96x96.png'),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Open the DevTools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools()
  }

  const tray = new Tray(join(__dirname, '../../resources/white/favicon.png'))
  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show()
      }
    }
    // {
    //   label: 'Quit',
    //   click: () => {
    //     app.exit()
    //   }
    // }
  ])
  tray.setToolTip('iBattery')
  tray.setContextMenu(trayMenu)

  tray.on('double-click', () => {
    mainWindow.show()
  })

  if (process.platform === 'win32') {
    app.setAppUserModelId('iBattery')
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Minimize to tray on minimize
  mainWindow.on('minimize', (event) => {
    event.preventDefault()
    mainWindow.hide()
  })

  // Minimize to tray on close
  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow.hide()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // enable auto start on login
  const autoStartSettings = app.getLoginItemSettings()

  !autoStartSettings.openAtLogin &&
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe'),
      args: ['--hidden']
    })

  // Set app user model id for windows
  app.setAppUserModelId('com.ace.ibattery')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // create notification event
  const notification = new Notification({
    title: 'iBattery',
    icon: join(__dirname, '../../resources/favicon-96x96.png'),
    timeoutType: 'never',
    silent: false,
    urgency: 'critical'
  })

  // Handle IPC events for notifications
  ipcMain.on('show-notification', (event, { body }) => {
    // Make sure the notification is triggered even if the app is minimized to tray
    notification.body = body
    notification.show()
  })

  function checkBattery() {
    exec(
      'wmic path Win32_Battery get EstimatedChargeRemaining, BatteryStatus',
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`)
          return
        }
        if (stderr) {
          console.error(`Stderr: ${stderr}`)
          return
        }
        // Parse the battery status
        const data = stdout.trim().split('\n')[1]?.trim() // Skip the header row
        if (!data) {
          console.log('Battery information not available. Are you on a laptop?')
          return
        }
        const [status, charge] = data.split(/\s+/).map(Number)
        // BatteryStatus = 2 means charging
        if (charge === 100 && status === 2) {
          notification.body = 'Battery fully charged. Please unplug the charger.'
          notification.show()
        }
      }
    )
  }

  setInterval(() => {
    checkBattery()
  }, 60000)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
