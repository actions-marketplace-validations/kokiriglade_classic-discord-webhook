const { MessageEmbed, WebhookClient } = require('discord.js')
const MAX_MESSAGE_LENGTH = 40

module.exports.send = (id, token, repo, branch, url, commits, size, threadId) =>
  new Promise((resolve, reject) => {
    let client
    console.log('Preparing Webhook...')
    try {
      if (!id || !token) {
        throw new Error('ID or token is missing')
      }
      client = new WebhookClient({
        id,
        token
      })

      if (threadId) {
        if (isNaN(threadId)) {
          throw new Error('threadId is not a number')
        }
        console.log('Found thread ID')
        client
          .send({
            embeds: [createEmbed(repo, branch, url, commits, size)],
            threadId
          })
          .then(() => {
            console.log('Successfully sent the message!')
            resolve()
          }, reject)
      } else {
        client
          .send({
            embeds: [createEmbed(repo, branch, url, commits, size)]
          })
          .then(() => {
            console.log('Successfully sent the message!')
            resolve()
          }, reject)
      }
    } catch (error) {
      console.log('Error creating Webhook')
      reject(error.message)
    }
  })

function createEmbed (repo, branch, url, commits, size) {
  console.log('Constructing Embed...')
  console.log('Commits :')
  const latest = commits[0]
  console.log({ latest })
  if (!latest) {
    console.log('No commits, skipping...')
    return
  }
  // check if latest.author is undefined, if it is, define username as 'unknown' and avatar as null
  if (!latest.author) {
    latest.author = {
      username: 'unknown',
      avatar: null
    }
  } else {
    latest.author.avatar = `https://github.com/${latest.author.username}.png?size=32`
  }

  const changeLog = getChangeLog(branch, commits, size);

  return new MessageEmbed()
    .setColor(0x00bb22)
    //.setURL(url)
    .setAuthor({
      name: `${size} ${
        size === 1 ? 'commit was' : 'commits were'
      } added to ${changeLog[0]}`,
      iconURL: latest.author.avatar,
    })
    .setDescription(`${changeLog[1]}`)
    .setTimestamp(Date.parse(latest.timestamp))
    .setFooter({
      text: `⚡ Edited by @${latest.author.username}`
    })
}

function getChangeLog(branch, commits, size) {
  let changelog = '';

  for (const i in commits) {
    if (i > 7) {
      changelog += `+ ${size - i} more...\n`;
      break;
    }

    

    const commit = commits[i];
    const sha = commit.id.substring(0, 6);
    let message = commit.message;

    // Obfuscate message if it starts with '%'
    if (message.startsWith('%')) {
      message = obfuscateMessage(message);
      branch = obfuscateMessage(branch);
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      message = message.substring(0, MAX_MESSAGE_LENGTH) + '...';
    }

    // Replace spaces with '▌'
    message = message.replace(/ /g, '▌');

    changelog += `[${sha}](${commit.url}) — ${message}\n`;
  }

  return [branch, changelog];
}


// Function to obfuscate message starting with '%'
function obfuscateMessage(message) {
  const specialChars = ['▋', '▊', '▄', '▅', '▇', '█', '▆', '▉'];
  let obfuscatedMessage = '';

  for (let i = 0; i < message.length; i++) {
    const char = message.charAt(i);
    if(char == ' ') {
      continue;
    }
    if (i < specialChars.length) {
      obfuscatedMessage += message.charAt(i).replace(/./, specialChars[i]);
    } else {
      obfuscatedMessage += char;
    }
  }

  return obfuscatedMessage;
}