const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const FeatureManager = require('./FeatureManager');
require('dotenv').config();

const commands = [];
const loadedCommands = [];

// Create feature manager instance
const featureManager = new FeatureManager();

// Load all command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        loadedCommands.push(command);
        console.log(`Loaded command: ${command.data.name}`);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Auto-register new commands in feature system (always runs, even if Discord deployment fails)
console.log('🔍 Checking for new commands to register...');
const newCommandsAdded = featureManager.autoRegisterCommands(loadedCommands);
const existingCommandNames = loadedCommands.map(cmd => cmd.data.name);
const commandsRemoved = featureManager.cleanupRemovedCommands(existingCommandNames);

if (newCommandsAdded || commandsRemoved) {
    console.log('🔄 Feature system updated with command changes');
}

// Check if we should skip Discord deployment (for CI/CD or register-only mode)
const skipDiscordDeploy = process.argv.includes('--register-only') || process.argv.includes('--no-deploy');

if (skipDiscordDeploy) {
    console.log('📝 Register-only mode: Commands registered in feature system without Discord deployment');
    console.log(`✅ Successfully registered ${commands.length} commands in feature system`);
    process.exit(0);
}

// Validate required environment variables for Discord deployment
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is required for Discord deployment');
    console.log('💡 Use --register-only flag to skip Discord deployment and only update feature system');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error('❌ CLIENT_ID is required for Discord deployment');
    console.log('💡 Use --register-only flag to skip Discord deployment and only update feature system');
    process.exit(1);
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy the commands
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // For guild commands (faster for testing)
        if (process.env.GUILD_ID) {
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`Successfully reloaded ${data.length} guild application (/) commands.`);
        } else {
            // For global commands (takes up to 1 hour to update)
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(`Successfully reloaded ${data.length} global application (/) commands.`);
        }
    } catch (error) {
        console.error('❌ Discord deployment failed:', error.message);
        console.log('✅ However, feature system was successfully updated');
        console.log('💡 Commands are registered locally and ready for when Discord is available');
        process.exit(1); // Exit with error code for CI/CD awareness
    }
})();
