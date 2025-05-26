const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('components')
        .setDescription('Showcase Discord Components v2 features')
        .addSubcommand(subcommand =>
            subcommand
                .setName('buttons')
                .setDescription('Show various button styles and interactions'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('selectmenu')
                .setDescription('Show select menu components'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('modal')
                .setDescription('Show modal form components'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Interactive help menu')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'buttons':
                await showButtons(interaction);
                break;
            case 'selectmenu':
                await showSelectMenu(interaction);
                break;
            case 'modal':
                await showModal(interaction);
                break;
            case 'help':
                await showInteractiveHelp(interaction);
                break;
        }
    },
};

async function showButtons(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🔘 Button Components Showcase')
        .setDescription('Here are different button styles and interactions:')
        .setColor(0x5865F2);
    
    // Row 1: Different button styles
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('color_red')
                .setLabel('Red')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔴'),
            new ButtonBuilder()
                .setCustomId('color_green')
                .setLabel('Green')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🟢'),
            new ButtonBuilder()
                .setCustomId('color_blue')
                .setLabel('Blue')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔵'),
            new ButtonBuilder()
                .setCustomId('color_gray')
                .setLabel('Gray')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⚫')
        );
    
    // Row 2: Special buttons
    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Visit Discord')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.com')
                .setEmoji('🔗'),
            new ButtonBuilder()
                .setCustomId('delete_message')
                .setLabel('Delete Message')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️')
        );
    
    await interaction.reply({
        embeds: [embed],
        components: [row1, row2]
    });
}

async function showSelectMenu(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('📋 Select Menu Components')
        .setDescription('Choose from the dropdown menu below:')
        .setColor(0x57F287);
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_categories')
        .setPlaceholder('Choose a help category...')
        .addOptions([
            {
                label: 'General Commands',
                description: 'Basic bot commands and utilities',
                value: 'general',
                emoji: '⚙️'
            },
            {
                label: 'Fun Commands',
                description: 'Entertainment and games',
                value: 'fun',
                emoji: '🎮'
            },
            {
                label: 'System Commands',
                description: 'Bot administration and settings',
                value: 'system',
                emoji: '🔧'
            }
        ]);
    
    const row = new ActionRowBuilder()
        .addComponents(selectMenu);
    
    await interaction.reply({
        embeds: [embed],
        components: [row]
    });
}

async function showModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('feedback_modal')
        .setTitle('Feedback Form');
    
    const titleInput = new TextInputBuilder()
        .setCustomId('feedback_title')
        .setLabel('Feedback Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter a brief title for your feedback')
        .setRequired(true)
        .setMaxLength(100);
    
    const descriptionInput = new TextInputBuilder()
        .setCustomId('feedback_description')
        .setLabel('Feedback Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Provide detailed feedback here...')
        .setRequired(true)
        .setMaxLength(1000);
    
    const titleRow = new ActionRowBuilder().addComponents(titleInput);
    const descriptionRow = new ActionRowBuilder().addComponents(descriptionInput);
    
    modal.addComponents(titleRow, descriptionRow);
    
    await interaction.showModal(modal);
}

async function showInteractiveHelp(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🤖 Interactive Help Menu')
        .setDescription('Use the components below to get help or interact with the bot!')
        .addFields(
            { name: '📋 Select Menu', value: 'Choose a category to get specific help', inline: true },
            { name: '🔘 Buttons', value: 'Quick actions and navigation', inline: true },
            { name: '📝 Modal', value: 'Fill out forms and provide input', inline: true }
        )
        .setColor(0xFFD700)
        .setTimestamp();
    
    // Help category select menu
    const helpMenu = new StringSelectMenuBuilder()
        .setCustomId('help_categories')
        .setPlaceholder('Select a help category...')
        .addOptions([
            {
                label: 'General Commands',
                description: 'Basic bot commands',
                value: 'general',
                emoji: '⚙️'
            },
            {
                label: 'Fun Commands',
                description: 'Games and entertainment',
                value: 'fun',
                emoji: '🎮'
            },
            {
                label: 'System Commands',
                description: 'Admin tools',
                value: 'system',
                emoji: '🔧'
            }
        ]);
    
    // Action buttons
    const actionButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ping_again')
                .setLabel('Test Ping')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🏓'),
            new ButtonBuilder()
                .setCustomId('roll_again')
                .setLabel('Quick Roll')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🎲'),
            new ButtonBuilder()
                .setLabel('GitHub')
                .setStyle(ButtonStyle.Link)
                .setURL('https://github.com')
                .setEmoji('📚')
        );
    
    const selectRow = new ActionRowBuilder().addComponents(helpMenu);
    
    await interaction.reply({
        embeds: [embed],
        components: [selectRow, actionButtons]
    });
}
