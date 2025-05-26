const { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Create an announcement using a modal form')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('announcement_modal')
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
    },
};
