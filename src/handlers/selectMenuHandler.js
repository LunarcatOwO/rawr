/**
 * Select menu interaction handler
 * Handles all select menu interactions from Discord components
 */

async function handleSelectMenuInteraction(interaction) {
    const { customId, values } = interaction;
    
    if (customId === 'help_categories') {
        const category = values[0];
        let helpText = '';
        
        switch (category) {
            case 'general':
                helpText = '**General Commands:**\n• `/ping` - Check bot latency\n• `/user` - Get user information\n• `/server` - Get server information';
                break;
            case 'fun':
                helpText = '**Fun Commands:**\n• `/roll` - Roll dice\n• `/say` - Make the bot say something';
                break;
            case 'system':
                helpText = '**System Commands:**\n• `/rawr sys` - Bot administration (Owner only)';
                break;
            default:
                helpText = 'Unknown category selected.';
        }
        
        await interaction.reply({ content: helpText, ephemeral: true });
    }
    else if (customId === 'user_roles') {
        const selectedRoles = values.join(', ');
        await interaction.reply({ content: `You selected roles: **${selectedRoles}**`, ephemeral: true });
    }
    else if (customId === 'feature_management') {
        // Check if user is bot owner
        if (interaction.user.id !== process.env.BOT_OWNER_ID) {
            await interaction.reply({ content: '❌ Only the bot owner can manage features.', ephemeral: true });
            return;
        }
        
        const selectedType = values[0];
        const { showFeatureToggles } = require('../utils/featureUtils');
        await showFeatureToggles(interaction, selectedType);
    }
    // Handle new component-based interactions
    else if (customId.startsWith('user_menu_')) {
        const userId = customId.split('_')[2];
        const user = await interaction.client.users.fetch(userId);
        const member = interaction.guild.members.cache.get(userId);
        const selectedOption = interaction.values[0];
        
        let response = '';
        
        switch (selectedOption) {
            case 'basic':
                response = `### 📝 **Basic Profile - ${user.displayName || user.username}**\n`;
                response += `**Username:** ${user.tag}\n`;
                response += `**User ID:** \`${user.id}\`\n`;
                response += `**Account Created:** <t:${Math.floor(user.createdAt.getTime() / 1000)}:R>\n`;
                response += `**Bot Account:** ${user.bot ? 'Yes' : 'No'}\n`;
                if (user.accentColor) {
                    response += `**Accent Color:** #${user.accentColor.toString(16).padStart(6, '0')}\n`;
                }
                break;
            case 'server':
                if (member) {
                    response = `### 🏠 **Server Information - ${user.displayName || user.username}**\n`;
                    response += `**Joined Server:** <t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>\n`;
                    if (member.nickname) response += `**Nickname:** ${member.nickname}\n`;
                    response += `**Highest Role:** ${member.roles.highest.name}\n`;
                    response += `**Role Count:** ${member.roles.cache.size - 1}\n`;
                    if (member.premiumSince) {
                        response += `**Boosting Since:** <t:${Math.floor(member.premiumSince.getTime() / 1000)}:R>\n`;
                    }
                } else {
                    response = `### 🏠 **Server Information**\n❌ User is not a member of this server.`;
                }
                break;
            case 'media':
                response = `### 🖼️ **Avatar & Media - ${user.displayName || user.username}**\n`;
                response += `**Avatar URL:** [Click here](${user.displayAvatarURL({ dynamic: true, size: 1024 })})\n`;
                if (user.bannerURL()) {
                    response += `**Banner URL:** [Click here](${user.bannerURL({ dynamic: true, size: 1024 })})\n`;
                }
                response += `**Default Avatar:** ${user.defaultAvatarURL}\n`;
                break;
            case 'activity':
                response = `### 🎮 **Activity Status - ${user.displayName || user.username}**\n`;
                if (member && member.presence) {
                    response += `**Status:** ${member.presence.status}\n`;
                    if (member.presence.activities.length > 0) {
                        response += `**Activities:**\n`;
                        member.presence.activities.forEach(activity => {
                            response += `• ${activity.name} (${activity.type})\n`;
                        });
                    }
                } else {
                    response += `❌ No activity information available.`;
                }
                break;
        }
        
        await interaction.reply({ content: response, ephemeral: true });
    }
    else if (customId === 'info_topics') {
        const selectedTopic = interaction.values[0];
        let response = '';
        
        switch (selectedTopic) {
            case 'bot':
                response = `### 🤖 **Bot Information**\n`;
                response += `This is a Discord bot with automatic feature management and component-based interactions!\n\n`;
                response += `**Features:**\n`;
                response += `• 🔄 Auto-Registration: New commands are automatically added to the feature system\n`;
                response += `• ⚙️ Feature Management: Commands and features can be enabled/disabled\n`;
                response += `• 🎛️ Component UI: Interactive buttons and menus instead of static embeds\n`;
                response += `• 📊 Real-time Updates: Dynamic content updates through interactions\n`;
                break;
            case 'commands':
                response = `### 📋 **Commands Information**\n`;
                response += `All commands are automatically registered and managed by the feature system.\n\n`;
                response += `**Available Commands:**\n`;
                response += `• \`/info\` - Interactive information hub\n`;
                response += `• \`/user\` - User profile dashboard\n`;
                response += `• \`/server\` - Server information panel\n`;
                response += `• \`/components\` - Component showcase\n`;
                response += `• \`/rawr sys\` - System management\n`;
                response += `\n**Management:** Use \`/rawr sys\` to manage commands and features.`;
                break;
            case 'features':
                response = `### ⚙️ **Features Overview**\n`;
                response += `The bot uses modern Discord components for better user experience.\n\n`;
                response += `**Core Features:**\n`;
                response += `• 🔘 Interactive Buttons: Primary, secondary, success, danger, and link buttons\n`;
                response += `• 📋 Select Menus: Dropdown menus for navigation and options\n`;
                response += `• 📝 Modal Forms: Form submissions and data collection\n`;
                response += `• 🎛️ Component Rows: Organized UI layouts\n`;
                response += `• 🔄 Real-time Updates: Dynamic content without page refreshes\n`;
                break;
            case 'server':
                const guild = interaction.guild;
                response = `### 🏠 **Server Statistics**\n`;
                response += `**Name:** ${guild.name}\n`;
                response += `**Members:** ${guild.memberCount}\n`;
                response += `**Channels:** ${guild.channels.cache.size}\n`;
                response += `**Roles:** ${guild.roles.cache.size}\n`;
                response += `**Boost Level:** ${guild.premiumTier}\n`;
                response += `**Created:** <t:${Math.floor(guild.createdAt.getTime() / 1000)}:R>\n`;
                break;
        }
        
        await interaction.reply({ content: response, ephemeral: true });
    }
    else if (customId === 'server_info_menu') {
        const selectedOption = interaction.values[0];
        const guild = interaction.guild;
        let response = '';
        
        switch (selectedOption) {
            case 'basic':
                response = `### 📝 **Basic Server Information**\n`;
                response += `**Name:** ${guild.name}\n`;
                response += `**Server ID:** \`${guild.id}\`\n`;
                response += `**Owner:** <@${guild.ownerId}>\n`;
                response += `**Created:** <t:${Math.floor(guild.createdAt.getTime() / 1000)}:F>\n`;
                response += `**Region:** ${guild.preferredLocale || 'Not specified'}\n`;
                break;
            case 'members':
                response = `### 👥 **Member Statistics**\n`;
                response += `**Total Members:** ${guild.memberCount}\n`;
                response += `**Roles:** ${guild.roles.cache.size}\n`;
                const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
                response += `**Online Members:** ${onlineMembers}\n`;
                response += `**Bots:** ${guild.members.cache.filter(m => m.user.bot).size}\n`;
                break;
            case 'boosts':
                response = `### 💎 **Boost Status**\n`;
                response += `**Boost Level:** ${guild.premiumTier}\n`;
                response += `**Boost Count:** ${guild.premiumSubscriptionCount || 0}\n`;
                const boostPerks = {
                    0: 'No perks',
                    1: '50 emoji slots, 128kbps audio',
                    2: '100 emoji slots, 256kbps audio, banner',
                    3: '250 emoji slots, 384kbps audio, animated icon'
                };
                response += `**Perks:** ${boostPerks[guild.premiumTier]}\n`;
                break;
            case 'channels':
                response = `### 📁 **Channel Information**\n`;
                response += `**Total Channels:** ${guild.channels.cache.size}\n`;
                response += `**Text Channels:** ${guild.channels.cache.filter(c => c.type === 0).size}\n`;
                response += `**Voice Channels:** ${guild.channels.cache.filter(c => c.type === 2).size}\n`;
                response += `**Categories:** ${guild.channels.cache.filter(c => c.type === 4).size}\n`;
                break;
        }
        
        await interaction.reply({ content: response, ephemeral: true });
    }
    // Handle existing help categories from components command
    else if (customId === 'help_categories') {
        const selectedCategory = interaction.values[0];
        let response = '';
        
        switch (selectedCategory) {
            case 'general':
                response = `### ⚙️ **General Commands**\n`;
                response += `• \`/info\` - Interactive information hub with multiple topics\n`;
                response += `• \`/user\` - Comprehensive user profile dashboard\n`;
                response += `• \`/server\` - Detailed server information panel\n`;
                response += `• \`/ping\` - Check bot latency and response time\n`;
                response += `• \`/hello\` - Friendly greeting command\n`;
                break;
            case 'fun':
                response = `### 🎮 **Fun Commands**\n`;
                response += `• \`/roll\` - Roll dice with customizable sides\n`;
                response += `• \`/say\` - Make the bot say something\n`;
                response += `• \`/rawr\` - Classic rawr command with variations\n`;
                response += `• \`/components\` - Interactive component showcase\n`;
                break;
            case 'system':
                response = `### 🔧 **System Commands**\n`;
                response += `• \`/rawr sys\` - System management and feature toggles\n`;
                response += `• \`/announce\` - Create announcements with modal forms\n`;
                response += `• \`/components modal\` - Test modal functionality\n`;
                break;
        }
        
        await interaction.reply({ content: response, ephemeral: true });
    }
}

module.exports = { handleSelectMenuInteraction };
