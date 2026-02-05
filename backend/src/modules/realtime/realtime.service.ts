import { Injectable } from "@nestjs/common";

@Injectable()
export class RealtimeService {
  subscriptions = new Map<string, Set<string>>();

  subscribe(channel: string, clientId: string) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)?.add(clientId);
  }

  unsubscribe(channel: string, clientId: string) {
    this.subscriptions.get(channel)?.delete(clientId);
  }

  getSubscribers(channel: string): string[] {
    return Array.from(this.subscriptions.get(channel) || []);
  }
}
