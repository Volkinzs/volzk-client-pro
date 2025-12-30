const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Electron Store default path logic approximation
const configPath = path.join(os.homedir(), '.config', 'volzk-client-pro', 'config.json');

console.log('Checking for config file at:', configPath);

if (fs.existsSync(configPath)) {
    try {
        fs.unlinkSync(configPath);
        console.log('SUCCESS: Configuration file deleted. Client settings reset to default.');
    } catch (err) {
        console.error('ERROR: Could not delete config file:', err);
    }
} else {
    console.log('NOTICE: No configuration file found. Maybe it is already reset or in a different location.');
}
