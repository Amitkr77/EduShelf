# Workforce Analytics Dashboard – Design Specification

## Product Overview

### Purpose

A workforce analytics dashboard that provides HR managers, administrators, and team leaders with real-time visibility into employee attendance, productivity, workforce distribution, schedules, and operational metrics.

### User Goals

* Monitor workforce KPIs
* Track attendance activity
* Review department distribution
* Manage employee schedules
* Access employee records
* Navigate HR modules quickly

### Primary Actions

* View dashboard metrics
* Search records
* Analyze attendance trends
* Review employee data
* Monitor schedules
* Navigate to Analytics, Payroll, and Attendance modules

### Intended Users

* HR Managers
* Operations Managers
* Department Heads
* Payroll Teams
* Business Administrators

---

# Page Structure

## Overall Layout

Desktop SaaS dashboard with a fixed sidebar and fluid content area.

```text
AppShell
├── Sidebar
└── Main Content
    ├── Header
    ├── KPI Section
    ├── Analytics Section
    └── Employee Management Section
```

### Reading Flow

1. Dashboard Title
2. KPI Metrics
3. Heatmap Analytics
4. Department Distribution
5. Employee Table
6. Schedule Panel

---

# Layout Specification

## Root Container

```css
max-width: 1440px;
height: 100vh;
padding: 48px;
border-radius: 32px;
display: flex;
```

### Background

```css
linear-gradient(
  180deg,
  #688997 0%,
  #c7beb2 100%
);
```

---

## Sidebar

### Position

Left

### Width

```css
240px
```

### Layout

```css
display:flex;
flex-direction:column;
justify-content:space-between;
padding:32px;
```

---

## Main Content

### Position

Right

### Width

```css
calc(100% - 240px)
```

### Padding

```css
32px
```

### Gap

```css
24px
```

---

# Navigation System

## Sidebar Navigation

### Primary Menu

* Dashboard
* Analytics
* Payroll
* Attendance

### Secondary Menu

* User Guide
* FAQ
* Help Center

### Active State

```css
background: rgba(255,255,255,.15);
border-radius:16px;
font-weight:600;
```

### Hover State

```css
background: rgba(255,255,255,.08);
```

---

## User Profile Section

Located at bottom of sidebar.

### Content

* Avatar
* Name
* Email
* Dropdown Trigger

### Actions

* Account Settings
* Profile
* Logout

---

# Header

## Layout

```text
Header
├── Page Title
├── Search Bar
└── Action Buttons
```

---

## Page Title

### Text

Dashboard

### Typography

```css
font-size:42px;
font-weight:700;
line-height:1.2;
```

---

## Search Bar

### Dimensions

```css
width:360px;
height:48px;
```

### Elements

* Search Icon
* Placeholder

```text
Search...
```

### States

* Default
* Hover
* Focus
* Disabled
* Error

---

## Action Buttons

### Components

* Messages Button
* Notifications Button

### Size

```css
44px × 44px
```

### Shape

Circle

---

# KPI Cards Section

## Layout

```css
display:grid;
grid-template-columns:repeat(4,1fr);
gap:20px;
```

---

## KPI Card Structure

```text
Stat Card
├── Icon
├── Label
├── Metric Value
├── Trend Badge
└── Comparison Text
```

### Card Style

```css
border-radius:24px;
padding:24px;
background:rgba(255,255,255,.08);
backdrop-filter:blur(20px);
```

---

## Metrics

### Avg Daily Hours Worked

Value: 7h 45m

Trend: Positive

---

### Remote Employees Today

Value: 62%

Trend: Negative

---

### Pending Leave Approvals

Value: 12

Trend: Negative

---

### Employee Celebrations

Value: 10

Trend: Positive

---

# Analytics Section

## Layout

```css
display:grid;
grid-template-columns:1.1fr 1fr;
gap:24px;
```

---

# Work Rhythm Heatmap

## Purpose

Visualize employee check-in activity across days and time periods.

### Structure

```text
Card
├── Header
│   ├── Title
│   ├── Metric
│   └── Filter Dropdown
└── Heatmap Grid
```

### Filters

* This Week
* This Month
* Quarter
* Year

### Heatmap Axes

Rows = Hours

Columns = Days

### Color Scale

```css
Low Activity: #E8F0EC
Medium Activity: #B8CCC3
High Activity: #6B8F83
```

---

# Department Distribution Card

## Purpose

Visualize workforce distribution by department.

### Structure

```text
Card
├── Title
├── Employee Count
├── Horizontal Bar Chart
└── See All Button
```

### Departments

* Marketing
* IT
* Finance
* Creative
* C-Level
* Business Development

---

# Employee Table

## Layout

Large card occupying most of lower section.

### Header

```text
Employee List
                Download
```

---

## Columns

| Column       | Type          |
| ------------ | ------------- |
| ID           | Text          |
| Name         | Avatar + Text |
| Department   | Text          |
| Position     | Text          |
| Joining Date | Date          |

---

## Features

### Sorting

* Ascending
* Descending

### Filtering

* Department
* Position
* Date

### Search

Global search support.

### Export

* CSV
* XLSX
* PDF

---

## Row Actions

* View
* Edit
* Archive

---

## Empty State

```text
No Employees Found
Add Employee
```

---

# Schedule Panel

## Purpose

Display today's activities and tasks.

### Width

```css
320px
```

### Structure

```text
Schedule Card
├── Priority Badge
├── Task Title
├── Time
└── Details Action
```

---

## Priority Types

### High Priority

```css
background:#A7C2B0;
```

### Medium Priority

