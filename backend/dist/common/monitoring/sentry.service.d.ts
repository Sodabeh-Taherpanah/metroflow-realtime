export declare class SentryService {
    constructor();
    private initializeSentry;
    captureException(error: Error | unknown, context?: Record<string, any>): void;
    captureMessage(message: string, level?: 'fatal' | 'error' | 'warning' | 'info'): void;
    setUserContext(userId: string, email?: string): void;
    clearUserContext(): void;
    addBreadcrumb(message: string, category: string, level?: 'fatal' | 'error' | 'warning' | 'info', data?: Record<string, any>): void;
}
