/**
 * Button interaction handler
 * Handles all button click interactions from Discord components
 */

async function handleButtonInteraction(interaction, featureManager) {
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
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
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
    else if (customId.startsWith('user_refresh_')) {
        const userId = customId.split('_')[2];
        try {
            const user = await interaction.client.users.fetch(userId, { force: true });
            await interaction.reply({ 
                content: `🔄 **Profile Refreshed!**\nUpdated information for ${user.displayName || user.username}`, 
                ephemeral: true 
            });
        } catch (error) {
            await interaction.reply({ 
                content: '❌ Unable to refresh user profile.', 
                ephemeral: true 
            });
        }
    }
    else if (customId.startsWith('user_compare_')) {
        const userId = customId.split('_')[2];
        try {
            const user = await interaction.client.users.fetch(userId);
            const requestingUser = interaction.user;
            
            let response = `### 👥 **Profile Comparison**\n\n`;
            response += `**${requestingUser.displayName || requestingUser.username}** vs **${user.displayName || user.username}**\n\n`;
            response += `**Account Ages:**\n`;
            response += `• ${requestingUser.tag}: <t:${Math.floor(requestingUser.createdAt.getTime() / 1000)}:R>\n`;
            response += `• ${user.tag}: <t:${Math.floor(user.createdAt.getTime() / 1000)}:R>\n\n`;
            
            const olderUser = requestingUser.createdAt < user.createdAt ? requestingUser : user;
            response += `🏆 **Older Account:** ${olderUser.displayName || olderUser.username}`;
            
            await interaction.reply({ content: response, ephemeral: true });
        } catch (error) {
            await interaction.reply({ 
                content: '❌ Unable to compare profiles.', 
                ephemeral: true 
            });
        }
    }
    else if (customId === 'server_refresh') {
        await interaction.reply({ 
            content: '🔄 **Server Information Refreshed!**\nAll server data has been updated.', 
            ephemeral: true 
        });
    }
    else if (customId === 'server_invite') {
        try {
            const invite = await interaction.guild.invites.create(interaction.channel, {
                maxAge: 86400, // 24 hours
                maxUses: 1,
                reason: 'Created via bot dashboard'
            });
            await interaction.reply({ 
                content: `📨 **Invite Created!**\nHere's your temporary invite: ${invite.url}\n\n*Expires in 24 hours, single use*`, 
                ephemeral: true 
            });
        } catch (error) {
            await interaction.reply({ 
                content: '❌ Unable to create invite. Missing permissions.', 
                ephemeral: true 
            });
        }
    }
    else if (customId === 'server_audit') {
        try {
            const auditLogs = await interaction.guild.fetchAuditLogs({ limit: 5 });
            let response = `### 📋 **Recent Audit Log Entries**\n\n`;
            
            auditLogs.entries.forEach((entry, index) => {
                const action = entry.action;
                const executor = entry.executor;
                const target = entry.target;
                response += `**${index + 1}.** ${executor.tag} - ${action}\n`;
                if (target) response += `   Target: ${target.tag || target.name || 'Unknown'}\n`;
                response += `   <t:${Math.floor(entry.createdAt.getTime() / 1000)}:R>\n\n`;
            });
            
            await interaction.reply({ content: response, ephemeral: true });
        } catch (error) {
            await interaction.reply({ 
                content: '❌ Unable to fetch audit logs. Missing permissions.', 
                ephemeral: true 
            });
        }
    }
    else {
        await interaction.reply({ content: '❓ Unknown button interaction.', ephemeral: true });
    }
}

module.exports = { handleButtonInteraction };
