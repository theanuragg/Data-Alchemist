# Data Alchemist 🧪✨

An AI-powered data transformation and validation platform built with Next.js and Google Gemini AI. Transform, validate, search, and manage your data with intelligent natural language processing capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [High-Level Architecture](#high-level-architecture)
- [Data Flow Diagram](#data-flow-diagram)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Entity Types](#entity-types)
- [License](#license)

## Overview

**Data Alchemist** is a sophisticated data management tool designed for handling complex datasets involving clients, workers, and tasks. It leverages Google's Gemini AI to provide intelligent features such as:

- **Smart Header Mapping**: Automatically maps uploaded CSV/XLSX headers to expected entity schemas
- **AI-Powered Validation**: Detects data quality issues, business logic violations, and cross-entity relationship problems
- **Natural Language Search**: Query your data using plain English
- **AI Data Modification**: Transform data through natural language instructions
- **Rule Recommendations**: Get AI-suggested business rules based on data patterns

## Features

| Feature | Description |
|---------|-------------|
| 📤 **Multi-Format Upload** | Support for CSV and XLSX file uploads with automatic parsing |
| 🔄 **Smart Header Mapping** | AI-powered column mapping to standardized entity schemas |
| ✅ **Data Validation** | Comprehensive validation including duplicate detection, reference checks, and JSON validation |
| 🔍 **AI Search** | Natural language search across all entity types |
| 🤖 **AI Modify** | Transform data using plain English instructions |
| 📏 **Business Rules** | Create, manage, and get AI recommendations for business rules |
| ⚖️ **Priority Management** | Configurable priority weights with preset options |
| 📊 **Data Preview** | Interactive data tables with inline editing |
| 📥 **Export** | Export data in CSV or XLSX format with rules configuration |

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA ALCHEMIST                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         PRESENTATION LAYER                           │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │  Header   │ │  NavTabs  │ │FileUpload │ │ DataTable │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │Validation │ │  Search   │ │   Rules   │ │ Priority  │           │   │
│  │  │  Panel    │ │  Panel    │ │  Editor   │ │  Editor   │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           API LAYER (Next.js)                        │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐       │   │
│  │  │ /upload │ │/validate │ │/search │ │/modify │ │  /rules  │       │   │
│  │  └─────────┘ └──────────┘ └────────┘ └────────┘ └──────────┘       │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────────┐                       │   │
│  │  │ /export │ │/priorities│ │  /suggestion  │                       │   │
│  │  └─────────┘ └──────────┘ └────────────────┘                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        AI SERVICE LAYER                              │   │
│  │            ┌─────────────────────────────────────┐                   │   │
│  │            │     Google Gemini AI (gemini-2.0)   │                   │   │
│  │            │  • Header Mapping                   │                   │   │
│  │            │  • Data Validation                  │                   │   │
│  │            │  • Natural Language Search          │                   │   │
│  │            │  • Data Modification                │                   │   │
│  │            │  • Rule Generation                  │                   │   │
│  │            └─────────────────────────────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
                                    USER
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
              ┌──────────┐     ┌──────────┐     ┌──────────┐
              │ CSV File │     │XLSX File │     │  Query   │
              └────┬─────┘     └────┬─────┘     └────┬─────┘
                   │                │                │
                   └────────┬───────┘                │
                            │                        │
                            ▼                        │
                    ┌───────────────┐                │
                    │  File Parser  │                │
                    │ (Papa/XLSX)   │                │
                    └───────┬───────┘                │
                            │                        │
                            ▼                        │
                    ┌───────────────┐                │
                    │   AI Header   │                │
                    │    Mapping    │                │
                    │  (Gemini AI)  │                │
                    └───────┬───────┘                │
                            │                        │
                            ▼                        │
                    ┌───────────────┐                │
                    │  Data Store   │◄───────────────┘
                    │   (State)     │
                    │ ┌───────────┐ │
                    │ │  Clients  │ │
                    │ ├───────────┤ │
                    │ │  Workers  │ │
                    │ ├───────────┤ │
                    │ │   Tasks   │ │
                    │ └───────────┘ │
                    └───────┬───────┘
                            │
          ┌─────────┬───────┼───────┬─────────┐
          │         │       │       │         │
          ▼         ▼       ▼       ▼         ▼
    ┌──────────┐ ┌──────┐ ┌────┐ ┌──────┐ ┌────────┐
    │Validation│ │Search│ │Edit│ │Modify│ │ Export │
    │   (AI)   │ │ (AI) │ │    │ │ (AI) │ │        │
    └────┬─────┘ └──┬───┘ └─┬──┘ └──┬───┘ └───┬────┘
         │          │       │       │         │
         ▼          ▼       ▼       ▼         ▼
    ┌──────────┐ ┌──────┐ ┌────┐ ┌──────┐ ┌────────┐
    │Validation│ │Search│ │Data│ │Update│ │CSV/XLSX│
    │  Report  │ │Result│ │Grid│ │Notice│ │+ Rules │
    └──────────┘ └──────┘ └────┘ └──────┘ └────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Next.js 15, TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Icons** | Lucide React |
| **AI/ML** | Google Generative AI (Gemini 2.0) |
| **File Parsing** | PapaParser (CSV), SheetJS (XLSX) |
| **JSON Handling** | JSON5, jsonrepair |
| **Fonts** | Geist (via next/font) |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/theanuragg/Data-Alchemist.git
   cd Data-Alchemist
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
Data-Alchemist/
├── app/
│   ├── api/                    # API Routes
│   │   ├── upload/             # File upload & AI header mapping
│   │   ├── validate/           # Data validation (core + AI)
│   │   ├── search/             # Natural language search
│   │   ├── modify/             # AI-powered data modification
│   │   ├── rules/              # Business rules management
│   │   ├── priorities/         # Priority weights management
│   │   ├── export/             # Data export (CSV/XLSX)
│   │   ├── suggestion/         # AI suggestions for data correction
│   │   └── datacorrection/     # Data correction endpoints
│   ├── page.tsx                # Main application page
│   ├── layout.tsx              # Root layout with fonts
│   └── globals.css             # Global styles
│
├── components/
│   └── data-alchemist/
│       ├── index.tsx           # Main component with state management
│       ├── Header.tsx          # App header with validation status
│       ├── Navtab.tsx          # Navigation tabs
│       ├── Fileupload.tsx      # File upload zones
│       ├── DataTable.tsx       # Interactive data table
│       ├── validation.tsx      # Validation panel
│       ├── Search.tsx          # AI search panel
│       ├── Rules.tsx           # Business rules editor
│       ├── Priority.tsx        # Priority weights editor
│       └── StatusMessage.tsx   # Success/error messages
│
├── types/
│   └── type.ts                 # TypeScript type definitions
│
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

## API Documentation

### POST `/api/upload`
Upload and parse data files with AI-powered header mapping.

**Request:** `multipart/form-data`
- `file`: CSV or XLSX file
- `entityType`: `'clients' | 'workers' | 'tasks'`

**Response:**
```json
{
  "success": true,
  "data": [...],
  "entityType": "clients",
  "headerMapping": {...},
  "recordCount": 100
}
```

### POST `/api/validate`
Validate data with core rules and AI analysis.

**Request:**
```json
{
  "clients": [...],
  "workers": [...],
  "tasks": [...]
}
```

**Response:**
```json
{
  "isValid": false,
  "errors": [...],
  "warnings": [...],
  "summary": {
    "totalErrors": 5,
    "totalWarnings": 2,
    "criticalErrors": 1,
    "entitiesWithErrors": 3
  }
}
```

### POST `/api/search`
Natural language search across all entities.

**Request:**
```json
{
  "query": "Find all high priority clients with JavaScript tasks",
  "data": {...}
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "clients": [...],
    "workers": [...],
    "tasks": [...],
    "interpretation": "Searching for clients with priority > 3...",
    "matchCount": 15
  }
}
```

### POST `/api/modify`
Modify data using natural language instructions.

**Request:**
```json
{
  "instruction": "Increase all client priority levels by 1",
  "data": {...}
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "modifiedData": {...},
    "changes": [...],
    "interpretation": "...",
    "message": "Applied 25 modifications"
  }
}
```

### POST `/api/rules`
Manage business rules.

**Actions:**
- `createFromNaturalLanguage`: Create rule from description
- `createStructured`: Create rule from structured data
- `getRecommendations`: Get AI-suggested rules
- `generateConfig`: Export active rules configuration

### GET/POST `/api/priorities`
Manage priority weights.

**GET Response:**
```json
{
  "priorities": [
    { "id": "priority_level", "name": "Priority Level", "weight": 0.3, "description": "..." },
    ...
  ]
}
```

### POST `/api/export`
Export data in CSV or XLSX format.

**Request:**
```json
{
  "data": {...},
  "rules": [...],
  "priorities": {...},
  "format": "csv"
}
```

## Entity Types

### Clients
| Field | Type | Description |
|-------|------|-------------|
| ClientID | string | Unique identifier |
| ClientName | string | Client name |
| PriorityLevel | number (1-5) | Priority importance |
| RequestedTaskIDs | string | Comma-separated task IDs |
| GroupTag | string | Client group identifier |
| AttributesJSON | string | Additional attributes (JSON) |

### Workers
| Field | Type | Description |
|-------|------|-------------|
| WorkerID | string | Unique identifier |
| WorkerName | string | Worker name |
| Skills | string | Comma-separated skills |
| AvailableSlots | string | Array of available slots (JSON) |
| MaxLoadPerPhase | number | Maximum load per phase |
| WorkerGroup | string | Worker group identifier |
| QualificationLevel | number | Skill level |

### Tasks
| Field | Type | Description |
|-------|------|-------------|
| TaskID | string | Unique identifier |
| TaskName | string | Task name |
| Category | string | Task category |
| Duration | number | Duration in time units |
| RequiredSkills | string | Comma-separated required skills |
| PreferredPhases | string | Preferred execution phases |
| MaxConcurrent | number | Maximum concurrent executions |

## License

This project is private. All rights reserved.

---

Built with ❤️ using Next.js and Google Gemini AI
