// Load environment variables first
require('dotenv').config();

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const FeatureManager = require('./FeatureManager');

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

// Function to load commands
function loadCommands() {
    // Clear existing commands
    client.commands.clear();
    
    // Clear require cache for commands to ensure fresh reload
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    // Clear cache for all command files
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        delete require.cache[require.resolve(filePath)];
    }
    
    // Load commands fresh
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Function to deploy commands to Discord
async function deployCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        // Clear cache to get fresh command data
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
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
        return { success: false, error: error.message };
    }
}

// Load commands initially
loadCommands();

// Event listener for when the bot is ready
client.once('ready', async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    
    // Auto-deploy commands on startup
    console.log('Auto-deploying commands...');
    const deployResult = await deployCommands();
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
        }

        try {
            // Pass additional context for system commands
            if (interaction.commandName === 'rawr') {
                await command.execute(interaction, { loadCommands, deployCommands, featureManager });
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
            await handleButtonInteraction(interaction);
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
            await handleSelectMenuInteraction(interaction);
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

// Button interaction handler
async function handleButtonInteraction(interaction) {
    const { customId } = interaction;
    
    if (customId === 'ping_again') {
        const sent = await interaction.reply({ content: 'Pinging again...', fetchReply: true });
        const ping = sent.createdTimestamp - interaction.createdTimestamp;
        await interaction.editReply(`Pong again! 🏓\nLatency: ${ping}ms\nAPI Latency: ${Math.round(interaction.client.ws.ping)}ms`);
    }
    else if (customId === 'roll_again') {
        const roll = Math.floor(Math.random() * 6) + 1;
        await interaction.reply({ content: `🎲 You rolled a **${roll}**!`, ephemeral: true });
    }
    else if (customId.startsWith('color_')) {
        const color = customId.split('_')[1];
        await interaction.reply({ content: `You selected the color: **${color}**!`, ephemeral: true });
    }
    else if (customId === 'delete_message') {
        await interaction.update({ content: '🗑️ Message deleted!', components: [] });
    }
    else if (customId.startsWith('user_info_')) {
        const userId = customId.split('_')[2];
        const user = await interaction.client.users.fetch(userId);
        const member = interaction.guild.members.cache.get(userId);
        
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setTitle(`👤 Your Profile`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🏷️ Username', value: user.tag, inline: true },
                { name: '🆔 User ID', value: user.id, inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}:F>`, inline: false }
            )
            .setColor(user.accentColor || 0x5865F2)
            .setTimestamp();
        
        if (member) {
            embed.addFields({
                name: '📥 Joined Server',
                value: `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>`,
                inline: false
            });
        }
        
        await interaction.reply({ embeds: [embed], ephemeral: true });    }
    else if (customId.startsWith('toggle_cmd_')) {
        // Check if user is bot owner
        if (interaction.user.id !== process.env.BOT_OWNER_ID) {
            await interaction.reply({ content: '❌ Only the bot owner can toggle features.', ephemeral: true });
            return;
        }
        
        const commandName = customId.replace('toggle_cmd_', '');
        const newState = featureManager.toggleCommand(commandName);
        
        if (newState !== null) {
            const status = newState ? '✅ Enabled' : '❌ Disabled';
            const emoji = newState ? '🟢' : '🔴';
            await interaction.reply({ 
                content: `${emoji} Command \`${commandName}\` is now **${status.split(' ')[1]}**`, 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ content: '❌ Command not found.', ephemeral: true });
        }
    }
    else if (customId.startsWith('toggle_feat_')) {
        // Check if user is bot owner
        if (interaction.user.id !== process.env.BOT_OWNER_ID) {
            await interaction.reply({ content: '❌ Only the bot owner can toggle features.', ephemeral: true });
            return;
        }
        
        const featureName = customId.replace('toggle_feat_', '');
        const newState = featureManager.toggleFeature(featureName);
        
        if (newState !== null) {
            const status = newState ? '✅ Enabled' : '❌ Disabled';
            const emoji = newState ? '🟢' : '🔴';
            await interaction.reply({ 
                content: `${emoji} Feature \`${featureName}\` is now **${status.split(' ')[1]}**`, 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ content: '❌ Feature not found.', ephemeral: true });
        }
    }
}

