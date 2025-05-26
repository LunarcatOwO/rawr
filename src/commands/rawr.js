const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Load environment variables
require('dotenv').config();

// Bot owner user ID - replace with your Discord user ID
const BOT_OWNER_ID = process.env.BOT_OWNER_ID;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rawr')
        .setDescription('Bot system commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('sys')
                .setDescription('System administration commands')
                .addStringOption(option =>
                    option.setName('option')
                        .setDescription('System option to execute')
                        .setRequired(true)                        .addChoices(
                            { name: 'reload commands', value: 'reload_commands' },
                            { name: 'bot info', value: 'bot_info' },
                            { name: 'status', value: 'status' },
                            { name: 'enable/disable features', value: 'feature_management' }
                        )))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),    async execute(interaction, { loadCommands, deployCommands, featureManager, serverSettingsManager }) {
        // Debug logging
        console.log(`User ID: ${interaction.user.id}`);
        console.log(`Bot Owner ID: ${BOT_OWNER_ID}`);
        console.log(`Comparison result: ${interaction.user.id === BOT_OWNER_ID}`);
        
        // Check if the user is the bot owner
        if (interaction.user.id !== BOT_OWNER_ID) {
            await interaction.reply({
                content: `❌ **Access Denied**\nOnly the bot owner can use this command.\n\nYour ID: \`${interaction.user.id}\`\nOwner ID: \`${BOT_OWNER_ID}\`\n\nMake sure BOT_OWNER_ID is set correctly in your .env file.`,
                ephemeral: true
            });
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'sys') {
            const option = interaction.options.getString('option');
            
            switch (option) {
                case 'reload_commands':
                    await interaction.deferReply({ ephemeral: true });
                      try {
                        // Reload commands locally
                        loadCommands(interaction.client, featureManager);
                        
                        // Deploy commands to Discord
                        const deployResult = await deployCommands();
                          if (deployResult.success) {
                            await interaction.editReply({
                                content: `✅ **Commands Reloaded Successfully!**\n` +
                                        `📝 Loaded ${interaction.client.commands.size} commands locally\n` +
                                        `🔄 Deployed ${deployResult.count} commands to Discord globally\n` +
                                        `⏰ Commands will be available within 1 hour globally`
                            });
                        } else {
                            await interaction.editReply({
                                content: `⚠️ **Partial Success**\n` +
                                        `📝 Loaded ${interaction.client.commands.size} commands locally\n` +
                                        `❌ Failed to deploy to Discord: ${deployResult.error}`
                            });
                        }
                    } catch (error) {
                        console.error('Error reloading commands:', error);
                        await interaction.editReply({
                            content: `❌ **Failed to reload commands**\n\`\`\`${error.message}\`\`\``
                        });
                    }
                    break;                case 'bot_info':
                    const client = interaction.client;
                    const uptime = process.uptime();
                    const uptimeString = formatUptime(uptime);
                    const featureStatus = featureManager.getStatus();
                    
                    await interaction.reply({
                        content: `🤖 **Bot Information**\n` +
                                `**Name:** ${client.user.tag}\n` +
                                `**ID:** ${client.user.id}\n` +
                                `**Uptime:** ${uptimeString}\n` +
                                `**Servers:** ${client.guilds.cache.size}\n` +
                                `**Commands:** ${client.commands.size} (${featureStatus.commands.enabled}/${featureStatus.commands.total} enabled)\n` +
                                `**Features:** ${featureStatus.features.enabled}/${featureStatus.features.total} enabled\n` +
                                `**Node.js:** ${process.version}\n` +
                                `**Discord.js:** ${require('discord.js').version}\n` +
                                `**Memory Usage:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n` +
                                `**Deployment:** Global (updates within 1 hour)`,
                        ephemeral: true
                    });
                    break;
                    
                case 'status':
                    const ping = Math.round(interaction.client.ws.ping);
                    const status = ping < 100 ? '🟢 Excellent' : ping < 200 ? '🟡 Good' : '🔴 Poor';
                    
                    await interaction.reply({
                        content: `📊 **Bot Status**\n` +
                                `**Connection:** ${status}\n` +
                                `**API Latency:** ${ping}ms\n` +
                                `**Status:** ${interaction.client.user.presence?.status || 'online'}\n` +
                                `**Ready:** ${interaction.client.isReady() ? 'Yes' : 'No'}`,
                        ephemeral: true                    });
                    break;
                      case 'feature_management':
                    const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
                    const useEmbeds = featureManager.isFeatureEnabled('rich_embeds');
                    
                    if (useEmbeds) {
                        const featureEmbed = new EmbedBuilder()
                            .setTitle('🔧 Feature Management System')
                            .setDescription('Select what you want to manage:')
                            .addFields(
                                { name: '🔘 Commands', value: 'Enable/disable individual bot commands', inline: true },
                                { name: '⚙️ Features', value: 'Enable/disable bot features and functionality', inline: true },
                                { name: '📊 Current Status', value: `Commands: ${featureManager.getStatus().commands.enabled}/${featureManager.getStatus().commands.total} enabled\nFeatures: ${featureManager.getStatus().features.enabled}/${featureManager.getStatus().features.total} enabled`, inline: false }
                            )
                            .setColor(0x9932CC)
                            .setTimestamp();
                        
                        const featureSelect = new StringSelectMenuBuilder()
                            .setCustomId('feature_management')
                            .setPlaceholder('Choose what to manage...')
                            .addOptions([
                                {
                                    label: 'Manage Commands',
                                    description: 'Enable/disable individual bot commands',
                                    value: 'commands',
                                    emoji: '🔘'
                                },
                                {
                                    label: 'Manage Features',
                                    description: 'Enable/disable bot features and functionality',
                                    value: 'features',
                                    emoji: '⚙️'
                                }
                            ]);
                        
                        const featureRow = new ActionRowBuilder().addComponents(featureSelect);
                        
                        await interaction.reply({
                            embeds: [featureEmbed],
                            components: [featureRow],
                            ephemeral: true
                        });
                    } else {
                        const status = featureManager.getStatus();
                        let content = `### 🔧 **Feature Management System**\n`;
                        content += `Manage bot commands and features through the interactive dashboard.\n\n`;
                        content += `**Management Options:**\n`;
                        content += `🔘 **Commands** - Enable/disable individual bot commands\n`;
                        content += `⚙️ **Features** - Enable/disable bot features and functionality\n\n`;
                        content += `**Current Status:**\n`;
                        content += `📊 **Commands:** ${status.commands.enabled}/${status.commands.total} enabled\n`;
                        content += `📊 **Features:** ${status.features.enabled}/${status.features.total} enabled\n\n`;
                        content += `*Select what you want to manage from the dropdown below:*`;
                        
                        const featureSelect = new StringSelectMenuBuilder()
                            .setCustomId('feature_management')
                            .setPlaceholder('Choose what to manage...')
                            .addOptions([
                                {
                                    label: 'Manage Commands',
                                    description: 'Enable/disable individual bot commands',
                                    value: 'commands',
                                    emoji: '🔘'
                                },
                                {
                                    label: 'Manage Features',
                                    description: 'Enable/disable bot features and functionality',
                                    value: 'features',
                                    emoji: '⚙️'
                                }
                            ]);
                        
                        const featureRow = new ActionRowBuilder().addComponents(featureSelect);
                        
                        await interaction.reply({
                            content: content,
                            components: [featureRow],
                            ephemeral: true
                        });
                    }
                    break;
                    
                default:
                    await interaction.reply({
                        content: '❌ Unknown system option.',
                        ephemeral: true
                    });
            }
        }
    },
};

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let result = [];
    if (days > 0) result.push(`${days}d`);
    if (hours > 0) result.push(`${hours}h`);
    if (minutes > 0) result.push(`${minutes}m`);
    if (secs > 0) result.push(`${secs}s`);
    
    return result.length > 0 ? result.join(' ') : '0s';
}
