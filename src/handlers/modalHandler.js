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
    }
    else if (customId === 'announcement_modal') {
        const title = interaction.fields.getTextInputValue('announcement_title');
        const content = interaction.fields.getTextInputValue('announcement_content');
        
        await interaction.reply({
            content: `**Announcement Created:**\n# ${title}\n${content}`,
            ephemeral: false
        });
    }
}

module.exports = { handleModalSubmission };
