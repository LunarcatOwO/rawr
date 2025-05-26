const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot say something')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want the bot to say')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('ephemeral')
                .setDescription('Whether the response should be ephemeral (only visible to you)')
                .setRequired(false)),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        
        await interaction.reply({ 
            content: message, 
            ephemeral: ephemeral 
        });
    },
};
