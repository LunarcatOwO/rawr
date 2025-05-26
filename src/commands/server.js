const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Interactive server information dashboard'),
    async execute(interaction) {
        const guild = interaction.guild;
        
        // Create interactive server info using components
        const serverActions = new StringSelectMenuBuilder()
            .setCustomId('server_info_menu')
            .setPlaceholder('🏠 Select server information to view...')
            .addOptions([
                {
                    label: 'Basic Info',
                    description: 'Name, ID, creation date',
                    value: 'basic',
                    emoji: '📝'
                },
                {
                    label: 'Member Stats',
                    description: 'Member count and roles',
                    value: 'members',
                    emoji: '👥'
                },
                {
                    label: 'Boost Status',
                    description: 'Boost level and perks',
                    value: 'boosts',
                    emoji: '💎'
                },
                {
                    label: 'Channels',
                    description: 'Channel categories and count',
                    value: 'channels',
                    emoji: '📁'
                }
            ]);

        const quickActions = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('server_icon')
                    .setLabel('View Icon')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🖼️')
                    .setDisabled(!guild.iconURL()),
                new ButtonBuilder()
                    .setCustomId('server_banner')
                    .setLabel('View Banner')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎨')
                    .setDisabled(!guild.bannerURL()),
                new ButtonBuilder()
                    .setCustomId('server_refresh')
                    .setLabel('Refresh')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔄')
            );

        const selectRow = new ActionRowBuilder().addComponents(serverActions);
        
        // Initial server overview using plain text formatting
        let serverOverview = `## 🏠 **${guild.name}**\n`;
        serverOverview += `**Server ID:** \`${guild.id}\`\n`;
        serverOverview += `**Owner:** <@${guild.ownerId}>\n`;
        serverOverview += `**Members:** **${guild.memberCount}** total\n`;
        serverOverview += `**Created:** <t:${Math.floor(guild.createdAt.getTime() / 1000)}:F>\n`;
        serverOverview += `**Boost Level:** ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)\n\n`;
        serverOverview += `*Use the menu below to explore detailed information!*`;
        
        await interaction.reply({
            content: serverOverview,
            components: [selectRow, quickActions]
        });
    },
};