```css
background:#84C7E8;
```

### Low Priority

```css
background:#EFC1B3;
```

---

# Typography System

## Font Family

```css
font-family: Inter, system-ui, sans-serif;
```

---

## H1

```css
font-size:42px;
font-weight:700;
```

---

## H2

```css
font-size:24px;
font-weight:600;
```

---

## H3

```css
font-size:18px;
font-weight:600;
```

---

## Body

```css
font-size:14px;
font-weight:400;
```

---

## Label

```css
font-size:12px;
font-weight:500;
```

---

## Caption

```css
font-size:11px;
font-weight:400;
```

---

# Color System

## Primary

```hex
#7C9AA5
```

## Primary Dark

```hex
#5D7480
```

## Secondary

```hex
#AAB8B4
```

## Surface

```hex
#FFFFFF
```

## Text Primary

```hex
#1F2937
```

## Text Secondary

```hex
#6B7280
```

## Border

```hex
#E5E7EB
```

## Success

```hex
#7CCB7A
```

## Warning

```hex
#F3C47A
```

## Error

```hex
#F28B82
```

## Info

```hex
#84C7E8
```

---

# Design Tokens

## Color Tokens

```yaml
Primary-50: #F4F8F9
Primary-100: #DDE7EA
Primary-300: #AAB8B4
Primary-500: #7C9AA5
Primary-700: #5D7480

Gray-50: #F9FAFB
Gray-100: #F3F4F6
Gray-200: #E5E7EB
Gray-500: #6B7280
Gray-900: #111827
```

---

## Radius Tokens

```yaml
radius-sm: 8px
radius-md: 12px
radius-lg: 16px
radius-xl: 24px
radius-2xl: 32px
radius-full: 9999px
```

---

## Spacing Tokens

```yaml
4
8
12
16
20
24
32
40
48
64
```

---

## Shadow Tokens

```yaml
shadow-sm: 0 2px 8px rgba(0,0,0,.05)
shadow-md: 0 8px 24px rgba(0,0,0,.08)
shadow-lg: 0 20px 40px rgba(0,0,0,.12)
```

---

# Responsive Behavior

## Desktop (1280px+)

* Sidebar visible
* 4 KPI cards
* 2-column analytics
* 2-column data section

---

## Tablet (768px–1279px)

* Sidebar collapses
* KPI grid becomes 2 columns
* Analytics stack vertically
* Schedule panel moves below table

---

## Mobile (<768px)

* Sidebar becomes drawer
* Search width 100%
* KPI cards stack vertically
* Charts stack vertically
* Table transforms into cards

---

# Accessibility Requirements

## Keyboard Navigation

Tab order:

1. Sidebar
2. Search
3. Header Actions
4. KPI Cards
5. Charts
6. Table
7. Schedule

---

## Focus States

```css
outline:2px solid #5D7480;
outline-offset:2px;
```

---

## ARIA

Required on:

* Navigation items
* Search input
* Dropdowns
* Buttons
* Charts
* Table controls

---

## Contrast

WCAG AA compliance.

Minimum:

```text
4.5:1
```

---

# Animation & Motion

## Hover

```css
transition:200ms ease;
transform:translateY(-2px);
```

---

## Dropdowns

```css
150ms fade + scale
```

---

## Toasts

Slide-in from top-right.

---

## Skeletons

Pulse animation.

---

# Tailwind Implementation Notes

## Main Layout

```html
flex min-h-screen rounded-[32px] overflow-hidden
```

---

## Sidebar

```html
w-60 flex flex-col justify-between
```

---

## KPI Grid

```html
grid grid-cols-4 gap-5
xl:grid-cols-4
md:grid-cols-2
sm:grid-cols-1
```

---

## Analytics Grid

```html
grid xl:grid-cols-2 gap-6
```

---

## Data Grid

```html
grid xl:grid-cols-[2fr_1fr] gap-6
```

---

# React Component Tree

```text
DashboardPage
├── AppShell
│
├── Sidebar
│   ├── Brand
│   ├── PrimaryNavigation
│   ├── SecondaryNavigation
│   └── UserProfileCard
│
├── DashboardHeader
│   ├── PageTitle
│   ├── SearchInput
│   └── HeaderActions
│
├── StatsGrid
│   ├── StatCard
│   ├── StatCard
│   ├── StatCard
│   └── StatCard
│
├── AnalyticsSection
│   ├── WorkHeatmapCard
│   └── DepartmentDistributionCard
│
├── EmployeeManagementSection
│   ├── EmployeeTableCard
│   └── SchedulePanel
│
├── ToastProvider
├── ModalProvider
└── DropdownProvider
```

---

# Development Notes

## Reusable Components

* Button
* Card
* Badge
* Avatar
* SearchInput
* Dropdown
* DataTable
* StatCard
* ScheduleItem
* ChartCard
* EmptyState
* Toast
* SkeletonLoader

---

## API Requirements

```http
GET /api/dashboard/metrics
GET /api/dashboard/attendance
GET /api/dashboard/departments
GET /api/employees
GET /api/schedule/today
```

---

## State Management

Recommended:

```text
TanStack Query
Zustand
```

---

## Edge Cases

* No attendance data
* No employees
* No schedule items
* Missing avatars
* Empty search results
* Export failures
* Slow network
* Large employee datasets
* Permission restricted modules

---

## Design Principles

* Modern enterprise SaaS aesthetics
* Soft glassmorphism-inspired surfaces
* High information density
* Strong visual hierarchy
* Dashboard-first workflow
* Accessible interactions
* Responsive component architecture
* Scalable design system
