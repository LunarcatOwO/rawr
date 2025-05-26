const { 
    SlashCommandBuilder, 
    EmbedBuilder,
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Create an announcement with advanced options')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction) {
        // Check if component UI is enabled
        const useComponentUI = true; // Always use components v2 for this command
        
        if (useComponentUI) {
            await showAnnouncementDashboard(interaction);
        } else {
            // Fallback to simple modal
            await showSimpleModal(interaction);
        }
    },
};

async function showAnnouncementDashboard(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('📢 Announcement Creator')
        .setDescription('Create professional announcements with advanced formatting and delivery options.')
        .setColor(0x5865F2)
        .addFields(
            { name: '🎯 Features', value: '• Interactive announcement builder\n• Channel selection\n• Role mentions\n• Preview before sending\n• Custom formatting options', inline: true },
            { name: '⚡ Quick Start', value: 'Click **"Create New"** to begin building your announcement, or use **"Templates"** for pre-made formats.', inline: true }
        )
        .setTimestamp();

    const createButton = new ButtonBuilder()
        .setCustomId('announce_create_new')
        .setLabel('Create New Announcement')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝');

    const templateButton = new ButtonBuilder()
        .setCustomId('announce_templates')
        .setLabel('Use Template')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📋');

    const helpButton = new ButtonBuilder()
        .setCustomId('announce_help')
        .setLabel('Help & Tips')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❓');

    const actionRow = new ActionRowBuilder().addComponents(createButton, templateButton, helpButton);

    await interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true
    });
}

async function showSimpleModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('announcement_modal_simple')
        .setTitle('Create Announcement');
    
    const titleInput = new TextInputBuilder()
        .setCustomId('announcement_title')
        .setLabel('Announcement Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter the announcement title')
        .setRequired(true)
        .setMaxLength(100);
    
    const contentInput = new TextInputBuilder()
        .setCustomId('announcement_content')
        .setLabel('Announcement Content')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter the announcement content...')
        .setRequired(true)
        .setMaxLength(2000);
    
    const titleRow = new ActionRowBuilder().addComponents(titleInput);
    const contentRow = new ActionRowBuilder().addComponents(contentInput);
    
    modal.addComponents(titleRow, contentRow);
    
    await interaction.showModal(modal);
}
