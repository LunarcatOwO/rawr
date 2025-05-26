/**
 * Feature management utilities
 * Helper functions for feature toggle displays and management
 */

// Function to show feature toggles
async function showFeatureToggles(interaction, type) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const FeatureManager = require('../FeatureManager');
    const featureManager = new FeatureManager();
    
    let components = [];
    let response = '';
    
    // Check if we should use embeds or component-based UI
    const useEmbeds = featureManager.isFeatureEnabled('rich_embeds');
    
    if (type === 'commands') {
        const commands = featureManager.getAllCommands();
        
        if (useEmbeds) {
            // Traditional embed approach
            const embed = new EmbedBuilder()
                .setTitle('🔧 Command Management')
                .setDescription('Click the buttons below to enable/disable commands:')
                .setColor(0x5865F2);
            
            // Create buttons for each command (max 5 per row)
            let currentRow = new ActionRowBuilder();
            let buttonCount = 0;
            
            for (const [cmdName, cmdData] of Object.entries(commands)) {
                if (buttonCount === 5) {
                    components.push(currentRow);
                    currentRow = new ActionRowBuilder();
                    buttonCount = 0;
                }
                
                const button = new ButtonBuilder()
                    .setCustomId(`toggle_cmd_${cmdName}`)
                    .setLabel(cmdName)
                    .setStyle(cmdData.enabled ? ButtonStyle.Success : ButtonStyle.Danger)
                    .setEmoji(cmdData.enabled ? '✅' : '❌');
                
                currentRow.addComponents(button);
                buttonCount++;
                
                embed.addFields({
                    name: `${cmdData.enabled ? '✅' : '❌'} /${cmdName}`,
                    value: cmdData.description,
                    inline: true
                });
            }
            
            if (buttonCount > 0) {
                components.push(currentRow);
            }
            
            await interaction.reply({
                embeds: [embed],
                components: components,
                ephemeral: true
            });
        } else {
            // Component-based approach
            response = `### 🔧 **Command Management**\n`;
            response += `Click the buttons below to enable/disable commands:\n\n`;
            
            // Create buttons for each command (max 5 per row)
            let currentRow = new ActionRowBuilder();
            let buttonCount = 0;
            
            for (const [cmdName, cmdData] of Object.entries(commands)) {
                if (buttonCount === 5) {
                    components.push(currentRow);
                    currentRow = new ActionRowBuilder();
                    buttonCount = 0;
                }
                
                const button = new ButtonBuilder()
                    .setCustomId(`toggle_cmd_${cmdName}`)
                    .setLabel(cmdName)
                    .setStyle(cmdData.enabled ? ButtonStyle.Success : ButtonStyle.Danger)
                    .setEmoji(cmdData.enabled ? '✅' : '❌');
                
                currentRow.addComponents(button);
                buttonCount++;
                
                const status = cmdData.enabled ? '✅' : '❌';
                response += `**${status} /${cmdName}** - ${cmdData.description}\n`;
            }
            
            if (buttonCount > 0) {
                components.push(currentRow);
            }
            
            await interaction.reply({
                content: response,
                components: components,
                ephemeral: true
            });
        }
    }
    else if (type === 'features') {
        const features = featureManager.getAllFeatures();
        
        if (useEmbeds) {
            // Traditional embed approach
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Feature Management')
                .setDescription('Click the buttons below to enable/disable features:')
                .setColor(0xFFD700);
            
            // Create buttons for each feature
            let currentRow = new ActionRowBuilder();
            let buttonCount = 0;
            
            for (const [featName, featData] of Object.entries(features)) {
                if (buttonCount === 5) {
                    components.push(currentRow);
                    currentRow = new ActionRowBuilder();
                    buttonCount = 0;
                }
                
                const button = new ButtonBuilder()
                    .setCustomId(`toggle_feat_${featName}`)
                    .setLabel(featName.replace('_', ' '))
                    .setStyle(featData.enabled ? ButtonStyle.Success : ButtonStyle.Danger)
                    .setEmoji(featData.enabled ? '✅' : '❌');
                
                currentRow.addComponents(button);
                buttonCount++;
                
                embed.addFields({
                    name: `${featData.enabled ? '✅' : '❌'} ${featName.replace('_', ' ')}`,
                    value: featData.description,
                    inline: true
                });
            }
            
            if (buttonCount > 0) {
                components.push(currentRow);
            }
            
            await interaction.reply({
                embeds: [embed],
                components: components,
                ephemeral: true
            });
        } else {
            // Component-based approach
            response = `### ⚙️ **Feature Management**\n`;
            response += `Click the buttons below to enable/disable features:\n\n`;
            
            // Create buttons for each feature
            let currentRow = new ActionRowBuilder();
            let buttonCount = 0;
            
            for (const [featName, featData] of Object.entries(features)) {
                if (buttonCount === 5) {
                    components.push(currentRow);
                    currentRow = new ActionRowBuilder();
                    buttonCount = 0;
                }
                
                const button = new ButtonBuilder()
                    .setCustomId(`toggle_feat_${featName}`)
                    .setLabel(featName.replace('_', ' '))
                    .setStyle(featData.enabled ? ButtonStyle.Success : ButtonStyle.Danger)
                    .setEmoji(featData.enabled ? '✅' : '❌');
                
                currentRow.addComponents(button);
                buttonCount++;
                
                const status = featData.enabled ? '✅' : '❌';
                response += `**${status} ${featName.replace('_', ' ')}** - ${featData.description}\n`;
            }
            
            if (buttonCount > 0) {
                components.push(currentRow);
            }
            
            await interaction.reply({
                content: response,
                components: components,
                ephemeral: true
            });
        }
    }
}

module.exports = { showFeatureToggles };
