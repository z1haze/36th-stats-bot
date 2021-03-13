require('dotenv').config();

const got = require('got');
const { JSDOM } = require('jsdom');
const {Client, MessageAttachment} = require('discord.js');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const monitor = require('./util/sentry');
const updateDom = require('./util/update-dom');
const prefix = process.env.PREFIX;
const command = process.env.COMMAND;
const BOT_TOKEN = process.env.BOT_TOKEN;

monitor.init();

const client = new Client();

client.on('ready', async () => {
    // eslint-disable-next-line no-console
    console.info(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (message) => {
    const {content, author} = message;

    // ignore bot messages
    if (author.bot) {
        return;
    }

    const args = content.split(/[ ]+/);

    // ignore non bfvstats messages
    if (args[0] !== prefix + command) {
        return;
    }

    // drop the first arg (the command itself [eg. ~bfvstats]
    args.shift();

    // make sure the command is valid
    if (!args.length || args.length > 1) {
        return message.reply(`Incorrect syntax: Use ${prefix + command} <gamer tag>`);
    }

    message.channel.startTyping();

    const game = 'bfv';
    const platform = 'xbl';
    const gamertag = args[0];
    const url = `https://battlefieldtracker.com/${game}/profile/${platform}/${gamertag}/overview`;
    let response;

    try {
        response = await got(url);
    } catch (e) {
        if (e.response.statusCode === 404) {
            await message.reply('Player not found. Check your spelling and try again.');
        } else {
            await message.reply('something broke, tell wiggls');
        }

        return message.channel.stopTyping();
    }

    const dom = new JSDOM(response.body, {
        url,
        runScripts: 'dangerously'
    });

    const data = dom.window.__INITIAL_STATE__['stats-v2'].standardProfiles[`${game}|${platform}|${gamertag}`];

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    });

    console.log(await browser.version());

    const page = await browser.newPage();

    await page.goto('https://thefighting36th.com/stats2');

    const dimensions = await page.evaluate(() => {
        const el = document.getElementById('wrapper');

        return {
            width            : el.offsetWidth,
            height           : el.offsetHeight,
            deviceScaleFactor: window.devicePixelRatio
        };
    });

    await page.setViewport({
        width : dimensions.width,
        height: dimensions.height
    });

    await page.evaluate(updateDom, data);

    const id = uuidv4();
    const filePath = path.resolve('tmp', `${id}.png`);

    await page.screenshot({path: filePath});
    await browser.close();

    const image = fs.readFileSync(filePath);
    const attachment = new MessageAttachment(image);
    const encodedUrl = encodeURI(`${url}?ref=discord`);

    await message.channel.send(`**${gamertag}, for your full stats, visit: <${encodedUrl}>**`, attachment);

    fs.unlinkSync(filePath);

    message.channel.stopTyping();
});

client.login(BOT_TOKEN);