const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Provides information about the server.'),
    async execute(interaction) {
        const guild = interaction.guild;
        
        let response = `**Server Info**\n`;
        response += `**Name:** ${guild.name}\n`;
        response += `**ID:** ${guild.id}\n`;
        response += `**Owner:** <@${guild.ownerId}>\n`;
        response += `**Members:** ${guild.memberCount}\n`;
        response += `**Created:** ${guild.createdAt.toDateString()}\n`;
        response += `**Boost Level:** ${guild.premiumTier}\n`;
        response += `**Boost Count:** ${guild.premiumSubscriptionCount || 0}`;
        
        if (guild.iconURL()) {
            response += `\n**Icon:** [Click here](${guild.iconURL()})`;
        }
        
        await interaction.reply(response);
    },
};
