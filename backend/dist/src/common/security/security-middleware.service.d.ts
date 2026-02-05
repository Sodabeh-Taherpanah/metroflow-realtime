export declare class SecurityMiddlewareService {
    constructor();
    getCSPHeader(): string;
    getSecurityHeaders(): Record<string, string>;
    getCORSConfig(): {
        origin: string[];
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
    };
}
