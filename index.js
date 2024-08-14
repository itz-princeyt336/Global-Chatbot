const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, Partials, Presence, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const configPath = './config.json';
let config = require(configPath);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// Load command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Set bot status (presence)
    client.user.setPresence({
        status: 'idle',
    });
    client.user.setActivity({
            name: '/chat',
            type: ActivityType.Streaming,
            url: 'https://www.twitch.tv/discord'
        });

    // Deploy commands
    const rest = new REST({ version: '10' }).setToken(config.token);
    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (config.globalChatChannels.includes(message.channel.id)) {
        const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setDescription(message.content)
            .setFooter({ text: `Server: ${message.guild.name}` });

        await message.delete();

        // Filter out invalid channels
        config.globalChatChannels = config.globalChatChannels.filter(async channelId => {
            try {
                const channel = await client.channels.fetch(channelId);
                if (channel) {
                    await channel.send({ embeds: [embed] });
                    return true;
                }
            } catch (error) {
                console.error(`Failed to fetch or send message to channel ${channelId}:`, error);
                return false;
            }
        });
    }
});

client.login(config.token);