// Select menu interaction handler
async function handleSelectMenuInteraction(interaction) {
    const { customId, values } = interaction;
    
    if (customId === 'help_categories') {
        const category = values[0];
        let helpText = '';
        
        switch (category) {
            case 'general':
                helpText = '**General Commands:**\n• `/ping` - Check bot latency\n• `/user` - Get user information\n• `/server` - Get server information';
                break;
            case 'fun':
                helpText = '**Fun Commands:**\n• `/roll` - Roll dice\n• `/say` - Make the bot say something';
                break;
            case 'system':
                helpText = '**System Commands:**\n• `/rawr sys` - Bot administration (Owner only)';
                break;
            default:
                helpText = 'Unknown category selected.';
        }
        
        await interaction.reply({ content: helpText, ephemeral: true });
    }
    else if (customId === 'user_roles') {
        const selectedRoles = values.join(', ');
        await interaction.reply({ content: `You selected roles: **${selectedRoles}**`, ephemeral: true });
    }
    else if (customId === 'feature_management') {
        // Check if user is bot owner
        if (interaction.user.id !== process.env.BOT_OWNER_ID) {
            await interaction.reply({ content: '❌ Only the bot owner can manage features.', ephemeral: true });
            return;
        }
        
        const selectedType = values[0];
        await showFeatureToggles(interaction, selectedType);
    }
}

// Function to show feature toggles
async function showFeatureToggles(interaction, type) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    let embed, components = [];
    
    if (type === 'commands') {
        const commands = featureManager.getAllCommands();
        embed = new EmbedBuilder()
            .setTitle('🔧 Command Management')
            .setDescription('Click the buttons below to enable/disable commands:')
            .setColor(0x5865F2);
        
        // Create buttons for each command (max 5 per row)
        let currentRow = new ActionRowBuilder();
        let buttonCount = 0;
        
        for (const [cmdName, cmdData] of Object.entries(commands)) {
            if (buttonCount === 5) {
                components.push(currentRow);
                currentRow = new ActionRowBuilder();
                buttonCount = 0;
            }
            
            const button = new ButtonBuilder()
                .setCustomId(`toggle_cmd_${cmdName}`)
                .setLabel(cmdName)
                .setStyle(cmdData.enabled ? ButtonStyle.Success : ButtonStyle.Danger)
                .setEmoji(cmdData.enabled ? '✅' : '❌');
            
            currentRow.addComponents(button);
            buttonCount++;
            
            embed.addFields({
                name: `${cmdData.enabled ? '✅' : '❌'} /${cmdName}`,
                value: cmdData.description,
                inline: true
            });
        }
        
        if (buttonCount > 0) {
            components.push(currentRow);
        }
    }
    else if (type === 'features') {
        const features = featureManager.getAllFeatures();
        embed = new EmbedBuilder()
            .setTitle('⚙️ Feature Management')
            .setDescription('Click the buttons below to enable/disable features:')
            .setColor(0xFFD700);
        
        // Create buttons for each feature
        let currentRow = new ActionRowBuilder();
        let buttonCount = 0;
        
        for (const [featName, featData] of Object.entries(features)) {
            if (buttonCount === 5) {
                components.push(currentRow);
                currentRow = new ActionRowBuilder();
                buttonCount = 0;
            }
            
            const button = new ButtonBuilder()
                .setCustomId(`toggle_feat_${featName}`)
                .setLabel(featName.replace('_', ' '))
                .setStyle(featData.enabled ? ButtonStyle.Success : ButtonStyle.Danger)
                .setEmoji(featData.enabled ? '✅' : '❌');
            
            currentRow.addComponents(button);
            buttonCount++;
            
            embed.addFields({
                name: `${featData.enabled ? '✅' : '❌'} ${featName.replace('_', ' ')}`,
                value: featData.description,
                inline: true
            });
        }
        
        if (buttonCount > 0) {
            components.push(currentRow);
        }
    }
    
    await interaction.reply({
        embeds: [embed],
        components: components,
        ephemeral: true
    });
}

// Modal submission handler
async function handleModalSubmission(interaction) {
    const { customId } = interaction;
    
    if (customId === 'feedback_modal') {
        const title = interaction.fields.getTextInputValue('feedback_title');
        const description = interaction.fields.getTextInputValue('feedback_description');
        
        await interaction.reply({
            content: `**Feedback Received!**\n**Title:** ${title}\n**Description:** ${description}\n\nThank you for your feedback!`,
            ephemeral: true
        });
    }
    else if (customId === 'announcement_modal') {
        const title = interaction.fields.getTextInputValue('announcement_title');
        const content = interaction.fields.getTextInputValue('announcement_content');
        
        await interaction.reply({
            content: `**Announcement Created:**\n# ${title}\n${content}`,
            ephemeral: false
        });
    }
}

// Login to Discord with your bot token
// Make sure to create a .env file with your bot token
require('dotenv').config();
client.login(process.env.DISCORD_TOKEN);