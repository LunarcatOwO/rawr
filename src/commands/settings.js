const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Server settings management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable a command for this server')
                .addStringOption(option =>
                    option.setName('command')
                        .setDescription('Command to disable')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enable a command for this server')
                .addStringOption(option =>
                    option.setName('command')
                        .setDescription('Command to enable')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all command settings for this server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('manager')
                .setDescription('Manage who can change server settings')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'add', value: 'add' },
                            { name: 'remove', value: 'remove' },
                            { name: 'list', value: 'list' }
                        ))
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add/remove as settings manager')
                        .setRequired(false))),

    async execute(interaction, { serverSettingsManager, featureManager }) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        
        // Check if user can manage settings
        if (!serverSettingsManager.canManageSettings(guildId, userId, interaction.guild)) {
            await interaction.reply({
                content: '❌ **Access Denied**\nOnly the server owner or designated settings managers can use this command.',
                ephemeral: true
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'disable':
                await handleDisableCommand(interaction, serverSettingsManager, featureManager);
                break;
            case 'enable':
                await handleEnableCommand(interaction, serverSettingsManager, featureManager);
                break;
            case 'list':
                await handleListCommands(interaction, serverSettingsManager, featureManager);
                break;
            case 'manager':
                await handleManagerCommand(interaction, serverSettingsManager);
                break;
        }
    }
};

async function handleDisableCommand(interaction, serverSettingsManager, featureManager) {
    const guildId = interaction.guild.id;
    const commandName = interaction.options.getString('command');

    // Check if command exists and is enabled by system admin
    const availableCommands = serverSettingsManager.getAvailableCommands(featureManager);
    
    if (!availableCommands[commandName]) {
        await interaction.reply({
            content: `❌ Command \`${commandName}\` doesn't exist or is disabled by the system administrator.`,
            ephemeral: true
        });
        return;
    }

    // Prevent disabling the settings command itself
    if (commandName === 'settings') {
        await interaction.reply({
            content: '❌ You cannot disable the settings command.',
            ephemeral: true
        });
        return;
    }

    // Check if command is already disabled
    if (serverSettingsManager.isCommandDisabled(guildId, commandName)) {
        await interaction.reply({
            content: `⚠️ Command \`${commandName}\` is already disabled on this server.`,
            ephemeral: true
        });
        return;
    }

    // Disable the command
    if (serverSettingsManager.disableCommand(guildId, commandName)) {
        await interaction.reply({
            content: `✅ Command \`${commandName}\` has been disabled for this server.`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: `❌ Failed to disable command \`${commandName}\`.`,
            ephemeral: true
        });
    }
}

async function handleEnableCommand(interaction, serverSettingsManager, featureManager) {
    const guildId = interaction.guild.id;
    const commandName = interaction.options.getString('command');

    // Check if command exists and is enabled by system admin
    const availableCommands = serverSettingsManager.getAvailableCommands(featureManager);
    
    if (!availableCommands[commandName]) {
        await interaction.reply({
            content: `❌ Command \`${commandName}\` doesn't exist or is disabled by the system administrator.`,
            ephemeral: true
        });
        return;
    }

    // Check if command is already enabled
    if (!serverSettingsManager.isCommandDisabled(guildId, commandName)) {
        await interaction.reply({
            content: `⚠️ Command \`${commandName}\` is already enabled on this server.`,
            ephemeral: true
        });
        return;
    }

    // Enable the command
    if (serverSettingsManager.enableCommand(guildId, commandName)) {
        await interaction.reply({
            content: `✅ Command \`${commandName}\` has been enabled for this server.`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: `❌ Failed to enable command \`${commandName}\`.`,
            ephemeral: true
        });
    }
}

