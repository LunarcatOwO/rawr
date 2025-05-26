const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get interactive information about various topics'),
    async execute(interaction) {
        // Create an interactive info menu using components instead of static embeds
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('info_topics')
            .setPlaceholder('🔍 Choose what you want to learn about...')
            .addOptions([
                {
                    label: 'Bot Information',
                    description: 'Learn about this Discord bot',
                    value: 'bot',
                    emoji: '🤖'
                },
                {
                    label: 'Commands Info',
                    description: 'Discover available commands',
                    value: 'commands',
                    emoji: '📋'
                },
                {
                    label: 'Features Overview',
                    description: 'Explore bot features',
                    value: 'features',
                    emoji: '⚙️'
                },
                {
                    label: 'Server Statistics',
                    description: 'View server information',
                    value: 'server',
                    emoji: '🏠'
                }
            ]);

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('info_refresh')
                    .setLabel('Refresh Info')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setCustomId('info_help')
                    .setLabel('Quick Help')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❓'),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/example')
                    .setEmoji('💬')
            );

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.reply({
            content: '### 📚 **Information Hub**\nSelect a topic below to get detailed information, or use the action buttons for quick access!',
            components: [selectRow, actionButtons]
        });
    },
};
