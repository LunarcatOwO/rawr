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
    // Handle announcement-related buttons
    else if (customId === 'announce_create_new') {
        await showAnnouncementModal(interaction);
    }
    else if (customId === 'announce_templates') {
        await showAnnouncementTemplates(interaction);
    }
    else if (customId === 'announce_help') {
        await showAnnouncementHelp(interaction);
    }
    else if (customId.startsWith('announce_template_')) {
        const templateType = customId.replace('announce_template_', '');
        await useAnnouncementTemplate(interaction, templateType);
    }
    else if (customId === 'announce_cancel') {
        await interaction.update({
            content: '❌ **Announcement Cancelled**\nYour announcement has been discarded.',
            embeds: [],
            components: []
        });
    }
    else {
        await interaction.reply({ content: '❓ Unknown button interaction.', ephemeral: true });
    }
}

// Announcement helper functions
async function showAnnouncementModal(interaction) {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
    
    const modal = new ModalBuilder()
        .setCustomId('announcement_modal_advanced')
        .setTitle('📢 Create Announcement');
    
    const titleInput = new TextInputBuilder()
        .setCustomId('announcement_title')
        .setLabel('Announcement Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter a catchy title for your announcement')
        .setRequired(true)
        .setMaxLength(100);
    
    const contentInput = new TextInputBuilder()
        .setCustomId('announcement_content')
        .setLabel('Announcement Content')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Write your announcement content here...\n\nTip: You can use Discord markdown formatting!')
        .setRequired(true)
        .setMaxLength(2000);
    
    const footerInput = new TextInputBuilder()
        .setCustomId('announcement_footer')
        .setLabel('Footer Text (Optional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., "Thanks for reading!" or contact info')
        .setRequired(false)
        .setMaxLength(100);
    
    const titleRow = new ActionRowBuilder().addComponents(titleInput);
    const contentRow = new ActionRowBuilder().addComponents(contentInput);
    const footerRow = new ActionRowBuilder().addComponents(footerInput);
    
    modal.addComponents(titleRow, contentRow, footerRow);
    
    await interaction.showModal(modal);
}

async function showAnnouncementTemplates(interaction) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    const embed = new EmbedBuilder()
        .setTitle('📋 Announcement Templates')
        .setDescription('Choose from pre-made announcement templates to get started quickly.')
        .setColor(0x00D166)
        .addFields(
            { name: '📢 General Update', value: 'Perfect for server updates, rule changes, or general information', inline: true },
            { name: '🎉 Event Announcement', value: 'Ideal for upcoming events, contests, or celebrations', inline: true },
            { name: '⚠️ Important Notice', value: 'For urgent notifications, maintenance, or critical updates', inline: true },
            { name: '🎊 Welcome Message', value: 'Great for welcoming new members or introducing features', inline: true },
            { name: '📝 Custom Format', value: 'Start with a blank template and create your own style', inline: true }
        )
        .setTimestamp();

    const generalButton = new ButtonBuilder()
        .setCustomId('announce_template_general')
        .setLabel('General Update')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📢');

    const eventButton = new ButtonBuilder()
        .setCustomId('announce_template_event')
        .setLabel('Event Announcement')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎉');

    const noticeButton = new ButtonBuilder()
        .setCustomId('announce_template_notice')
        .setLabel('Important Notice')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⚠️');

    const welcomeButton = new ButtonBuilder()
        .setCustomId('announce_template_welcome')
        .setLabel('Welcome Message')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎊');

    const customButton = new ButtonBuilder()
        .setCustomId('announce_template_custom')
        .setLabel('Custom Format')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝');

    const actionRow = new ActionRowBuilder().addComponents(generalButton, eventButton, noticeButton, welcomeButton, customButton);

    await interaction.update({
        embeds: [embed],
        components: [actionRow]
    });
}

async function showAnnouncementHelp(interaction) {
    const { EmbedBuilder } = require('discord.js');
    
    const embed = new EmbedBuilder()
        .setTitle('❓ Announcement Help & Tips')
        .setDescription('Learn how to create effective announcements with our advanced features.')
        .setColor(0x5865F2)
        .addFields(
            { 
                name: '🎨 Formatting Tips', 
                value: '• Use **bold** for emphasis\n• Use *italics* for subtle text\n• Use `code blocks` for commands\n• Use > for quotes\n• Use ||spoilers|| for hidden text', 
                inline: false 
            },
            { 
                name: '📝 Writing Guidelines', 
                value: '• Keep titles short and descriptive\n• Use clear, concise language\n• Include call-to-action when needed\n• Add contact info in footer if relevant', 
                inline: false 
            },
            { 
                name: '⚡ Advanced Features', 
                value: '• Preview before sending\n• Choose specific channels\n• Add role mentions\n• Use templates for consistency\n• Schedule for later (coming soon)', 
                inline: false 
            },
            { 
                name: '🔒 Permissions', 
                value: 'You need **Manage Messages** permission to create announcements. The bot needs **Send Messages** permission in target channels.', 
                inline: false 
            }
        )
        .setTimestamp();

    await interaction.update({
        embeds: [embed],
        components: []
    });
}

