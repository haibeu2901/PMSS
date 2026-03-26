# Project Management Support System (PMSS)

## 🎯 Overview

A full-stack application for managing academic projects with GitHub and Jira integration. Built with **ASP.NET Core 10** (backend) and **React** (frontend), following Clean Architecture principles and modern development best practices.

The system is now successfully deployed with:
- Backend on **Azure App Service**
- Database on **Azure SQL Database**
- Frontend on **Vercel**

## ✨ Features

### Core Features
- 📚 **Academic Structure Management** - Semesters, courses, and enrollments
- 🚀 **Project Management** - Create and manage course projects with teams
- 👥 **User Management** - Students, teachers, and admins with role-based access
- 🔍 **Advanced Filtering** - Pagination, sorting, and search across all resources

### Integrations (Planned)
- 🐙 **GitHub Integration** - Repository tracking and contribution statistics
- 📊 **Jira Integration** - Project requirements and issue tracking
- 🔐 **Access Control** - Request workflow for private repositories

## 🚀 Quick Start

### Prerequisites

#### Backend
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [SQL Server](https://www.microsoft.com/sql-server/sql-server-downloads)

#### Frontend
- [Node.js 18+](https://nodejs.org/)
- npm, yarn, or pnpm

#### Mobile
- [Flutter SDK](https://flutter.dev/docs/get-started/install)
- Android Studio (for Android development)
- Xcode (for iOS development on macOS)

### Clone Repository

```bash
git clone <your-repository-url>
cd PMSS
```

### Backend Setup

```bash
cd backend
dotnet restore
cd PMSS.API
dotnet ef database update --project ../PMSS.Infrastructure
dotnet run
```

🌐 Backend runs at: **https://localhost:7136** or **http://localhost:5068**  
📚 Swagger UI: **https://localhost:7136/swagger** or **http://localhost:5068/swagger**

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

🌐 Frontend will run at: **http://localhost:5173**

### Mobile Setup

```bash
cd mobile
flutter pub get
flutter run
```

## 📁 Project Structure

```
PMSS/
├── README.md                    # You are here
├── CONTRIBUTING.md              # Contribution guidelines
├── .gitignore                   # Git ignore rules
│
├── backend/                     # 🔧 .NET Web API
│   ├── README.md                # Backend setup guide
│   ├── PMSS.Domain/             # Entities & enums
│   ├── PMSS.Application/        # DTOs & interfaces
│   ├── PMSS.Infrastructure/     # Data access & services
│   ├── PMSS.API/                # Controllers & middleware
│   └── PMSS.slnx                # Solution file
│
├── frontend/                    # ⚛️ React App (deployed on Vercel)
│   ├── README.md                # Frontend setup guide
│   ├── src/                     # Source code
│   ├── public/                  # Static assets
│   └── package.json             # Dependencies
│
├── mobile/                      # 📱 Flutter Mobile App
│   ├── README.md                # Mobile setup guide
│   ├── lib/                     # Dart source code
│   ├── test/                    # Mobile tests
│   └── pubspec.yaml             # Dependencies
│
└── DOCS/                        # 📖 Documentation
    ├── QUICK_REFERENCE.md       # Quick reference
    ├── GRAPHQL_QUERY_EXAMPLES.md # GraphQL examples
    └── IMPLEMENTATION_SUMMARY.md # Implementation summary
```

## 🏗️ Architecture

### Backend (Clean Architecture)

```
┌─────────────────────────────────────────┐
│          PMSS.API (Controllers)         │  ← Presentation Layer
├─────────────────────────────────────────┤
│   PMSS.Application (DTOs, Interfaces)   │  ← Application Layer
├─────────────────────────────────────────┤
│   PMSS.Infrastructure (Repos, Services) │  ← Infrastructure Layer
├─────────────────────────────────────────┤
│      PMSS.Domain (Entities, Enums)      │  ← Domain Layer
└─────────────────────────────────────────┘
```

**Benefits:**
- ✅ Separation of concerns
- ✅ Testability
- ✅ Maintainability
- ✅ Framework independence

### Frontend (Recommended Structure)

```
src/
├── api/           # API client & endpoints
├── components/    # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── store/         # State management
├── utils/         # Helper functions
└── types/         # TypeScript types
```

## 🔌 API Endpoints

### Main Resources

| Resource | Endpoint | Methods |
|----------|----------|---------|
| Semesters | `/api/semesters` | GET, POST, PUT, DELETE |
| Users | `/api/users` | GET, POST, PUT, DELETE |
| Courses | `/api/courses` | GET, POST, PUT, DELETE |
| Projects | `/api/projects` | GET, POST, PUT, DELETE |

> Note: This table highlights core resources. For additional endpoints (Auth, Classes, GitHub, Jira, Notifications, SRS, and more), see [DOCS/QUICK_REFERENCE.md](DOCS/QUICK_REFERENCE.md).

### Query Parameters (All Endpoints)

| Parameter | Type | Description |
|-----------|------|-------------|
| `pageNumber` | int | Page number (default: 1) |
| `pageSize` | int | Items per page (default: 10) |
| `sortBy` | string | Property to sort by |
| `sortDescending` | bool | Sort order |
| `searchTerm` | string | Search across fields |

### Example Request

```http
GET /api/projects?pageNumber=1&pageSize=10&sortBy=name&courseId=5
```

### Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "items": [...],
    "totalCount": 50,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

## 🗄️ Database Schema

### Core Entities

- **Semesters** - Academic periods (e.g., Fall 2024)
- **Users** - Students, teachers, admins
- **Courses** - Courses within semesters
- **CourseEnrollments** - Student-course relationships
- **Projects** - Course projects
- **ProjectMembers** - Project team members
- **GithubRepos** - Tracked repositories
- **RepoContributors** - Contributor statistics
- **JiraConfigs** - Jira integration settings
- **AccessRequests** - Repository access workflow

### Key Relationships

```
Semester 1──N Course
User 1──N Course (Teacher)
Course M──N User (Students via CourseEnrollments)
Course 1──N Project
Project 1──N GithubRepo
Project M──N User (Members via ProjectMembers)
Project 1──1 JiraConfig (Active)
```

## 👥 Team Roles & Responsibilities

### Backend Developers

**Focus Areas:**
- 🔧 API endpoint development
- 💾 Database schema & migrations
- 🛡️ Authentication & authorization
- 🐙 GitHub API integration
- 📊 Jira API integration

**Setup:** See [backend/README.md](backend/README.md)

### Frontend Developers

**Focus Areas:**
- ⚛️ React component development
- 🎨 UI/UX implementation
- 🔌 API integration
- 📱 Responsive design
- ✅ Form validation

**Setup:** See [frontend/README.md](frontend/README.md)

## 🛠️ Development Workflow

### 1. Clone and Create Branch

```bash
git clone <repo-url>
cd PMSS
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow code style guidelines
- Write tests for new features
- Update documentation

### 3. Commit and Push

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 4. Create Pull Request

- Describe your changes
- Link related issues
- Request review from team members

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Backend README](backend/README.md) | Backend setup & development |
| [Frontend README](frontend/README.md) | Frontend setup & development |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [DOCS/QUICK_REFERENCE.md](DOCS/QUICK_REFERENCE.md) | API quick reference |
| [DOCS/GRAPHQL_QUERY_EXAMPLES.md](DOCS/GRAPHQL_QUERY_EXAMPLES.md) | GraphQL query examples |
| [DOCS/IMPLEMENTATION_SUMMARY.md](DOCS/IMPLEMENTATION_SUMMARY.md) | Implementation summary |
| [DOCS/GITHUB_REPO_FEATURE_README.md](DOCS/GITHUB_REPO_FEATURE_README.md) | GitHub repo feature docs |
| [DOCS/GITHUB_CONTRIBUTION_DASHBOARD.md](DOCS/GITHUB_CONTRIBUTION_DASHBOARD.md) | Contribution dashboard docs |

## 🧪 Testing

### Backend Tests

Backend automated test projects are not added yet.

### Frontend Tests

Frontend test scripts are not configured yet.

```bash
cd frontend
npm run lint
```

### Mobile Tests

```bash
cd mobile
flutter test
```

## 🚢 Deployment

### Current Production Environment

- ✅ **Backend API:** Azure App Service
- ✅ **Database:** Azure SQL Database
- ✅ **Frontend:** Vercel

### Deployment Architecture

```text
Vercel (React Frontend)
  |
  v
Azure App Service (ASP.NET Core API)
  |
  v
Azure SQL Database
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code style guidelines
- Branch naming conventions
- Commit message format
- Pull request process

## 📄 License

[Your License Here]

## 📞 Contact & Support

- **Project Lead:** [Name]
- **Backend Team:** [Contact]
- **Frontend Team:** [Contact]
- **Issues:** [GitHub Issues](issues-url)

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- [x] Clean Architecture setup
- [x] Basic CRUD operations
- [x] Database migrations
- [ ] Authentication & Authorization

### Phase 2: Integration 🚧
- [ ] GitHub API integration
- [ ] Jira API integration
- [ ] Access request workflow
- [ ] Contribution statistics

### Phase 3: Frontend 📋
- [x] React app setup
- [ ] Dashboard implementation
- [ ] Project management UI
- [ ] User management UI

### Phase 4: Polish ✨
- [ ] Unit & integration tests
- [ ] Performance optimization
- [ ] Documentation completion
- [x] Cloud deployment (Azure App Service + Azure SQL Database + Vercel)

## 🙏 Acknowledgments

Built by FPT University students for the SWD392 course.

---

**Happy Coding! 🚀**
