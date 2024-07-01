const { MessageEmbed, WebhookClient } = require('discord.js')
const MAX_MESSAGE_LENGTH = 45

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

  const changeLog = getChangeLog(repo, branch, commits, size);

  return new MessageEmbed()
    .setColor(0x00bb22)
    //.setURL(url)
    .setAuthor({
      name: `${size} ${
        size === 1 ? 'commit was' : 'commits were'
      } added to ${changeLog[0]}/${changeLog[1]}`,
      iconURL: latest.author.avatar,
    })
    .setDescription(`${changeLog[2]}`)
    .setTimestamp(Date.parse(latest.timestamp))
    .setFooter({
      text: `⚡ Edited by @${latest.author.username}`
    })
}

function getChangeLog(repo, branch, commits, size) {
  let changelog = '';

  let obfuscated = false;

  for (const i in commits) {
    const commit = commits[i];
    let message = commit.message;
    if (message.startsWith('%')) {
      obfuscated = true;
      branch = obfuscateMessage(branch);
      repo = obfuscateMessage(repo);
    }
  }

  for (const i in commits) {
    if (i > 8) {
      changelog += `+ ${size - i} more...\n`;
      break;
    }



    const commit = commits[i];
    const sha = commit.id.substring(0, 6);
    let message = commit.message;

    // obfuscate message if it starts with '%'
    if (obfuscated) {
      message = obfuscateMessage(message);

      // replace spaces with '▌'
      message = message.replace(/ /g, '▌');
    }
    
    if (message.length > MAX_MESSAGE_LENGTH) {
      message = message.substring(0, MAX_MESSAGE_LENGTH) + '...';
    }

    if(obfuscated) {
      changelog += `\`${sha}\` — ${message}\n`;
    } else {
      changelog += `\`${sha}\` — ${message}\n`;
      //changelog += `[\`${sha}\`](${commit.url}) — ${message}\n`;
    }
  }

  return [repo, branch, changelog];
}


// Function to obfuscate message starting with '%'
function obfuscateMessage(message) {
  const specialChars = ['▄', '▅', '▇', '█', '▉'];
  let obfuscatedMessage = '';

  for (let i = 0; i < message.length; i++) {
    const char = message.charAt(i);
    if (char === ' ') {
      // If the character is a space, append it unchanged (we change it later)
      obfuscatedMessage += ' ';
    } else {
      // Pick a random index from specialChars for each non-space character encountered
      const randomIndex = Math.floor(Math.random() * specialChars.length);
      obfuscatedMessage += specialChars[randomIndex];
    }
  }

  return obfuscatedMessage;
}
