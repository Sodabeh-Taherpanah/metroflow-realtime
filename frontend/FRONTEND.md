# Frontend Architecture

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   ├── loading.tsx         # Loading UI
│   ├── globals.css         # Global styles
│   └── api/               # API routes
├── components/             # Reusable components
│   ├── ui/                # ShadCN UI components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ErrorBoundary.tsx
│   └── SEO.tsx
├── core/                   # Core logic
│   ├── types.ts           # TypeScript interfaces
│   ├── constants.ts       # App constants
│   ├── utils.ts           # Utility functions
│   ├── sentry.ts          # Sentry config
│   └── index.ts           # Exports
├── modules/               # Feature modules
│   ├── transport/
│   ├── maps/
│   └── realtime/
├── providers/             # Context providers
│   ├── ThemeProvider.tsx
│   ├── ReactQueryProvider.tsx
│   └── index.ts
└── public/               # Static assets
```

## Key Libraries

### Data Management

- **React Query**: Server state management
- **Zod**: Runtime validation
- **WebSocket**: Real-time updates

### UI & Styling

- **Tailwind CSS v4**: Utility-first styling
- **ShadCN UI**: Component library
- **Lucide React**: Icons

### Deployment

- **Vercel**: Frontend hosting
- **Vercel Analytics**: Performance monitoring
- **Sentry**: Error tracking

## Development Workflow

1. Create feature branch
2. Run `npm run dev` to start dev server
3. Make changes
4. Run `npm run lint` and `npm run format`
5. Push and create PR
6. GitHub Actions runs CI/CD
7. Deploy to Vercel on merge

## Best Practices

- Use absolute imports (`@/...`)
- Follow TypeScript strict mode
- Use React Query for API calls
- Validate input with Zod
- Handle errors with Error Boundary
- Use dark mode provider
