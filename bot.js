const { Telegraf } = require('telegraf');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { TELEGRAM_API_TOKEN } = require('./config');

const bot = new Telegraf(TELEGRAM_API_TOKEN);

const userStates = {};

bot.start((ctx) => {
    const userId = ctx.message.from.id;
    const userDir = path.join(__dirname, 'users', String(userId));
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }
    userStates[userId] = { step: 'ask_repo' };
    ctx.reply('𝗪𝗘𝗟𝗖𝗢𝗠𝗘 ! 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚝𝚑𝚎 𝚛𝚎𝚙𝚘𝚜𝚒𝚝𝚘𝚛𝚢 𝚄𝚁𝙻 𝚢𝚘𝚞 𝚠𝚒𝚜𝚑 𝚝𝚘 𝚌𝚕𝚘𝚗𝚎.\n\n' +
        '𝚈𝚘𝚞 𝚌𝚊𝚗 𝚊𝚕𝚜𝚘 𝚎𝚡𝚎𝚌𝚞𝚝𝚎 𝚜𝚑𝚎𝚕𝚕 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜 𝚋𝚢 𝚙𝚛𝚎𝚏𝚒𝚡𝚒𝚗𝚐 𝚝𝚑𝚎𝚖 𝚠𝚒𝚝𝚑 $.\n' +
        '𝐷𝑒𝑣𝑒𝑙𝑜𝑝𝑒𝑑 𝑏𝑦 𝐵𝐿𝑈𝐸 𝐷𝐸𝑀𝑂𝑁');
});

