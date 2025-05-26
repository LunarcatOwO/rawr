// Feature management system for the bot
const fs = require('fs');
const path = require('path');

const FEATURES_FILE = path.join(__dirname, 'features.json');

// Default features configuration
const DEFAULT_FEATURES =     {
            "commands": {
                    "ping": {
                            "enabled": true,
                            "description": "Bot latency testing with interactive buttons"
                    },                    "user": {
                            "enabled": true,
                            "description": "Interactive user profile dashboard with select menus and buttons"
                    },
                    "server": {
                            "enabled": true,
                            "description": "Interactive server information panel with dynamic content"
                    },
                    "say": {
                            "enabled": true,
                            "description": "Make the bot speak messages"
                    },
                    "roll": {
                            "enabled": true,
                            "description": "Dice rolling with interactive buttons"
                    },
                    "components": {
                            "enabled": true,
                            "description": "Discord Components v2 showcase and demos"
                    },
                    "announce": {
                            "enabled": true,
                            "description": "Modal-based announcement creation"
                    },
                    "hello": {
                            "enabled": true,
                            "description": "Says hello to you!"
                    },
                    "rawr": {
                            "enabled": true,
                            "description": "Bot system commands"
                    },
                    "settings": {
                            "enabled": true,
                            "description": "Server settings management for command control and permissions"
                    },
                    "test": {
                            "enabled": true,
                            "description": "Make the bot say something"
                    }
            },
            "features": {
                    "auto_deploy": {
                            "enabled": true,
                            "description": "Automatically deploy commands on bot startup"
                    },
                    "component_interactions": {
                            "enabled": true,
                            "description": "Handle button and select menu interactions"
                    },
                    "modal_forms": {
                            "enabled": true,
                            "description": "Support for modal form submissions"
                    },                    "rich_embeds": {
                            "enabled": false,
                            "description": "Traditional embed formatting (deprecated - using components instead)"
                    },
                    "component_ui": {
                            "enabled": true,
                            "description": "Modern component-based user interface with buttons and select menus"
                    },
                    "error_handling": {
                            "enabled": true,
                            "description": "Comprehensive error handling and user feedback"
                    }
            }
    };

class FeatureManager {
    constructor() {
        this.features = this.loadFeatures();
    }

    loadFeatures() {
        try {
            if (fs.existsSync(FEATURES_FILE)) {
                const data = fs.readFileSync(FEATURES_FILE, 'utf8');
                const loaded = JSON.parse(data);
                
                // Merge with defaults to ensure new features are included
                const merged = {
                    commands: { ...DEFAULT_FEATURES.commands, ...loaded.commands },
                    features: { ...DEFAULT_FEATURES.features, ...loaded.features }
                };
                
                return merged;
            }
        } catch (error) {
            console.error('Error loading features:', error);
        }
        
        return DEFAULT_FEATURES;
    }

    saveFeatures() {
        try {
            fs.writeFileSync(FEATURES_FILE, JSON.stringify(this.features, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving features:', error);
            return false;
        }
    }

    isCommandEnabled(commandName) {
        return this.features.commands[commandName]?.enabled || false;
    }

    isFeatureEnabled(featureName) {
        return this.features.features[featureName]?.enabled || false;
    }

    toggleCommand(commandName) {
        if (this.features.commands[commandName]) {
            this.features.commands[commandName].enabled = !this.features.commands[commandName].enabled;
            this.saveFeatures();
            return this.features.commands[commandName].enabled;
        }
        return null;
    }

    toggleFeature(featureName) {
        if (this.features.features[featureName]) {
            this.features.features[featureName].enabled = !this.features.features[featureName].enabled;
            this.saveFeatures();
            return this.features.features[featureName].enabled;
        }
        return null;
    }

    getAllCommands() {
        return this.features.commands;
    }

    getAllFeatures() {
        return this.features.features;
    }

    getStatus() {
        const enabledCommands = Object.values(this.features.commands).filter(cmd => cmd.enabled).length;
        const totalCommands = Object.keys(this.features.commands).length;
        const enabledFeatures = Object.values(this.features.features).filter(feat => feat.enabled).length;
        const totalFeatures = Object.keys(this.features.features).length;

        return {
            commands: { enabled: enabledCommands, total: totalCommands },
            features: { enabled: enabledFeatures, total: totalFeatures }
        };
    }

    // Auto-register new commands found in the commands directory
    autoRegisterCommands(commandsArray) {
        let newCommandsAdded = false;
        
        for (const command of commandsArray) {
            const commandName = command.data.name;
            
            // If command doesn't exist in features, add it
            if (!this.features.commands[commandName]) {
                const description = command.data.description || 'Auto-generated command entry';
                
                this.features.commands[commandName] = {
                    enabled: true,
                    description: description
                };
                
                console.log(`✨ Auto-registered new command: ${commandName}`);
                newCommandsAdded = true;
            }
        }
        
        // Save if new commands were added
        if (newCommandsAdded) {
            this.saveFeatures();
            this.updateDefaultFeatures();
        }
        
        return newCommandsAdded;
    }

    // Update the DEFAULT_FEATURES in the source file
    updateDefaultFeatures() {
        const fs = require('fs');
        const path = require('path');
        
        try {
            const filePath = path.join(__dirname, 'FeatureManager.js');
            let fileContent = fs.readFileSync(filePath, 'utf8');
            
            // Create the new DEFAULT_FEATURES object string
            const defaultFeaturesString = `const DEFAULT_FEATURES = ${JSON.stringify({
                commands: this.features.commands,
                features: this.features.features
            }, null, 8).replace(/^/gm, '    ')};`;
            
            // Replace the existing DEFAULT_FEATURES declaration
            const defaultFeaturesRegex = /const DEFAULT_FEATURES = \{[\s\S]*?\};/;
            fileContent = fileContent.replace(defaultFeaturesRegex, defaultFeaturesString);
            
            // Write the updated content back to the file
            fs.writeFileSync(filePath, fileContent, 'utf8');
            console.log('✅ Updated DEFAULT_FEATURES in FeatureManager.js');
            
        } catch (error) {
            console.error('❌ Error updating DEFAULT_FEATURES:', error);
        }
    }

    // Remove commands that no longer exist in the file system
    cleanupRemovedCommands(existingCommandNames) {
        let commandsRemoved = false;
        const currentCommandNames = Object.keys(this.features.commands);
        
        for (const commandName of currentCommandNames) {
            if (!existingCommandNames.includes(commandName)) {
                delete this.features.commands[commandName];
                console.log(`🗑️ Removed deleted command from features: ${commandName}`);
                commandsRemoved = true;
            }
        }
        
        if (commandsRemoved) {
            this.saveFeatures();
            this.updateDefaultFeatures();
        }
        
        return commandsRemoved;
    }
}

module.exports = FeatureManager;
