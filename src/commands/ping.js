const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const ping = sent.createdTimestamp - interaction.createdTimestamp;
        
        // Create a button for pinging again
        const pingButton = new ButtonBuilder()
            .setCustomId('ping_again')
            .setLabel('Ping Again')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏓');
            
        const row = new ActionRowBuilder()
            .addComponents(pingButton);
        
        await interaction.editReply({
            content: `Pong! 🏓\nLatency: ${ping}ms\nAPI Latency: ${Math.round(interaction.client.ws.ping)}ms`,
            components: [row]
        });
    },
};
