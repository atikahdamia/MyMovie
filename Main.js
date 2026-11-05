const { app, BrowserWindow } = require('electron');
const path = require('path');

// Create the application window
function createWindow() {

    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 650,

        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Load Home page
    win.loadFile('index.html');
}

// Open application when Electron is ready
app.whenReady().then(function() {
    createWindow();

    app.on('activate', function() {

        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }

    });
});

// Close application when all windows are closed
app.on('window-all-closed', function() {

    if (process.platform !== 'darwin') {
        app.quit();
    }

});