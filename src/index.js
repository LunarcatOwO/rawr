// Load environment variables first
require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const FeatureManager = require('./FeatureManager');

// Import handlers
const { handleButtonInteraction } = require('./handlers/buttonHandler');
const { handleSelectMenuInteraction } = require('./handlers/selectMenuHandler');
const { handleModalSubmission } = require('./handlers/modalHandler');

// Import utilities
const { loadCommands, deployCommands } = require('./utils/commandUtils');
const { showFeatureToggles } = require('./utils/featureUtils');

// Create feature manager instance
const featureManager = new FeatureManager();

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Create a collection to store commands
client.commands = new Collection();

// Load commands initially
loadCommands(client, featureManager);

// Event listener for when the bot is ready
client.once('ready', async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);    
    // Auto-deploy commands on startup
    console.log('Auto-deploying commands...');
    const deployResult = await deployCommands(featureManager);
    if (deployResult.success) {
        console.log(`✅ Auto-deployed ${deployResult.count} commands successfully!`);
    } else {
        console.log(`❌ Failed to auto-deploy commands: ${deployResult.error}`);
    }
});

// Event listener for slash command interactions
client.on('interactionCreate', async interaction => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        // Check if command is enabled (except for rawr sys commands)
        if (interaction.commandName !== 'rawr' && !featureManager.isCommandEnabled(interaction.commandName)) {
            await interaction.reply({ 
                content: '⚠️ This command is currently disabled by the bot owner.', 
                ephemeral: true 
            });
            return;
        }        try {
            // Pass additional context for system commands
            if (interaction.commandName === 'rawr') {
                await command.execute(interaction, { 
                    loadCommands: () => loadCommands(client, featureManager), 
                    deployCommands: () => deployCommands(featureManager), 
                    featureManager 
                });
            } else {
                await command.execute(interaction);
            }
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    }
    
    // Handle button interactions
    else if (interaction.isButton()) {
        try {
            // Check if component interactions are enabled
            if (!featureManager.isFeatureEnabled('component_interactions')) {
                await interaction.reply({ 
                    content: '⚠️ Component interactions are currently disabled.', 
                    ephemeral: true 
                });
                return;
            }
            await handleButtonInteraction(interaction, featureManager);
        } catch (error) {
            console.error('Button interaction error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'There was an error processing your button click!', ephemeral: true });
            }
        }
    }
    
    // Handle select menu interactions
    else if (interaction.isAnySelectMenu()) {
        try {
            // Check if component interactions are enabled
            if (!featureManager.isFeatureEnabled('component_interactions')) {
                await interaction.reply({ 
                    content: '⚠️ Component interactions are currently disabled.', 
                    ephemeral: true 
                });
                return;
            }
            await handleSelectMenuInteraction(interaction, featureManager, showFeatureToggles);
        } catch (error) {
            console.error('Select menu interaction error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'There was an error processing your selection!', ephemeral: true });
            }
        }
    }
    
    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
        try {
            // Check if modal forms are enabled
            if (!featureManager.isFeatureEnabled('modal_forms')) {
                await interaction.reply({ 
                    content: '⚠️ Modal forms are currently disabled.', 
                    ephemeral: true 
                });
                return;
            }
            await handleModalSubmission(interaction);
        } catch (error) {
            console.error('Modal submission error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'There was an error processing your submission!', ephemeral: true });
            }
        }
    }
});

// Login to Discord with your bot token
// Make sure to create a .env file with your bot token
require('dotenv').config();
client.login(process.env.DISCORD_TOKEN);