async function handleListCommands(interaction, serverSettingsManager, featureManager) {
    const guildId = interaction.guild.id;
    const availableCommands = serverSettingsManager.getAvailableCommands(featureManager);
    const disabledCommands = serverSettingsManager.getDisabledCommands(guildId);

    const embed = new EmbedBuilder()
        .setTitle('📋 Server Command Settings')
        .setDescription(`Server: **${interaction.guild.name}**`)
        .setColor(0x5865F2)
        .setTimestamp();

    let enabledList = [];
    let disabledList = [];

    for (const [commandName, commandData] of Object.entries(availableCommands)) {
        if (commandName === 'settings') continue; // Skip settings command in the list
        
        if (disabledCommands.includes(commandName)) {
            disabledList.push(`\`${commandName}\` - ${commandData.description}`);
        } else {
            enabledList.push(`\`${commandName}\` - ${commandData.description}`);
        }
    }

    if (enabledList.length > 0) {
        embed.addFields({
            name: '✅ Enabled Commands',
            value: enabledList.join('\n'),
            inline: false
        });
    } else {
        embed.addFields({
            name: '✅ Enabled Commands',
            value: 'No commands are enabled.',
            inline: false
        });
    }

    if (disabledList.length > 0) {
        embed.addFields({
            name: '❌ Disabled Commands',
            value: disabledList.join('\n'),
            inline: false
        });
    } else {
        embed.addFields({
            name: '❌ Disabled Commands',
            value: 'No commands are disabled.',
            inline: false
        });
    }

    // Create action row with select menu for quick toggle
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('settings_toggle_command')
        .setPlaceholder('Quick toggle a command...')
        .setMaxValues(1);

    // Add enabled commands that can be disabled
    for (const [commandName, commandData] of Object.entries(availableCommands)) {
        if (commandName === 'settings') continue;
        
        const isDisabled = disabledCommands.includes(commandName);
        const status = isDisabled ? '❌ Disabled' : '✅ Enabled';
        
        selectMenu.addOptions({
            label: `${commandName}`,
            description: `${status} - ${commandData.description}`,
            value: `toggle_${commandName}`,
            emoji: isDisabled ? '✅' : '❌'
        });
    }

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true
    });
}

async function handleManagerCommand(interaction, serverSettingsManager) {
    const guildId = interaction.guild.id;
    const action = interaction.options.getString('action');
    const targetUser = interaction.options.getUser('user');

    // Only server owner can manage settings managers
    if (interaction.guild.ownerId !== interaction.user.id) {
        await interaction.reply({
            content: '❌ Only the server owner can manage settings managers.',
            ephemeral: true
        });
        return;
    }

    switch (action) {
        case 'add':
            if (!targetUser) {
                await interaction.reply({
                    content: '❌ Please specify a user to add as a settings manager.',
                    ephemeral: true
                });
                return;
            }

            if (targetUser.id === interaction.guild.ownerId) {
                await interaction.reply({
                    content: '❌ The server owner is already a settings manager by default.',
                    ephemeral: true
                });
                return;
            }

            if (serverSettingsManager.addSettingsManager(guildId, targetUser.id)) {
                await interaction.reply({
                    content: `✅ <@${targetUser.id}> has been added as a settings manager.`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: `⚠️ <@${targetUser.id}> is already a settings manager.`,
                    ephemeral: true
                });
            }
            break;

        case 'remove':
            if (!targetUser) {
                await interaction.reply({
                    content: '❌ Please specify a user to remove from settings managers.',
                    ephemeral: true
                });
                return;
            }

            if (targetUser.id === interaction.guild.ownerId) {
                await interaction.reply({
                    content: '❌ You cannot remove the server owner as a settings manager.',
                    ephemeral: true
                });
                return;
            }

            if (serverSettingsManager.removeSettingsManager(guildId, targetUser.id)) {
                await interaction.reply({
                    content: `✅ <@${targetUser.id}> has been removed as a settings manager.`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: `⚠️ <@${targetUser.id}> is not a settings manager.`,
                    ephemeral: true
                });
            }
            break;

        case 'list':
            const managers = serverSettingsManager.getSettingsManagers(guildId);
            const embed = new EmbedBuilder()
                .setTitle('👥 Settings Managers')
                .setDescription(`Server: **${interaction.guild.name}**`)
                .setColor(0x5865F2)
                .setTimestamp();

            let managersList = [`<@${interaction.guild.ownerId}> (Server Owner)`];
            
            if (managers.length > 0) {
                managersList.push(...managers.map(userId => `<@${userId}>`));
            }

            embed.addFields({
                name: 'Users who can manage server settings:',
                value: managersList.join('\n'),
                inline: false
            });

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
            break;
    }
}
