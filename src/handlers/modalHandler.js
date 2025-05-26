/**
 * Modal submission handler
 * Handles all modal form submissions from Discord components
 */

async function handleModalSubmission(interaction) {
    const { customId } = interaction;
    
    if (customId === 'feedback_modal') {
        const title = interaction.fields.getTextInputValue('feedback_title');
        const description = interaction.fields.getTextInputValue('feedback_description');
        
        await interaction.reply({
            content: `**Feedback Received!**\n**Title:** ${title}\n**Description:** ${description}\n\nThank you for your feedback!`,
            ephemeral: true
        });
    }    else if (customId === 'announcement_modal' || customId === 'announcement_modal_simple' || customId === 'announcement_modal_advanced') {
        const title = interaction.fields.getTextInputValue('announcement_title');
        const content = interaction.fields.getTextInputValue('announcement_content');
        
        // Create a professional announcement embed
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setTitle(`📢 ${title}`)
            .setDescription(content)
            .setColor(0x5865F2)
            .setTimestamp()
            .setFooter({ 
                text: `Announcement by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            });
        
        await interaction.reply({
            content: '✅ **Announcement sent successfully!**',
            embeds: [embed],
            ephemeral: false
        });
    }
}

module.exports = { handleModalSubmission };
