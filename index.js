require("dotenv/config")

const { Client } = require("discord.js");
const { OpenAI } = require("openai");

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent']
});

const IGNORE_PREFIX = "!";
const CHANNELS = ['1194177230633447434']

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

client.on('ready', () => {console.log('The bot is online')});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;
    
    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let conversation = [];
    conversation.push({
        role: 'system',
        content: "Chat gpt is a friendly chatbot."
    });

    let prevMessages = await message.channel.messages.fetch({limit: 10});
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
        if (msg.author.bot && msg.author.id !== client.user.id) return;
        if (msg.content.startsWith(IGNORE_PREFIX)) return;
        
        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if (msg.author.id === client.user.id) {
            conversation.push({
                role: 'assistant',
                name: username,
                content: msg.content,
            });
            return;
        }
        conversation.push({
            role: 'user',
            name: username,
            content: msg.content
        })
    });

    const response = await openai.chat.completions
        .create({
            model: 'gpt-4',
            messages: conversation,
        }).catch((error) => console.error('OpenAI Error:\n', error));

    clearInterval(sendTypingInterval);

    if (!response) {
        message.reply("I'm having some trouble with the API. Please try later")
        return;
    }

    const responseMsg = response.choices[0].message.content;
    const chunkSize = 2000;

    for (let i = 0; i < responseMsg.length; i+= chunkSize) {
        const chunk = responseMsg.substring(i, i + chunkSize);
        await message.reply(chunk);
    }

    // message.reply();
});

client.login(process.env.TOKEN);

