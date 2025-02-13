import chalk from 'chalk';
import { Client, RemoteAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import MongoStore from '../types/MongoStore';
import notifySlack from '../server/services/notifier';
import sseClientManager from '../server/sse/sseClientManager';
import { parseMessageFromPrimitive } from '../server/helpers/parser';

const clientId = 'autotrafic-session';

let whatsappClient: any = null;

const connectWhatsapp = () =>
  new Promise((resolve, reject) => {
    try {
      const store = new MongoStore();

      const client = new Client({
        authStrategy: new RemoteAuth({
          clientId,
          store,
          backupSyncIntervalMs: 300000,
        }),
        restartOnAuthFail: true,
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--single-process',
            '--no-zygote',
          ],
        },
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
      });

      whatsappClient = client;

      try {
        client.initialize();
        console.info('[WhatsApp]: Authenticating client...\n');
      } catch (error) {
        console.error('[WhatsApp]: Failed to authenticate. Retrying...');
        console.info(error.message);
      }
    } catch (error) {
      if (error) {
        console.log(chalk.bgRed.white('An error occurred connecting with database', error.message));
        reject(error);
      }
    }

    whatsappClient.on('qr', (qr: string) => {
      notifySlack('WHATSAPP BOT DISCONNECTED!');
      qrcode.generate(qr, { small: true });
    });

    whatsappClient.on('remote_session_saved', () => {
      console.info('[WhatsApp]: Session stored successfully on database');
    });

    whatsappClient.on('ready', () => {
      console.info('[WhatsApp]: Client is ready');
      resolve(true);
    });

    whatsappClient.on('authenticated', async () => {
      console.info(`[WhatsApp]: Authenticated.`);
    });

    whatsappClient.on('auth_failure', (message: string) => {
      const error = `[WhatsApp]: Error while trying to restore an existing session. ${message}`;

      console.info(error);
    });

    whatsappClient.on('disconnected', (reason: string) => {
      const error = `[WhatsApp]: Client has been disconnected. ${reason}`;

      console.info(error);
    });

    whatsappClient.on('message', async (message: any) => {
      if (sseClientManager['clients'].length > 0) {
        const parsedMessage = await parseMessageFromPrimitive(message);

        sseClientManager.broadcast('whatsapp-message', parsedMessage);
      }
    });
  });

export { connectWhatsapp, whatsappClient };
