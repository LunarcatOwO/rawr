// Server-specific settings management system
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, 'server-settings.json');

class ServerSettingsManager {
    constructor() {
        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            if (fs.existsSync(SETTINGS_FILE)) {
                const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading server settings:', error);
        }
        
        return {};
    }

    saveSettings() {
        try {
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving server settings:', error);
            return false;
        }
    }

    getServerSettings(guildId) {
        if (!this.settings[guildId]) {
            this.settings[guildId] = {
                disabledCommands: [],
                settingsManagers: [] // User IDs who can manage settings
            };
            this.saveSettings();
        }
        return this.settings[guildId];
    }

    isCommandDisabled(guildId, commandName) {
        const serverSettings = this.getServerSettings(guildId);
        return serverSettings.disabledCommands.includes(commandName);
    }

    disableCommand(guildId, commandName) {
        const serverSettings = this.getServerSettings(guildId);
        if (!serverSettings.disabledCommands.includes(commandName)) {
            serverSettings.disabledCommands.push(commandName);
            this.saveSettings();
            return true;
        }
        return false;
    }

    enableCommand(guildId, commandName) {
        const serverSettings = this.getServerSettings(guildId);
        const index = serverSettings.disabledCommands.indexOf(commandName);
        if (index > -1) {
            serverSettings.disabledCommands.splice(index, 1);
            this.saveSettings();
            return true;
        }
        return false;
    }

    toggleCommand(guildId, commandName) {
        const serverSettings = this.getServerSettings(guildId);
        const isDisabled = serverSettings.disabledCommands.includes(commandName);
        
        if (isDisabled) {
            return this.enableCommand(guildId, commandName);
        } else {
            return this.disableCommand(guildId, commandName);
        }
    }

    canManageSettings(guildId, userId, guild) {
        // Server owner can always manage settings
        if (guild.ownerId === userId) {
            return true;
        }

        // Check if user is in the settings managers list
        const serverSettings = this.getServerSettings(guildId);
        return serverSettings.settingsManagers.includes(userId);
    }

    addSettingsManager(guildId, userId) {
        const serverSettings = this.getServerSettings(guildId);
        if (!serverSettings.settingsManagers.includes(userId)) {
            serverSettings.settingsManagers.push(userId);
            this.saveSettings();
            return true;
        }
        return false;
    }

    removeSettingsManager(guildId, userId) {
        const serverSettings = this.getServerSettings(guildId);
        const index = serverSettings.settingsManagers.indexOf(userId);
        if (index > -1) {
            serverSettings.settingsManagers.splice(index, 1);
            this.saveSettings();
            return true;
        }
        return false;
    }

    getSettingsManagers(guildId) {
        const serverSettings = this.getServerSettings(guildId);
        return serverSettings.settingsManagers;
    }

    getDisabledCommands(guildId) {
        const serverSettings = this.getServerSettings(guildId);
        return serverSettings.disabledCommands;
    }

    // Get available commands (those enabled by system admin)
    getAvailableCommands(featureManager) {
        const allCommands = featureManager.getAllCommands();
        const availableCommands = {};
        
        for (const [commandName, commandData] of Object.entries(allCommands)) {
            if (commandData.enabled && commandName !== 'settings') {
                availableCommands[commandName] = commandData;
            }
        }
        
        return availableCommands;
    }
}

module.exports = ServerSettingsManager;
