import '../../loadEnvironment';
import axios from 'axios';

const backendNotifications = process.env.SLACK_BACKEND_NOTIFICATIONS_WEBHOOK_URL;
const whatsMessagesWebhook = process.env.SLACK_WHATS_MESSAGES_WEBHOOK_URL;

export default async function notifySlack(message: string, channel?: 'whatsapp_messages') {
  let channelWebhook = backendNotifications;

  if (channel === 'whatsapp_messages') channelWebhook = whatsMessagesWebhook;
  try {
    await axios.post(channelWebhook, { text: message });
  } catch (error) {
    console.error('Error sending notification to Slack:', error.message);
  }
}
