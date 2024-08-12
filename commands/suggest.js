const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { suggestionChannelId, ownerId } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion')
        .addStringOption(option =>
            option.setName('suggestion')
                .setDescription('Your suggestion')
                .setRequired(true)
        ),
    async execute(interaction) {
        const suggestion = interaction.options.getString('suggestion');
        const suggestionChannel = interaction.client.channels.cache.get(suggestionChannelId);

        if (!suggestionChannel) {
            return interaction.reply({ content: 'Suggestion channel not found.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('New Suggestion')
            .setDescription(suggestion)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const approveButton = new ButtonBuilder()
            .setCustomId('approve')
            .setLabel('Approve')
            .setStyle(ButtonStyle.Success);

        const declineButton = new ButtonBuilder()
            .setCustomId('decline')
            .setLabel('Decline')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(approveButton, declineButton);

        const suggestionMessage = await suggestionChannel.send({ embeds: [embed], components: [row] });

        await interaction.reply({ content: 'Your suggestion has been submitted!', ephemeral: true });

        const filter = i => i.user.id === ownerId;
        const collector = suggestionMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'approve') {
                await i.update({ content: 'Suggestion approved!', embeds: [embed], components: [] });
            } else if (i.customId === 'decline') {
                await i.update({ content: 'Suggestion declined!', embeds: [embed], components: [] });
            }
        });

        collector.on('end', collected => {
            if (!collected.size) {
                suggestionMessage.edit({ content: 'No action taken on this suggestion.', components: [] });
            }
        });
    }
};
