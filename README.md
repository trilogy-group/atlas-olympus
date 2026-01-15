# 🏛️ ATLAS Olympus

<div align="center">

![Version](https://img.shields.io/badge/version-1.15012026A-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![MUI](https://img.shields.io/badge/MUI-5.x-007FFF?logo=mui)
![License](https://img.shields.io/badge/license-Proprietary-red)

**Central Support Analytics Dashboard**

*Real-time metrics, historical trends, and team performance insights*

</div>

---

## 📊 Overview

ATLAS Olympus is a comprehensive analytics dashboard for Central Support operations. It provides real-time visibility into ticket metrics, AI resolution rates, SLA compliance, and team performance across all Business Units (BUs) and products.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📈 **Real-time Stats** | Live dashboard with current ticket volumes and metrics |
| 📉 **Historical Trends** | 12-week trend analysis for all KPIs |
| 🤖 **AI Resolution Tracking** | Monitor AI-assisted ticket resolution rates |
| ⏱️ **SLA Compliance** | Track SLA adherence across products |
| 🔄 **FCR Analysis** | First Contact Resolution metrics |
| 👥 **VP/Team Views** | Filter by VP assignments and teams |
| 🎯 **Product Drill-down** | Granular views by BU and product |
| 👁️ **Visibility Toggles** | Exclude/include products from charts dynamically |
| 📱 **Mobile Responsive** | Full mobile support with optimized layouts |

---

## 🖥️ Screenshots

### Dashboard View
```
┌─────────────────────────────────────────────────────────────┐
│  ATLAS Olympus                              v.1.15012026A   │
├──────────┬──────────────────────────────────────────────────┤
│          │  📊 Tickets Closed    │  🤖 AI Resolution        │
│  BU List │  [Area Chart]         │  [Area Chart]            │
│          ├──────────────────────────────────────────────────┤
│ 👁️ Toggle│  🔄 FCR              │  ⏱️ SLA Compliance        │
│          │  [Area Chart]         │  [Area Chart]            │
└──────────┴──────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 16.x
- **npm** >= 8.x
- Google OAuth credentials (for authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/trilogy-group/atlas-olympus.git
cd atlas-olympus

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
```

The optimized build will be in the `build/` folder, ready for S3 deployment.

---

## 📁 Project Structure

```
atlas-olympus/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── SimpleaAreaChart.jsx
│   │   ├── PieChart.jsx
│   │   ├── BarChart.jsx
│   │   └── ...
│   ├── scenes/             # Page components
│   │   ├── dashboard/      # Main dashboard
│   │   ├── dashboardhistory/  # Historical trends
│   │   ├── login/          # Authentication
│   │   └── global/         # Sidebar, Topbar
│   ├── context/            # React contexts
│   ├── hooks/              # Custom hooks
│   ├── data/               # Data fetching utilities
│   └── theme.js            # MUI theme configuration
├── Backend/                # Backend utilities
├── Icons/                  # Custom icons
└── package.json
```

---

## 🔧 Configuration

### Environment Variables

The app uses configuration from `useConfigureGlobals.js` hook. Data is fetched from:

- **S3 Bucket**: `olympus-cache`
- **History Data**: `NewHistory.json`
- **Automations**: `AutomationsHistory.json`

### Authentication

Google OAuth is required. Users must have valid Trilogy credentials to access the dashboard.

---

## 📊 Data Structure

### History Data Format
```javascript
[
  "BU Name",           // [0] Business Unit
  "product_id",        // [1] Product identifier
  "total_tickets",     // [2] Total closed tickets
  "...",               // [3-6] Additional metrics
  "ai_resolved",       // [7] AI resolution count
  "sla_failed",        // [8] SLA failures
  "fcr_count",         // [9] First Contact Resolution
  "...",               // [10] Additional data
  "week_number",       // [11] Week of year
  "year"               // [12] Year (e.g., "2026")
]
```

---

## 🆕 Recent Updates (v.1.15012026A)

### New Features
- ✅ **Visibility Toggle**: Each BU/product now has an "eye" icon to exclude/include from charts
- ✅ **Click Behavior**: Drill-down navigation now only triggers on product name click
- ✅ **Real-time Filtering**: Charts update instantly when toggling visibility

### UI Improvements
- Hover effects on product names
- Visual feedback for excluded items (reduced opacity)
- Smooth transitions on toggle

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **Material-UI (MUI) 5** | Component Library |
| **Recharts** | Data Visualization |
| **React Router 6** | Navigation |
| **Google OAuth** | Authentication |
| **AWS S3** | Data Storage |

---

## 📱 Mobile Support

ATLAS Olympus is fully responsive with dedicated mobile layouts:

- Portrait mode optimizations
- Touch-friendly controls
- Adaptive chart sizing
- Collapsible sidebar

> ⚠️ **Note**: Avoid using `height: "auto"` on PieChart containers in mobile views to prevent infinite re-render loops.

---

## 🚢 Deployment

### S3 Static Hosting

```bash
# Build the project
npm run build

# Upload to S3 (requires AWS CLI configured)
aws s3 sync build/ s3://your-bucket-name --delete
```

### CloudFront Distribution

The production site is served via CloudFront at:
- **URL**: https://atlasolympus.csaiautomations.com

---

## 👥 Team

| Role | Contact |
|------|---------|
| **Owner** | CS AI Automations Team |
| **Maintainer** | Xavier Villarroel |

---

## 📄 License

This project is proprietary software owned by Trilogy/Crossover. Unauthorized distribution or use is prohibited.

---

<div align="center">

**Built by the CS AI Automations Team**

*Central Support • Trilogy Group*

</div>
