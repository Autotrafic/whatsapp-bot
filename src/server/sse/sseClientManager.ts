import { Response } from 'express';

class SSEClientManager {
  private clients: Response[] = [];

  addClient(res: Response): void {
    this.clients.push(res);
    console.info('Client added. Total clients:', this.clients.length);
  }

  removeClient(res: Response): void {
    this.clients = this.clients.filter((client) => client !== res);
    console.info('Client removed. Total clients:', this.clients.length);
  }

  broadcast(eventType: string, data: object): void {
    if (this.clients.length === 0) {
      console.info('No active SSE clients.');
      return;
    }

    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      client.write(`event: ${eventType}\n`);
      client.write(`data: ${message}\n\n`);
    });

    console.info(`Broadcasted event: ${eventType}, to ${this.clients.length} clients.`);
  }
}

export default new SSEClientManager();
