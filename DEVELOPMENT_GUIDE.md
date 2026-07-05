# Idea Vault Development Guide

## Overview
This document provides detailed information for developers working on the Idea Vault project, including setup instructions, architecture overview, and development workflows.

## Project Structure

```
idea_vault/
├── api/                     # Vercel Serverless Functions
│   ├── health.ts            # Health check endpoint
│   └── ideas/               # Ideas API endpoints
│       ├── index.ts         # GET, POST, DELETE (all ideas)
│       └── [id].ts          # GET, PUT, DELETE (single idea)
├── src/                     # React/Vite Frontend Application
│   ├── components/          # Reusable UI Components
│   │   ├── IdeaCard.tsx     # Individual idea display & controls
│   │   ├── IdeaForm.tsx     # Form for creating/editing ideas
│   │   └── LoginPage.tsx    # Authentication page
│   ├── lib/                 # Utility & Service Modules
│   │   ├── ideasApi.ts      # API client wrapper for ideas
│   │   └── supabase.ts      # Supabase client initialization
│   ├── App.tsx              # Main application component
│   ├── index.css            # Tailwind CSS configuration & custom styles
│   ├── main.tsx             # React entry point
│   └── types.ts             # TypeScript interfaces & types
├── public/                  # Static assets
├── .env.local               # Environment variables (local development)
├── .env.example             # Template for environment variables
├── server.ts                # Local development server (Express + Vite)
├── vercel.json              # Vercel deployment configuration
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies & scripts
└── README.md                # Project overview (this file)
```

## Technology Stack

### Frontend
- **React 19** - UI library
- **Vite 6** - Build tool & development server
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **Motion** - Animation library
- **Lucide React** - Icon set
- **Supabase JS Client** - Database & authentication

### Backend/Infrastructure
- **Supabase** - PostgreSQL database, authentication, and storage
- **Vercel** - Platform for hosting (serverless functions & static site)
- **Express.js** - Local development server (not used in production)

## Environment Setup

### Required Environment Variables
Create a `.env.local` file in the root directory with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note**: The `VITE_` prefix exposes variables to the client-side code. The non-prefixed variables are used by the server-side API routes.

### Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Enable email/password authentication (or preferred providers)
3. Create the `ideas` table:

```sql
create table ideas (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  category text not null,
  color text default 'cyan',
  created_at timestamp with time zone default timezone('utc' now()) not null,
  updated_at timestamp with time zone default timezone('utc' now()) not null,
  is_pinned boolean default false,
  user_id uuid references auth.users not null
);

-- Enable Row Level Security
alter table ideas enable row level security;

-- Create policies for user-specific access
create policy "Users can view their own ideas"
  on ideas for select
  using (auth.uid() = user_id);

create policy "Users can insert their own ideas"
  on ideas for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own ideas"
  on ideas for update
  using (auth.uid() = user_id);

create policy "Users can delete their own ideas"
  on ideas for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index idx_ideas_user_id on ideas(user_id);
create index idx_ideas_created_at on ideas(created_at);
create index idx_ideas_category on ideas(category);
```

## Development Workflow

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   - Starts Express server with Vite middleware at `http://localhost:3000`
   - Hot Module Replacement (HMR) enabled for fast development
   - Environment variables loaded from `.env.local`

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - TypeScript type checking
- `npm run test` - Run tests (if configured)

## Architecture Overview

### Data Flow
1. **User Interaction** → React Components
2. **Components** → `lib/ideasApi.ts` (API wrapper)
3. **API Wrapper** → HTTP requests to `/api/ideas/*` endpoints
4. **API Endpoints** → Supabase database operations
5. **Database** → Persistent storage of ideas

### State Management
- **React Context/Hooks**: Authentication state managed in `App.tsx`
- **Local State**: Idea lists, UI state (filters, search, etc.) managed with `useState`/`useReducer`
- **Server State**: Ideas data fetched from and persisted to Supabase

