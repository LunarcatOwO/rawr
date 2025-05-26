const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Interactive user information dashboard')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The user ID to get information about (no auto-fill)')
                .setRequired(false)),
    async execute(interaction) {
        const userIdInput = interaction.options.getString('userid');
        let user;
        
        if (userIdInput) {
            // Try to fetch the user by ID
            try {
                user = await interaction.client.users.fetch(userIdInput);
            } catch (error) {
                await interaction.reply({
                    content: `❌ **Invalid User ID**\n\`${userIdInput}\` is not a valid user ID or the user doesn't exist.\n\n**How to get a User ID:**\n1. Enable Developer Mode in Discord Settings\n2. Right-click on a user\n3. Select "Copy User ID"`,
                    ephemeral: true
                });
                return;
            }
        } else {
            // Use the command invoker if no ID provided
            user = interaction.user;
        }
        const member = interaction.guild.members.cache.get(user.id);
        
        // Create interactive user info using components instead of embeds
        const userActions = new StringSelectMenuBuilder()
            .setCustomId(`user_menu_${user.id}`)
            .setPlaceholder('👤 Select user information to view...')
            .addOptions([
                {
                    label: 'Basic Profile',
                    description: 'Username, ID, creation date',
                    value: 'basic',
                    emoji: '📝'
                },
                {
                    label: 'Server Info',
                    description: 'Join date, roles, nickname',
                    value: 'server',
                    emoji: '🏠'
                },
                {
                    label: 'Avatar & Media',
                    description: 'Profile pictures and banners',
                    value: 'media',
                    emoji: '🖼️'
                },
                {
                    label: 'Activity Status',
                    description: 'Current status and presence',
                    value: 'activity',
                    emoji: '🎮'
                }
            ]);

        const quickActions = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('View Avatar')
                    .setStyle(ButtonStyle.Link)
                    .setURL(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setEmoji('🖼️'),
                new ButtonBuilder()
                    .setCustomId(`user_refresh_${user.id}`)
                    .setLabel('Refresh')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setCustomId(`user_compare_${user.id}`)
                    .setLabel('Compare')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⚖️')
                    .setDisabled(user.id === interaction.user.id)
            );

        // Add "View My Profile" button if looking at someone else
        if (user.id !== interaction.user.id) {
            quickActions.addComponents(
                new ButtonBuilder()
                    .setCustomId(`user_menu_${interaction.user.id}`)
                    .setLabel('My Profile')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👤')
            );
        }

        const selectRow = new ActionRowBuilder().addComponents(userActions);
        
        // Create user overview using formatted text instead of embeds
        const accountCreated = user.createdAt;
        const joinedAt = member?.joinedAt;
        
        let userOverview = `## 👤 **${user.displayName || user.username}**\n`;
        userOverview += `**Username:** ${user.tag}\n`;
        userOverview += `**User ID:** \`${user.id}\`\n`;
        userOverview += `**Account Created:** <t:${Math.floor(accountCreated.getTime() / 1000)}:F>\n`;
        
        if (joinedAt) {
            userOverview += `**Joined Server:** <t:${Math.floor(joinedAt.getTime() / 1000)}:F>\n`;
        }
        
        if (member && member.roles.cache.size > 1) {
            const topRoles = member.roles.cache
                .filter(role => role.name !== '@everyone')
                .sort((a, b) => b.position - a.position)
                .first(3)
                .map(role => role.toString())
                .join(', ');
            userOverview += `**Top Roles:** ${topRoles}\n`;
        }
        
        userOverview += `\n*Use the menu below to explore detailed information!*`;
        
        await interaction.reply({
            content: userOverview,
            components: [selectRow, quickActions]
        });
    },
};
