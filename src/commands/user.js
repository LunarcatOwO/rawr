const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Provides information about the user.')
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
        
        const joinedAt = member ? member.joinedAt : null;
        const accountCreated = user.createdAt;
        
        const embed = new EmbedBuilder()
            .setTitle(`👤 User Information`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🏷️ Username', value: user.tag, inline: true },
                { name: '🆔 User ID', value: user.id, inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(accountCreated.getTime() / 1000)}:F>`, inline: false }
            )
            .setColor(user.accentColor || 0x5865F2)
            .setTimestamp();
        
        if (joinedAt) {
            embed.addFields({
                name: '📥 Joined Server',
                value: `<t:${Math.floor(joinedAt.getTime() / 1000)}:F>`,
                inline: false
            });
        }
        
        if (member && member.roles.cache.size > 1) {
            const roles = member.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.toString())
                .slice(0, 10)
                .join(', ');
            
            embed.addFields({
                name: '🎭 Roles',
                value: roles || 'No roles',
                inline: false
            });
        }
        
        // Add action buttons
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('View Avatar')
                    .setStyle(ButtonStyle.Link)
                    .setURL(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setEmoji('🖼️')
            );
        
        // Add a button to view their own profile if looking at someone else
        if (user.id !== interaction.user.id) {
            buttons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`user_info_${interaction.user.id}`)
                    .setLabel('View My Profile')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👤')
            );
        }
        
        await interaction.reply({
            embeds: [embed],
            components: [buttons]
        });
    },
};
