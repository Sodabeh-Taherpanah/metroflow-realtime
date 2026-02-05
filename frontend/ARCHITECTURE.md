# MetroFlow - Project Architecture (Day 2)

## Overview

This document outlines the domain-driven architecture foundation for MetroFlow.

## Directory Structure

```
frontend/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout with theme & metadata
│   ├── page.tsx        # Home page
│   ├── loading.tsx     # Global loading UI
│   └── globals.css     # Global styles & theme
│
├── components/          # Shared UI components
│   ├── Header.tsx      # Navigation header with theme toggle
│   ├── Footer.tsx      # Footer with links
│   ├── SEO.tsx         # SEO metadata component
│   ├── ErrorBoundary.tsx # Error handling
│   └── index.ts        # Component exports
│
├── core/               # Domain models & utilities
│   ├── types.ts        # Core TypeScript interfaces
│   ├── constants.ts    # Global constants
│   └── index.ts        # Core exports
│
├── modules/            # Feature modules (domain-driven)
│   └── README.md       # Module guidelines
│
├── providers/          # Context providers
│   ├── ThemeProvider.tsx # Dark/light theme management
│   └── index.ts        # Provider exports
│
├── public/             # Static assets
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies
└── next.config.ts      # Next.js configuration
```

## Key Features Implemented

### 1. **Domain-Driven Folder Structure**

- `core/` - Business logic, types, and constants
- `modules/` - Feature-based modules for scalability
- `providers/` - React context providers
- `components/` - Reusable UI components

### 2. **Global Layout & Components**

- ✅ Header with navigation and theme toggle
- ✅ Footer with multi-column layout
- ✅ Error boundary with detailed error display
- ✅ SEO component for metadata management

### 3. **Theme System**

- Dark/light mode toggle in header
- Persistent theme preference (localStorage)
- CSS variables for consistent theming
- Tailwind dark mode support

### 4. **Loading & Error UI**

- Smooth loading spinner animation
- Error boundary with development error details
- Responsive error dialog
- Refresh functionality

### 5. **Metadata System (Next.js Metadata API)**

- Centralized metadata in layout.tsx
- Open Graph support for social sharing
- Twitter card support
- Extensible SEO component

### 6. **Responsive Design**

- Mobile-first approach
- Tailwind CSS utilities
- Dark mode support across all components
- Accessible navigation

## Theme Configuration

### CSS Variables

Located in `app/globals.css`:

- Colors: primary, secondary, background, text, borders, status
- Typography: fonts, sizes
- Spacing: consistent scale
- Border radius: standardized

### Dark Mode

- Automatic system preference detection
- Manual toggle via header button
- Persistent user preference
- Smooth transitions

## TypeScript Support

- Core types defined in `core/types.ts`
- Full type safety across components
- Interfaces for API responses and domain models

## Next Steps (Day 3+)

1. Create API integration layer in core/
2. Build feature modules (transport data, real-time updates)
3. Add form components and validation
4. Implement authentication
5. Create data visualization components
