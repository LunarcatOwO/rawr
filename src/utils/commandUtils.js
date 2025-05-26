/**
 * Command loading utilities
 * Helper functions for loading and registering commands
 */

const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

/**
 * Load all commands from the commands directory
 * @param {Client} client - Discord.js Client instance
 * @param {FeatureManager} featureManager - Feature manager instance
 */
function loadCommands(client, featureManager) {
    // Clear existing commands
    client.commands.clear();
    
    // Clear require cache for commands to ensure fresh reload
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    // Clear cache for all command files
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        delete require.cache[require.resolve(filePath)];
    }
    
    // Load commands fresh and collect them for auto-registration
    const loadedCommands = [];
    const existingCommandNames = [];
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            loadedCommands.push(command);
            existingCommandNames.push(command.data.name);
            console.log(`Loaded command: ${command.data.name}`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
    
    // Auto-register new commands in the feature system
    const newCommandsAdded = featureManager.autoRegisterCommands(loadedCommands);
    
    // Clean up removed commands
    const commandsRemoved = featureManager.cleanupRemovedCommands(existingCommandNames);
    
    if (newCommandsAdded || commandsRemoved) {
        console.log('🔄 Feature system updated with command changes');
    }
}

/**
 * Deploy commands to Discord
 * @param {FeatureManager} featureManager - Feature manager instance
 */
async function deployCommands(featureManager) {
    const commands = [];
    const loadedCommands = [];
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        // Clear cache to get fresh command data
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            loadedCommands.push(command);
        }
    }

    // Auto-register commands in feature system (always runs, even if Discord deployment fails)
    featureManager.autoRegisterCommands(loadedCommands);

    // Check if we have the required environment variables
    if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
        console.log('⚠️ Missing Discord credentials, skipping Discord deployment');
        return { success: false, error: 'Missing DISCORD_TOKEN or CLIENT_ID' };
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands globally.`);

        // Always deploy globally
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log(`Successfully reloaded ${data.length} global application (/) commands.`);
        
        return { success: true, count: data.length };
    } catch (error) {
        console.error('Error deploying commands:', error);
        console.log('✅ Feature system was updated successfully despite Discord deployment failure');
        return { success: false, error: error.message };
    }
}

module.exports = { loadCommands, deployCommands };
