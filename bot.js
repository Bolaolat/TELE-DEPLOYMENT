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
    ctx.reply('**Welcome! Please provide the repository URL you wish to clone. You can also execute shell commands by prefixing them with $.**\n```Developed by BLUE DEMON.```');
});

bot.on('text', (ctx) => {
    const userId = ctx.message.from.id;
    const userDir = path.join(__dirname, 'users', String(userId));
    const userState = userStates[userId] || { step: 'ask_repo' };

    const message = ctx.message.text.trim();

    if (message.startsWith('$')) {
        const shellCommand = message.slice(1).trim().split(' ');
        ctx.reply(`\`\`\`Executing shell command: \`${shellCommand.join(' ')}\`...\`\`\``);

        const shellProcess = spawn(shellCommand[0], shellCommand.slice(1), { cwd: userDir });

        shellProcess.stdout.on('data', (data) => {
            ctx.reply(`\`\`\`✅ Output:\n${data.toString()}\`\`\``);
        });

        shellProcess.stderr.on('data', (data) => {
            ctx.reply(`⚠️ Error:\n${data.toString()}`);
        });

        shellProcess.on('close', (code) => {
            ctx.reply(`Command exited with code ${code}.`);
        });

        return;
    }

    if (userState.step === 'ask_repo') {
        const repoUrl = message;
        ctx.reply(`Cloning the repository from: ${repoUrl}...`);

        const gitClone = spawn('git', ['clone', repoUrl, '.'], { cwd: userDir });

        gitClone.stdout.on('data', (data) => {
            ctx.reply(`✅ Git Output:\n${data.toString()}`);
        });

        gitClone.stderr.on('data', (data) => {
            ctx.reply(`⚠️ Git Error:\n${data.toString()}`);
        });

        gitClone.on('close', (code) => {
            if (code === 0) {
                ctx.reply('✅ Repository cloned successfully!');
                userStates[userId].step = 'install_dependencies';

                ctx.reply('Installing dependencies using `yarn install`...');
                const yarnInstall = spawn('yarn', ['install'], { cwd: userDir });

                yarnInstall.stdout.on('data', (data) => {
                    ctx.reply(`✅ Yarn Output:\n${data.toString()}`);
                });

                yarnInstall.stderr.on('data', (data) => {
                    ctx.reply(`⚠️ Yarn Error:\n${data.toString()}`);
                });

                yarnInstall.on('close', (installCode) => {
                    if (installCode === 0) {
                        ctx.reply('✅ Dependencies installed successfully! Now send me the name of the file to run using `node`.');
                        userStates[userId].step = 'ask_file';
                    } else {
                        ctx.reply('❌ Error installing dependencies.');
                        userStates[userId].step = 'ask_repo'; // Reset step on failure
                    }
                });
            } else {
                ctx.reply('❌ Error cloning the repository.');
                userStates[userId].step = 'ask_repo'; // Reset step on failure
            }
        });
    } else if (userState.step === 'ask_file') {
        const filename = message;
        const filePath = path.join(userDir, filename);

        if (!fs.existsSync(filePath)) {
            return ctx.reply('❌ The specified file does not exist. Please try again.');
        }

        ctx.reply(`Running the file: ${filename}...`);
        const nodeProcess = spawn('node', [filename], { cwd: userDir });

        nodeProcess.stdout.on('data', (data) => {
            ctx.reply(`✅ Node Output:\n${data.toString()}`);
        });

        nodeProcess.stderr.on('data', (data) => {
            ctx.reply(`⚠️ Node Error:\n${data.toString()}`);
        });

        nodeProcess.on('close', (code) => {
            ctx.reply(`Node process exited with code ${code}.`);
            userStates[userId].step = 'done';
        });
    } else {
        ctx.reply('I did not understand that. Please send a valid input.');
    }
});

bot.command('help', (ctx) => {
    ctx.reply(`Commands available:\n\n` +
        `- **/start**: Start the bot.\n` +
        `- **/help**: Show this help message.\n\n` +
        `**Workflow**:\n` +
        `1. Send the repository URL to clone.\n` +
        `2. Automatically install dependencies using \`yarn install\`.\n` +
        `3. Specify the file to run using \`node\`.\n\n` +
        `**Shell Commands**:\n` +
        `- Use \`$<command>\` to execute any shell command in your directory.\n\n` +
        `**Disclaimer**: Use responsibly. Avoid commands that may damage your system.`);
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
