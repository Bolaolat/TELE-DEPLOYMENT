const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Replace with your bot token
const bot = new Telegraf('7849087949:AAHEuYKeENyVhDMGRoh2bbkp_zJOdqnJ2zA');

// Store the code temporarily
let codeBuffer = '';

// Start command
bot.start((ctx) => {
    ctx.reply('Welcome! This bot can execute shell commands, save code to files, and run saved files. Use responsibly.');
});

// Capture code sent by the user
bot.on('text', (ctx) => {
    const message = ctx.message.text;

    if (message.startsWith('/save ')) {
        // Save code to a file
        const filename = message.slice(6).trim();

        if (!filename) {
            return ctx.reply('❌ Please provide a valid filename after "/save". Example: /save index.js');
        }

        const filePath = path.join(__dirname, filename);
        fs.writeFile(filePath, codeBuffer, (err) => {
            if (err) {
                return ctx.reply(`❌ Error saving file: ${err.message}`);
            }
            ctx.reply(`✅ Code saved to ${filename}`);
            codeBuffer = ''; // Clear buffer after saving
        });
    } else if (message.startsWith('/run ')) {
        // Run a saved file
        const filename = message.slice(5).trim();

        if (!filename) {
            return ctx.reply('❌ Please provide a valid filename after "/run". Example: /run index.js');
        }

        const filePath = path.join(__dirname, filename);

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                return ctx.reply(`❌ File ${filename} does not exist.`);
            }

            exec(`node ${filePath}`, (error, stdout, stderr) => {
                if (error) {
                    return ctx.reply(`❌ Error: ${error.message}`);
                }
                if (stderr) {
                    return ctx.reply(`⚠️ Stderr: ${stderr}`);
                }
                ctx.reply(`✅ Output:\n${stdout}`);
            });
        });
    } else if (message.startsWith('/exec ')) {
        // Execute shell command
        const shellCommand = message.slice(6).trim();

        if (!shellCommand) {
            return ctx.reply('❌ Please provide a shell command after "/exec". Example: /exec ls -la');
        }

        exec(shellCommand, (error, stdout, stderr) => {
            if (error) {
                return ctx.reply(`❌ Error: ${error.message}`);
            }
            if (stderr) {
                return ctx.reply(`⚠️ Stderr: ${stderr}`);
            }
            ctx.reply(`✅ Command Output:\n${stdout}`);
        });
    } else if (message.startsWith('/npm-install ')) {
        // Run npm install in the specified path
        const installPath = message.slice(13).trim();

        if (!installPath) {
            return ctx.reply('❌ Please provide a valid path after "/npm-install". Example: /npm-install ./my-project');
        }

        const fullPath = path.resolve(__dirname, installPath);

        fs.access(fullPath, fs.constants.F_OK, (err) => {
            if (err) {
                return ctx.reply(`❌ Path ${installPath} does not exist.`);
            }

            exec(`npm install`, { cwd: fullPath }, (error, stdout, stderr) => {
                if (error) {
                    return ctx.reply(`❌ Error during npm install: ${error.message}`);
                }
                if (stderr) {
                    return ctx.reply(`⚠️ Stderr during npm install: ${stderr}`);
                }
                ctx.reply(`✅ npm install completed in ${installPath}:\n${stdout}`);
            });
        });
    } else {
        // Capture code for saving
        codeBuffer += message + '\n'; // Append new code to the buffer
        ctx.reply('✅ Code captured. Send /save <filename> to save it, /run <filename> to execute it, /exec <command> to run shell commands, or /npm-install <path> to install packages.');
    }
});

// Launch the bot
bot.launch()
    .then(() => {
        console.log('Terminal bot is running...');
    })
    .catch((err) => {
        console.error('Error launching bot:', err);
    });

// Graceful stop for the bot
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));