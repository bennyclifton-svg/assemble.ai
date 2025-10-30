# Assemble.ai - Construction Project Management Platform

A modern, hierarchical construction project management application built with Next.js 15, React 19, and PostgreSQL.

## Overview

Assemble.ai is a comprehensive construction project management platform that organizes complex projects using a three-tier data architecture. The system provides intuitive navigation, real-time updates, document management, and consultant coordination tools designed specifically for construction workflows.

## Key Features

### 🏗️ Three-Tier Data Architecture
- **Cards (Tier 1)**: Top-level project phases and functional areas
  - 5 Core Cards: Plan, Scheme, Detail, Procure, Deliver
  - Cross-functional Cards: Consultants, Contractors
  - Control Cards: Documents, Regulation
- **Sections (Tier 2)**: Categorized groupings within each card
- **Items (Tier 3)**: Individual tasks, deliverables, or data points

### 📊 Multi-Card Layout System
- **Triple-Card Display**: View up to 3 cards simultaneously (Core + Cross + Control)
- **Side-by-Side Layout**: Default horizontal arrangement for maximum screen utilization
- **Responsive Grid**: Automatically adjusts between 1, 2, or 3 column layouts
- **Independent Card Selection**: Select one from each category independently

### 👥 Consultant Management
- **Tab-Based Navigation**: Horizontal tabs for switching between consultant types (Acoustic, Arborist, Structural, etc.)
- **Dynamic Content**: Each consultant tab displays dedicated sections (Firms, Background, Service Brief, Deliverables, etc.)
- **Data Isolation**: Unique context for each consultant type
- **Auto-Population**: Consultants automatically populated from "Consultant List" sections

### 📁 Document Management System
- **Integrated DMS**: Full-featured document management within Documents card
- **Folder Structure**: 6 default folders (All Documents, Plan, Scheme, Detail, Procure, Deliver)
- **Tag-Based Organization**: Files categorized using tags for flexible organization
- **File Operations**: Upload, preview (PDF/images), download, metadata editing
- **Security**: Virus scanning, signed URLs, MIME type validation
- **Search**: Full-text search across file names, descriptions, and extracted PDF content

### ⚡ Real-Time Updates
- **Instant Sidebar Refresh**: New sections and items appear immediately without page reload
- **Parent-Child Synchronization**: Store maintains referential integrity across hierarchy
- **Optimistic Updates**: UI updates immediately while background sync completes
- **Auto-Refresh**: Document list refreshes every 5 seconds for scan status updates

### 🎨 Modern UI/UX
- **Semi-Transparent Headers**: Card headers with 90% opacity for reduced visual weight
- **Gradient Themes**: Unique color gradients for each card type
  - Core: Blue → Purple
  - Cross: Purple → Blue
  - Control: Amber → Orange
- **Compact Sidebar**: 288px width (10% reduction) for more content space
- **Dark Mode**: Full dark theme support across entire application
- **Responsive Design**: Optimized for desktop and tablet devices

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.6 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 (JIT mode)
- **State Management**: Zustand 5.0.3
- **Drag & Drop**: @dnd-kit/core
- **Build Tool**: Turbopack (Next.js built-in)
- **TypeScript**: 5.9 (strict mode)

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 6
- **API**: RESTful architecture
- **File Storage**: AWS S3 + local filesystem fallback
- **Security**: ClamAV virus scanning

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Code Quality**: Prettier (recommended)
- **Git**: Version control

## Project Structure

```
agent-os/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   │   ├── Card.tsx        # Main card component
│   │   ├── Section.tsx     # Section component
│   │   ├── Item.tsx        # Item component
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   ├── ProjectView.tsx # Main content area
│   │   ├── consultant/     # Consultant management
│   │   ├── documents/      # Document card integration
│   │   ├── files/          # File management (DMS)
│   │   └── sidebar/        # Sidebar components
│   ├── lib/                # Utilities and state
│   │   ├── store.ts        # Main Zustand store
│   │   ├── viewStore.ts    # View state management
│   │   ├── api-client.ts   # API client
│   │   └── types.ts        # TypeScript types
│   └── public/             # Static assets
│
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── index.ts        # Server entry
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── migrations/     # Database migrations
│   │   └── seed.ts         # Seed data
│   └── uploads/            # Local file storage
│
├── specs/                   # Feature specifications
│   ├── 001-three-tier-architecture/
│   └── 002-document-management/
│
└── docs/                    # Additional documentation
    ├── UI-ARCHITECTURE.md
    ├── DESIGN-SYSTEM.md
    ├── REAL-TIME-UPDATES.md
    ├── FEATURES.md
    ├── COMPONENT-LIBRARY.md
    ├── CONSULTANT-MANAGEMENT.md
    └── DOCUMENT-MANAGEMENT-INTEGRATION.md
```

