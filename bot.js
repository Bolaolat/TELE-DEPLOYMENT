const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { TELEGRAM_API_TOKEN } = require('./config'); // Import the token

// Initialize the bot
const bot = new Telegraf(TELEGRAM_API_TOKEN);

// Store user states
const userStates = {};

// Welcome message
bot.start((ctx) => {
    const userId = ctx.message.from.id;
    const userDir = path.join(__dirname, 'users', String(userId)); // Directory path for the user

    // Ensure the user's directory exists
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    userStates[userId] = { step: 'ask_repo' }; // Set the user state
    ctx.reply('Welcome! Please send me the repository URL you want to clone.');
});

// Handle text messages
bot.on('text', (ctx) => {
    const userId = ctx.message.from.id;
    const userDir = path.join(__dirname, 'users', String(userId)); // Directory path for the user
    const userState = userStates[userId] || { step: 'ask_repo' }; // Default state

    const message = ctx.message.text.trim();

    if (userState.step === 'ask_repo') {
        // Step 1: Clone the repository
        const repoUrl = message;
        ctx.reply(`Cloning the repository from: ${repoUrl}...`);

        exec(`git clone ${repoUrl} .`, { cwd: userDir }, (error, stdout, stderr) => {
            console.log(`[USER ${userId}] Cloning repository: ${repoUrl}`);
            if (error) {
                console.error(`[USER ${userId}] Clone Error:\n${stderr}`);
                return ctx.reply(`❌ Error cloning the repository:\n${stderr}`);
            }
            console.log(`[USER ${userId}] Clone Output:\n${stdout}`);
            ctx.reply(`✅ Repository cloned successfully:\n${stdout}`);
            userStates[userId].step = 'install_dependencies';
            ctx.reply('Installing dependencies using `yarn install`...');

            // Run `yarn install`
            exec(`yarn install`, { cwd: userDir }, (installError, installStdout, installStderr) => {
                console.log(`[USER ${userId}] Running 'yarn install'...`);
                if (installError) {
                    console.error(`[USER ${userId}] Yarn Install Error:\n${installStderr}`);
                    return ctx.reply(`❌ Error installing dependencies:\n${installStderr}`);
                }
                console.log(`[USER ${userId}] Yarn Install Output:\n${installStdout}`);
                ctx.reply(`✅ Dependencies installed successfully:\n${installStdout}`);
                userStates[userId].step = 'ask_file';
                ctx.reply('Now, send me the name of the file to run using `node`.');
            });
        });
    } else if (userState.step === 'ask_file') {
        // Step 2: Run the specified file
        const filename = message;
        const filePath = path.join(userDir, filename);

        if (!fs.existsSync(filePath)) {
            console.error(`[USER ${userId}] File not found: ${filename}`);
            return ctx.reply('❌ The specified file does not exist. Please try again.');
        }

        ctx.reply(`Running the file: ${filename}...`);
        console.log(`[USER ${userId}] Running file: ${filename}`);
        exec(`node ${filename}`, { cwd: userDir }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[USER ${userId}] File Execution Error:\n${stderr}`);
                return ctx.reply(`❌ Error running the file:\n${stderr}`);
            }
            console.log(`[USER ${userId}] File Execution Output:\n${stdout}`);
            ctx.reply(`✅ File executed successfully:\n${stdout}`);
            userStates[userId].step = 'done'; // Reset the state
        });
    } else {
        ctx.reply('I did not understand that. Please send a valid input.');
    }
});

// Help command
bot.command('help', (ctx) => {
    ctx.reply(`Commands available:\n\n` +
        `- **/start**: Start the bot.\n` +
        `- **/help**: Show this help message.\n\n` +
        `**Workflow**:\n` +
        `1. Send the repository URL to clone.\n` +
        `2. Automatically install dependencies using \`yarn install\`.\n` +
        `3. Specify the file to run using \`node\`.\n\n` +
        `**Disclaimer**: Use responsibly. Avoid commands that may damage your system.`);
});

// Launch the bot
bot.launch()
    .then(() => {
        console.log('Bot is running...');
    })
    .catch((err) => {
        console.error('Error launching bot:', err);
    });

// Graceful stop for the bot
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));