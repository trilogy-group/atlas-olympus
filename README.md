# 🏛️ ATLAS Olympus

<div align="center">

![Version](https://img.shields.io/badge/version-1.15012026A-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![MUI](https://img.shields.io/badge/MUI-5.x-007FFF?logo=mui)
![License](https://img.shields.io/badge/license-Proprietary-red)

**Central Support Analytics Dashboard**

*Real-time metrics, historical trends, and team performance insights for Trilogy's Central Support operations.*

[Live Demo](https://atlasolympus.csaiautomations.com) · [Report Bug](https://github.com/trilogy-group/atlas-olympus/issues) · [Request Feature](https://github.com/trilogy-group/atlas-olympus/issues)

</div>

---

## 📊 What is ATLAS Olympus?

ATLAS Olympus is the central analytics platform for **Trilogy's Central Support** team. It aggregates data from multiple sources to provide actionable insights on:

- **Ticket volumes** across all Business Units and products
- **AI resolution rates** for automated ticket handling
- **SLA compliance** tracking and trends
- **First Contact Resolution (FCR)** metrics
- **Team and VP performance** breakdowns

The dashboard is designed for leadership, managers, and support agents to monitor KPIs and make data-driven decisions.

---

## 🖼️ Screenshots

<!-- Add your screenshots here -->

### Main Dashboard
*Coming soon*

### Historical Trends
*Coming soon*

### Mobile View
*Coming soon*

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📈 **Real-time Dashboard** | Live metrics updated from S3 cache |
| 📉 **12-Week Trends** | Historical analysis for all KPIs |
| 🤖 **AI Metrics** | Track AI-assisted resolutions |
| ⏱️ **SLA Tracking** | Monitor compliance across products |
| 👁️ **Visibility Toggles** | Dynamically exclude/include items from charts |
| 🎯 **Drill-down Views** | From BU → Product → Individual metrics |
| 📱 **Mobile Responsive** | Optimized for all screen sizes |
| 🔐 **Google OAuth** | Secure authentication via Trilogy credentials |

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/trilogy-group/atlas-olympus.git
cd atlas-olympus

# Install
npm install

# Run
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Material-UI 5 | Component Library |
| Recharts | Data Visualization |
| React Router 6 | Navigation |
| Google OAuth | Authentication |
| AWS S3 | Data Storage |

---

## 📁 Project Structure

```
atlas-olympus/
├── src/
│   ├── components/      # Reusable charts and UI components
│   ├── scenes/          # Page components (dashboard, history, login)
│   ├── context/         # React contexts (period, reload)
│   ├── hooks/           # Custom hooks
│   ├── data/            # Data fetching utilities
│   └── theme.js         # MUI theme configuration
├── public/              # Static assets
└── package.json
```

---

## 🚢 Deployment

### Production URL
**https://atlasolympus.csaiautomations.com**

### Build & Deploy
```bash
npm run build
aws s3 sync build/ s3://your-bucket --delete
```

---

## 🆕 Latest Release (v.1.15012026A)

- ✅ Visibility toggles for BUs and products in history charts
- ✅ Improved click behavior (name = drill-down, eye = toggle)
- ✅ Real-time chart filtering
- ✅ Visual feedback for excluded items

---

## 👥 Team

| Role | Contact |
|------|---------|
| **Owner** | CS AI Automations Team |
| **Maintainer** | Xavier Villarroel |

---

## 📄 License

Proprietary software owned by Trilogy/Crossover. Unauthorized distribution prohibited.

---

<div align="center">

**Built with ❤️ by CS AI Automations**

*Central Support · Trilogy Group*

</div>