bot.on('text', (ctx) => {
    const userId = ctx.message.from.id;
    const userDir = path.join(__dirname, 'users', String(userId));
    const userState = userStates[userId] || { step: 'ask_repo' };

    const message = ctx.message.text.trim();

    if (message.startsWith('$')) {
        const shellCommand = message.slice(1).trim().split(' ');
        ctx.reply(`𝙲𝙾𝙼𝙼𝙰𝙽𝙳> ${shellCommand.join(' ')}`);

        const shellProcess = spawn(shellCommand[0], shellCommand.slice(1), { cwd: userDir });

        shellProcess.stdout.on('data', (data) => {
            ctx.reply(`✅𝙾𝚄𝚃𝙿𝚄𝚃\n${data.toString()}`);
        });

        shellProcess.stderr.on('data', (data) => {
            ctx.reply(`⚠️𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙴𝚁𝚁𝙾𝚁\n${data.toString()}`);
        });

        shellProcess.on('close', (code) => {
            ctx.reply(`🍑 ${code}`);
        });

        return;
    }

    if (userState.step === 'ask_repo') {
        const repoUrl = message;
        ctx.reply(`🔄 𝙲𝚕𝚘𝚗𝚒𝚗𝚐 𝚝𝚑𝚎 𝚛𝚎𝚙𝚘𝚜𝚒𝚝𝚘𝚛𝚢 𝚏𝚛𝚘𝚖: ${repoUrl}\n\n𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝...🍑`);

        const gitClone = spawn('git', ['clone', repoUrl, '.'], { cwd: userDir });

        gitClone.stdout.on('data', (data) => {
            ctx.reply(`✅ 𝙶𝙸𝚃 𝙾𝚄𝚃𝙿𝚄𝚃:\n${data.toString()}`);
        });

        gitClone.stderr.on('data', (data) => {
            ctx.reply(`⚠️ 𝙶𝙸𝚃 𝙴𝚁𝚁𝙾𝚁:\n${data.toString()}`);
        });

        gitClone.on('close', (code) => {
            if (code === 0) {
                ctx.reply('✅ 𝚁𝚎𝚙𝚘𝚜𝚒𝚝𝚘𝚛𝚢 𝚌𝚕𝚘𝚗𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢!\n𝙽𝚘𝚠, 𝙸 𝚠𝚒𝚕𝚕 𝚒𝚗𝚜𝚝𝚊𝚕𝚕 𝚝𝚑𝚎 𝚍𝚎𝚙𝚎𝚗𝚍𝚎𝚗𝚌𝚒𝚎𝚜...');
                userStates[userId].step = 'install_dependencies';

                ctx.reply('𝙸𝚗𝚜𝚝𝚊𝚕𝚕𝚒𝚗𝚐 𝚍𝚎𝚙𝚎𝚗𝚍𝚎𝚗𝚌𝚒𝚎𝚜 𝚞𝚜𝚒𝚗𝚐 `𝚢𝚊𝚛𝚗 𝚒𝚗𝚜𝚝𝚊𝚕𝚕`...');

                const yarnInstall = spawn('yarn', ['install'], { cwd: userDir });

                yarnInstall.stdout.on('data', (data) => {
                    ctx.reply(`✅ 𝚈𝙰𝚁𝙽 𝙾𝚄𝚃𝙿𝚄𝚃:\n${data.toString()}`);
                });

                yarnInstall.stderr.on('data', (data) => {
                    ctx.reply(`⚠️ 𝚈𝙰𝚁𝙽 𝙴𝚁𝚁𝙾𝚁:\n${data.toString()}`);
                });

                yarnInstall.on('close', (installCode) => {
                    if (installCode === 0) {
                        ctx.reply('✅ 𝙳𝚎𝚙𝚎𝚗𝚍𝚎𝚗𝚌𝚒𝚎𝚜 𝚒𝚗𝚜𝚝𝚊𝚕𝚕𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢!\n𝙽𝚘𝚠 𝚜𝚎𝚗𝚍 𝚝𝚑𝚎 𝚗𝚊𝚖𝚎 𝚘𝚏 𝚝𝚑𝚎 𝚏𝚒𝚕𝚎 𝚢𝚘𝚞 𝚠𝚘𝚞𝚕𝚍 𝚕𝚒𝚔 𝚝𝚘 𝚜𝚝𝚊𝚛𝚝 𝚞𝚜𝚒𝚗𝚐  `𝚗𝚘𝚍𝚎`\n.𝚖𝚘𝚜𝚝𝚕𝚢 𝚒𝚝 𝚒𝚜 𝚒𝚗𝚍𝚎𝚡.𝚓𝚜');
                        userStates[userId].step = 'ask_file';
                    } else {
                        ctx.reply('❌ 𝙴𝚛𝚛𝚘𝚛 𝚒𝚗𝚜𝚝𝚊𝚕𝚕𝚒𝚗𝚐 𝚍𝚎𝚙𝚎𝚗𝚍𝚎𝚗𝚌𝚒𝚎𝚜.');
                        userStates[userId].step = 'ask_repo'; // Reset step on failure
                    }
                });
            } else {
                ctx.reply('❌  𝙴𝚛𝚛𝚘𝚛 𝚌𝚕𝚘𝚗𝚒𝚗𝚐 𝚝𝚑𝚎 𝚛𝚎𝚙𝚘𝚜𝚒𝚝𝚘𝚛𝚢.');
                userStates[userId].step = 'ask_repo'; // Reset step on failure
            }
        });
    } else if (userState.step === 'ask_file') {
        const filename = message;
        const filePath = path.join(userDir, filename);

        if (!fs.existsSync(filePath)) {
            return ctx.reply('❌ 𝚃𝚑𝚎 𝚜𝚙𝚎𝚌𝚒𝚏𝚒𝚎𝚍 𝚏𝚒𝚕𝚎 𝚍𝚘𝚎𝚜 𝚗𝚘𝚝 𝚎𝚡𝚒𝚜𝚝. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗.');
        }

        ctx.reply(`🚀 𝚁𝚞𝚗𝚗𝚒𝚗𝚐 𝚝𝚑𝚎 𝚏𝚒𝚕𝚎: ${filename}\n\n𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝...🍑`);
        const nodeProcess = spawn('node', [filename], { cwd: userDir });

        nodeProcess.stdout.on('data', (data) => {
            ctx.reply(`✅ 𝙽𝙾𝙳𝙴 𝙾𝚄𝚃𝙿𝚄𝚃:\n${data.toString()}`);
        });

        nodeProcess.stderr.on('data', (data) => {
            ctx.reply(`⚠️ 𝙽𝙾𝙳𝙴 𝙴𝚁𝚁𝙾𝚁:\n${data.toString()}`);
        });

        nodeProcess.on('close', (code) => {
            ctx.reply(`𝙽𝚘𝚍𝚎 𝚙𝚛𝚘𝚌𝚎𝚜𝚜 𝚎𝚡𝚒𝚝𝚎𝚍 𝚠𝚒𝚝𝚑 𝚌𝚘𝚍𝚎 ${code}`);
            userStates[userId].step = 'done';
        });
    } else {
        ctx.reply('𝙸 𝚍𝚘 𝚗𝚘𝚝 𝚞𝚗𝚍𝚎𝚛𝚜𝚝𝚊𝚗𝚍 𝚝𝚑𝚊𝚝. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚜𝚎𝚗𝚍 𝚊 𝚟𝚊𝚕𝚒𝚍 𝚒𝚗𝚙𝚞𝚝.');
    }
});

bot.command('help', (ctx) => {
    ctx.reply(`*Commands available:*\n\n` +
        `- **/start**: Start the bot.\n` +
        `- **/help**: Show this help message.\n\n` +
        `*Workflow:*\n` +
        `1. Send the repository URL to clone.\n` +
        `2. Automatically install dependencies using \`yarn install\`.\n` +
        `3. Specify the file to run using \`node\`.\n\n` +
        `*Shell Commands:*\n` +
        `- Use \`$<command>\` to execute any shell command in your directory.\n\n` +
        `*Disclaimer:* Use responsibly. Avoid commands that may damage your system.`);
});

bot.launch()
    .then(() => {
        console.log('Bot is running...');
    })
    .catch((err) => {
        console.error('Error launching bot:', err);
    });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));