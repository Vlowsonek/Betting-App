const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const dbPath = path.join(app.getAppPath(), 'my-database.sqlite');
const db = new sqlite3.Database(dbPath);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
    });

    mainWindow.loadFile('index.html');

    ipcMain.handle('registerUser', (event, userData) => {
        // Insert user data into SQLite database
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [userData.username, userData.password], (err) => {
            if (err) {
                console.error('Error registering user:', err.message);
                return { success: false, error: err.message };
            }
            console.log('User registered successfully');
            return { success: true };
        });
    });

    ipcMain.handle('loginUser', (event, loginData) => {
        // Check if username and password match in SQLite database
        db.get('SELECT * FROM users WHERE username = ? AND password = ?', [loginData.username, loginData.password], (err, row) => {
            if (err) {
                console.error('Error logging in:', err.message);
                return { success: false, error: err.message };
            }
            if (row) {
                console.log('Login successful');
                return { success: true };
            } else {
                console.log('Login failed: Incorrect username or password');
                return { success: false, error: 'Incorrect username or password' };
            }
        });
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Close SQLite database connection when app is quitting
app.on('quit', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Closed the database connection');
    });
});
