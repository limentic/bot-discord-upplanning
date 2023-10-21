import {
  Client,
  GatewayIntentBits,
  AttachmentBuilder,
  MessagePayload,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  ComponentType,
} from 'discord.js'

export class DiscordService {
  private client: Client
  private readyPromise: Promise<void>

  constructor() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    })

    this.readyPromise = new Promise((resolve) => {
      this.client.once('ready', () => {
        console.log(`Logged in as ${this.client.user?.tag}!`)
        resolve()
      })
    })

    this.client.login(process.env.BOT_TOKEN)
  }

  async isReady(): Promise<void> {
    return this.readyPromise
  }

  async sendMessage(channelId: string, message: string, attachment?: Buffer) {
    const channel = this.client.channels.cache.get(channelId)

    if (channel?.isTextBased()) {
      if (attachment) {
        const attachmentMessage = new AttachmentBuilder(attachment, { name: 'edt.png' })
        const payload = new MessagePayload(channel, { content: message, files: [attachmentMessage] })
        await channel.send(payload)
      } else {
        await channel.send(message)
      }
    } else {
      console.error(`Channel with ID ${channelId} is not a text channel.`)
    }
  }

  async deleteMessage(channelId: string, messageId: string) {
    const channel = this.client.channels.cache.get(channelId)

    if (channel?.isTextBased()) {
      await channel.messages.delete(messageId)
    } else {
      console.error(`Channel with ID ${channelId} is not a text channel.`)
    }
  }

  async getLastMessage(channelId: string) {
    const channel = this.client.channels.cache.get(channelId)

    if (channel?.isTextBased()) {
      const messages = await channel.messages.fetch({ limit: 1 })
      return messages.first()
    } else {
      console.error(`Channel with ID ${channelId} is not a text channel.`)
    }
  }
}
