import { ConfigService } from '@nestjs/config';
export declare class SecurityMiddlewareService {
    private configService;
    constructor(configService: ConfigService);
    getCSPHeader(): string;
    getSecurityHeaders(): Record<string, string>;
    getCORSConfig(): {
        origin: string[];
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
    };
}
