// Feature management system for the bot
const fs = require('fs');
const path = require('path');

const FEATURES_FILE = path.join(__dirname, 'features.json');

// Default features configuration
const DEFAULT_FEATURES = {
    commands: {
        ping: { enabled: true, description: 'Bot latency testing with interactive buttons' },
        user: { enabled: true, description: 'User information with rich embeds and profiles' },
        server: { enabled: true, description: 'Server information and statistics' },
        say: { enabled: true, description: 'Make the bot speak messages' },
        roll: { enabled: true, description: 'Dice rolling with interactive buttons' },
        components: { enabled: true, description: 'Discord Components v2 showcase and demos' },
        announce: { enabled: true, description: 'Modal-based announcement creation' }
    },
    features: {
        auto_deploy: { enabled: true, description: 'Automatically deploy commands on bot startup' },
        component_interactions: { enabled: true, description: 'Handle button and select menu interactions' },
        modal_forms: { enabled: true, description: 'Support for modal form submissions' },
        rich_embeds: { enabled: true, description: 'Enhanced message formatting with embeds' },
        error_handling: { enabled: true, description: 'Comprehensive error handling and user feedback' }
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
}

module.exports = FeatureManager;