### Styling Approach
- **Tailwind CSS**: Utility-first styling with custom configuration in `tailwind.config.js` (inherited via `@tailwindcss/vite` plugin)
- **Custom CSS**: Base styles and animations in `src/index.css`
- **Component Scoping**: Styles are globally scoped but designed to be component-specific through naming conventions

## API Endpoints

### Health Check
```
GET /api/health
Response: { ok: true, supabaseConfigured: boolean }
```

### Ideas Collection
```
GET /api/ideas?userId={userId}
Response: Idea[]

POST /api/ideas
Body: { title, description, category, color?, createdAt?, updatedAt?, isPinned?, userId? }
Response: Idea

DELETE /api/ideas?userId={userId}
Response: { success: boolean }
```

### Individual Idea
```
GET /api/ideas/{id}
Response: Idea

PUT /api/ideas/{id}
Body: Partial<Idea>
Response: Idea

DELETE /api/ideas/{id}
Body: { userId: string }
Response: { success: boolean }
```

## Deployment

### Vercel Deployment
1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Vercel will automatically:
   - Install dependencies
   - Run `npm run build`
   - Deploy static assets to Vercel Edge Network
   - Deploy API functions as serverless functions

### Local Production Preview
```bash
npm run build
npm run preview
```

## Key Implementation Details

### Authentication
- Uses Supabase Auth (email/password or OAuth providers)
- Auth state managed via `supabase.auth.getSession()` and `onAuthStateChange`
- User ID from auth used to scope all data operations

### Data Modeling
- **Idea Interface** (src/types.ts):
  ```typescript
  interface Idea {
    id: string;
    title: string;
    description: string;
    category: IdeaCategory;
    color: string;
    createdAt: number; // timestamp
    updatedAt: number; // timestamp
    isPinned: boolean;
    userId: string;
  }
  ```

### Error Handling
- API errors propagated through `ideasApi.ts` functions
- UI displays error messages via `cloudError` state in `App.tsx`
- Network failures handled gracefully with user-friendly messages

### Performance Considerations
- **Pagination**: Not implemented for MVP (assumes reasonable number of ideas per user)
- **Optimistic Updates**: UI updates immediately, then reconciles with server response
- **Caching**: Relies on React Query-like patterns in custom hooks (could be enhanced)
- **Bundle Size**: Monitored via build output warnings

## Contributing Guidelines

### Code Style
- Follow existing TypeScript conventions
- Use functional components with hooks
- Follow Tailwind CSS utility-first approach
- Write descriptive commit messages

### Adding Features
1. Create component in `src/components/`
2. Add API functions in `src/lib/ideasApi.ts` if needed
3. Update types in `src/types.ts` if data structures change
4. Connect state and props in `App.tsx` or relevant container component
5. Add styles using Tailwind utility classes

### Testing
- Currently no test framework configured
- Consider adding Vitest/Jest for unit tests
- Consider adding Cypress/Playwright for E2E tests

## Troubleshooting

### Common Issues
1. **Supabase Connection Errors**
   - Check `.env.local` for correct values
   - Verify Supabase project is active
   - Confirm API keys have correct permissions

2. **Build Failures**
   - Check TypeScript errors with `npm run lint`
   - Verify all dependencies installed
   - Check for syntax errors in new code

3. **Runtime Errors**
   - Check browser console for React errors
   - Check network tab for failed API requests
   - Verify Supabase RLS policies allow operations

## Future Enhancements
- [ ] Add pagination for large datasets
- [ ] Implement optimistic UI updates
- [ ] Add unit and integration tests
- [ ] Implement offline support with localStorage sync
- [ ] Add image/file attachments to ideas
- [ ] Implement sharing/collaboration features
- [ ] Add dark/light theme toggle
- [ ] Improve accessibility (ARIA labels, keyboard navigation)
- [ ] Add analytics tracking
- [ ] Implement custom categories per user

## License: Apache-2.0 (this file for more details