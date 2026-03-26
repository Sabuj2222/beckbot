require('dotenv').config();

const { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  REST, 
  Routes,
  ChannelType, 
  PermissionsBitField 
} = require('discord.js');

const ms = require('ms');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

/* CONFIG */
const CATEGORY_ID = "1481422919073534023";
const SUPPORT_ROLE_ID = "1484312131288436857";

/* READY */
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

/* REGISTER COMMAND */
const commands = [
  new SlashCommandBuilder()
    .setName('gcreate')
    .setDescription('Create a giveaway')
    .addStringOption(opt =>
      opt.setName('item')
        .setDescription('Prize')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('time')
        .setDescription('Time (10s, 5m, 1h)')
        .setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('winners')
        .setDescription('Number of winners')
        .setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(1467004747583328378),
      { body: commands }
    );
    console.log("✅ Slash command registered");
  } catch (err) {
    console.error(err);
  }
})();

/* COMMAND HANDLER */
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'gcreate') {

    const item = interaction.options.getString('item');
    const time = interaction.options.getString('time');
    const winnersCount = interaction.options.getInteger('winners');

    const duration = ms(time);
    if (!duration) {
      return interaction.reply({ content: "❌ Invalid time!", ephemeral: true });
    }

    const msg = await interaction.channel.send(
      `🎉 **GIVEAWAY** 🎉\n\nPrize: **${item}**\nReact with 🎉 to enter!\nEnds in **${time}**`
    );

    await msg.react("🎉");
    await interaction.reply({ content: "✅ Giveaway started!", ephemeral: true });

    /* WAIT */
    setTimeout(async () => {
      try {
        const fetched = await msg.fetch();
        const reaction = fetched.reactions.cache.get("🎉");

        if (!reaction) return;

        const users = await reaction.users.fetch();
        const validUsers = users.filter(u => !u.bot);

        if (validUsers.size === 0) {
          return interaction.channel.send("❌ No participants!");
        }

        /* PICK WINNERS */
        const shuffled = [...validUsers.values()].sort(() => 0.5 - Math.random());
        const winners = shuffled.slice(0, winnersCount);

        await interaction.channel.send(`🎉 Winners: ${winners.join(", ")}`);

        /* CREATE TICKETS */
        for (const winner of winners) {

          await interaction.guild.channels.create({
            name: `ticket-${winner.username}`,
            type: ChannelType.GuildText,
            parent: CATEGORY_ID,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
              },
              {
                id: SUPPORT_ROLE_ID,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages
                ]
              },
              {
                id: winner.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages
                ]
              }
            ]
          });

        }

      } catch (err) {
        console.error(err);
      }

    }, duration);
  }
});

/* LOGIN */
client.login(MTQ2NzAwNDc0NzU4MzMyODM3OA.GOeMAE.H60U7Xj4cTS6tr6farDnKMfnTxlp8MMoR2yadw);