async function useAnnouncementTemplate(interaction, templateType) {
    const templates = {
        general: {
            title: 'Server Update',
            content: '📢 **Important Server Update**\n\nHello everyone!\n\nWe have some exciting updates to share with you:\n\n• [Update 1]\n• [Update 2]\n• [Update 3]\n\nThese changes will take effect immediately. If you have any questions, feel free to reach out to our staff team.\n\nThank you for being part of our community!',
            footer: 'Server Administration Team'
        },
        event: {
            title: 'Upcoming Event',
            content: '🎉 **Special Event Announcement**\n\n📅 **When:** [Date and Time]\n📍 **Where:** [Location/Channel]\n🎯 **What:** [Event Description]\n\n**How to Participate:**\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\n**Prizes & Rewards:**\n🥇 First Place: [Prize]\n🥈 Second Place: [Prize]\n🥉 Third Place: [Prize]\n\nDon\'t miss out on this amazing opportunity!',
            footer: 'Event Team'
        },
        notice: {
            title: 'Important Notice',
            content: '⚠️ **IMPORTANT NOTICE**\n\n**Attention all members:**\n\n[Important information here]\n\n**What this means for you:**\n• [Point 1]\n• [Point 2]\n• [Point 3]\n\n**Action Required:**\n[What members need to do]\n\n**Timeline:**\n[When changes take effect]\n\nPlease read this carefully and contact staff if you have questions.',
            footer: 'Management Team'
        },
        welcome: {
            title: 'Welcome to Our Server!',
            content: '🎊 **Welcome to [Server Name]!**\n\nWe\'re thrilled to have you join our community!\n\n**Getting Started:**\n📋 Read our rules in <#rules-channel>\n🎭 Choose your roles in <#roles-channel>\n💬 Introduce yourself in <#introductions>\n\n**What We Offer:**\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\n**Need Help?**\nFeel free to ask questions in <#help-channel> or contact our friendly staff team.\n\nEnjoy your stay! 🌟',
            footer: 'Welcome Committee'
        },
        custom: {
            title: 'Custom Announcement',
            content: 'Create your own announcement content here!\n\nUse this template as a starting point and customize it to fit your needs.\n\n**Remember to:**\n• Keep it clear and concise\n• Use proper formatting\n• Include relevant information\n• Add a call-to-action if needed',
            footer: 'Your Footer Here'
        }
    };

    const template = templates[templateType] || templates.custom;
    
    // Store template data and show preview
    await showAnnouncementPreview(interaction, template);
}

async function showAnnouncementPreview(interaction, announcementData) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType } = require('discord.js');
    
    const embed = new EmbedBuilder()
        .setTitle(announcementData.title)
        .setDescription(announcementData.content)
        .setColor(0x5865F2)
        .setTimestamp();
    
    if (announcementData.footer) {
        embed.setFooter({ text: announcementData.footer });
    }

    // Get text channels for selection
    const channels = interaction.guild.channels.cache
        .filter(channel => channel.type === ChannelType.GuildText && channel.permissionsFor(interaction.client.user).has('SendMessages'))
        .first(10); // Limit to 10 channels for select menu

    const channelSelect = new StringSelectMenuBuilder()
        .setCustomId('announce_channel_select')
        .setPlaceholder('Select a channel to send the announcement...')
        .addOptions(
            Array.from(channels.values()).map(channel => ({
                label: `#${channel.name}`,
                description: `Send announcement to ${channel.name}`,
                value: channel.id
            }))
        );

    const editButton = new ButtonBuilder()
        .setCustomId('announce_create_new')
        .setLabel('Edit Announcement')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✏️');

    const cancelButton = new ButtonBuilder()
        .setCustomId('announce_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌');

    const channelRow = new ActionRowBuilder().addComponents(channelSelect);
    const buttonRow = new ActionRowBuilder().addComponents(editButton, cancelButton);

    const previewEmbed = new EmbedBuilder()
        .setTitle('📋 Announcement Preview')
        .setDescription('Review your announcement below, then select a channel to send it to.')
        .setColor(0x00D166);

    await interaction.update({
        content: '',
        embeds: [previewEmbed, embed],
        components: [channelRow, buttonRow]
    });
}

module.exports = { handleButtonInteraction };