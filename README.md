# Quiz App Monorepo

A real-time quiz application system with React Native client support and web dashboard.

## Architecture

- **Backend**: Node.js + Express + Socket.io + TypeScript
- **Dashboard**: React + TypeScript + Socket.io-client  
- **Database**: Appwrite
- **Real-time**: Socket.io

## Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- Appwrite account and project

### Installation

1. Clone and install dependencies:
```bash
npm run install:all
```

2. Set up environment variables (see setup guides below)

3. Start development servers:
```bash
npm run dev
```

This starts both backend (port 3001) and dashboard (port 3000).

## Project Structure

```
quiz-app-back/
├── packages/
│   ├── backend/          # Express API + Socket.io
│   ├── dashboard/        # React admin dashboard
│   └── shared/          # Shared types and utilities
├── docs/                # API documentation
└── README.md
```

## Setup Guides

- [Appwrite Setup](./docs/APPWRITE_SETUP.md)
- [Backend Setup](./packages/backend/README.md)
- [Dashboard Setup](./packages/dashboard/README.md)
- [API Documentation](./docs/API.md)

## Development

- `npm run dev` - Start all services
- `npm run build` - Build all packages
- `npm run dev:backend` - Start only backend
- `npm run dev:dashboard` - Start only dashboard

## Environment Variables

See individual package README files for specific environment variables required.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
