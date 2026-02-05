export declare class RealtimeService {
    subscriptions: Map<string, Set<string>>;
    subscribe(channel: string, clientId: string): void;
    unsubscribe(channel: string, clientId: string): void;
    getSubscribers(channel: string): string[];
}