## Getting Started

### Prerequisites
- Node.js 20 or higher
- PostgreSQL 15 or higher
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd assemble.ai/agent-os
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Set up environment variables**

Backend (`.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/assemble_db"
PORT=3001
STORAGE_TYPE=local  # or 's3' for production
```

Frontend (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. **Initialize database**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. **Start development servers**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

6. **Open application**
Navigate to `http://localhost:3000` in your browser.

## Usage

### Creating a Project
1. The application loads with a default project
2. Navigate using the sidebar to access different cards
3. Click cards to expand and view sections

### Managing Content
- **Add Section**: Click the "+" icon on any card header
- **Add Item**: Click the "+" icon on any section
- **Edit Content**: Click directly on any text to edit inline
- **Delete**: Click the trash icon or select multiple items and use bulk delete

### Consultant Management
1. Click "Consultants" in the sidebar
2. Select a consultant type from the horizontal tabs
3. View/edit consultant-specific content in sections below

### Document Management
1. Click "Documents" in the sidebar
2. Select a folder tab (Plan, Scheme, Detail, etc.)
3. Drag & drop files or click to browse
4. Click files to preview, download, or edit metadata

### Multi-Card Layout
- Application defaults to showing 3 cards side-by-side
- Click any card in the sidebar to select it
- Toggle layout mode using the header button (if needed)

## Architecture

### State Management
The application uses two primary Zustand stores:

1. **Main Store** (`store.ts`): Data entities (cards, sections, items, files)
2. **View Store** (`viewStore.ts`): UI state (selected cards, layout mode, expansion states)

### Data Flow
```
User Action → Component → Store Action → API Call → Store Update → Component Re-render
```

### Real-Time Updates
- Add/delete operations update both normalized stores AND parent relationship arrays
- React hooks automatically trigger re-renders when parent arrays change
- No manual refresh required

## Key Components

### Layout Components
- **Sidebar**: Navigation with card groups
- **ProjectView**: Main content area with multi-card layout
- **Header**: Top navigation with branding and layout toggle

### Card Components
- **Card**: Generic card container with conditional rendering
- **ConsultantCardTabs**: Tab navigation for consultants
- **DocumentsCardContent**: DMS integration with folder navigation

### File Management
- **DocumentSection**: Complete DMS interface
- **FileUploadZone**: Drag & drop upload
- **FileList**: File listing with actions
- **FilePreview**: Modal preview for PDFs/images

### Utility Components
- **CardGroup**: Sidebar card grouping
- **CardItem**: Individual card in sidebar
- **SectionItem**: Section in sidebar
- **InlineEdit**: Click-to-edit component

## Testing

### Frontend
```bash
cd frontend
npm run test
```

### Backend
```bash
cd backend
npm run test
```

## Documentation

- **[UI Architecture](./UI-ARCHITECTURE.md)**: Component hierarchy and state management
- **[Design System](./DESIGN-SYSTEM.md)**: Visual design standards and color palette
- **[Real-Time Updates](./REAL-TIME-UPDATES.md)**: Update mechanism and store patterns
- **[Features](./FEATURES.md)**: Complete feature inventory
- **[Component Library](./COMPONENT-LIBRARY.md)**: Component reference
- **[Consultant Management](./docs/CONSULTANT-MANAGEMENT.md)**: Consultant system documentation
- **[Document Management](./docs/DOCUMENT-MANAGEMENT-INTEGRATION.md)**: DMS integration guide
- **[Spec 001](./specs/001-three-tier-architecture/spec.md)**: Three-tier architecture specification
- **[Spec 002](./specs/002-document-management/spec.md)**: Document management specification

## Performance

- **Initial Load**: < 2 seconds
- **Card Navigation**: < 100ms
- **File Upload**: Progress tracking for all sizes
- **Search**: Results in < 500ms for 100+ documents
- **Auto-Save**: 500ms debounce on content changes

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[License information to be added]

## Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ for construction professionals**
