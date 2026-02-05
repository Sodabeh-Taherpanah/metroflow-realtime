"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentryService = void 0;
const common_1 = require("@nestjs/common");
const Sentry = require("@sentry/node");
let SentryService = class SentryService {
    constructor() {
        this.initializeSentry();
    }
    initializeSentry() {
        if (process.env.SENTRY_DSN) {
            Sentry.init({
                dsn: process.env.SENTRY_DSN,
                environment: process.env.NODE_ENV,
                tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
                integrations: [],
            });
        }
    }
    captureException(error, context) {
        if (process.env.SENTRY_DSN) {
            Sentry.captureException(error, {
                contexts: { custom: context },
            });
        }
    }
    captureMessage(message, level = 'info') {
        if (process.env.SENTRY_DSN) {
            Sentry.captureMessage(message, level);
        }
    }
    setUserContext(userId, email) {
        if (process.env.SENTRY_DSN) {
            Sentry.setUser({
                id: userId,
                email,
            });
        }
    }
    clearUserContext() {
        if (process.env.SENTRY_DSN) {
            Sentry.setUser(null);
        }
    }
    addBreadcrumb(message, category, level = 'info', data) {
        if (process.env.SENTRY_DSN) {
            Sentry.addBreadcrumb({
                message,
                category,
                level,
                data,
            });
        }
    }
};
exports.SentryService = SentryService;
exports.SentryService = SentryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SentryService);
//# sourceMappingURL=sentry.service.js.map