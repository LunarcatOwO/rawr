const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll a dice')
        .addIntegerOption(option =>
            option.setName('sides')
                .setDescription('Number of sides on the dice (default: 6)')
                .setRequired(false)
                .setMinValue(2)
                .setMaxValue(100))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Number of dice to roll (default: 1)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)),
    async execute(interaction) {
        const sides = interaction.options.getInteger('sides') || 6;
        const count = interaction.options.getInteger('count') || 1;
        
        let results = [];
        let total = 0;
        
        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            results.push(roll);
            total += roll;
        }
        
        let response = `🎲 **Dice Roll**\n`;
        response += `**Dice:** ${count}d${sides}\n`;
        response += `**Results:** ${results.join(', ')}\n`;
        
        if (count > 1) {
            response += `**Total:** ${total}`;
        }
        
        // Create buttons for quick actions
        const rollAgainButton = new ButtonBuilder()
            .setCustomId('roll_again')
            .setLabel('Quick Roll (1d6)')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🎲');
            
        const row = new ActionRowBuilder()
            .addComponents(rollAgainButton);
        
        await interaction.reply({
            content: response,
            components: [row]
        });
    },
};
