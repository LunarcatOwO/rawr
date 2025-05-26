const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Says hello to you!')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Your name')
                .setRequired(false)),
    async execute(interaction) {
        const name = interaction.options.getString('name') || interaction.user.displayName;
        
        await interaction.reply({
            content: `Hello, ${name}! 👋 This command was automatically registered in the feature system!`
        });
    },
};
