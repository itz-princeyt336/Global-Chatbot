const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path'); // Add this line
const configPath = path.resolve(__dirname, '../config.json');
let config = require(configPath);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Setup the global chat channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to set as global chat')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        // Add the channel ID to the global chat channels array
        if (!config.globalChatChannels.includes(channel.id)) {
            config.globalChatChannels.push(channel.id);
        }

        // Save the updated config
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        await interaction.reply(`Global chat has been set to ${channel}`);
    }
};
