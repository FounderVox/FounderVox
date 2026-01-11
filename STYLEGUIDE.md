# FounderVox Design System & Style Guide

A comprehensive guide to the visual language, components, and design principles that define the FounderVox brand. This document ensures consistency across all interfaces and enables anyone to replicate the premium, professional aesthetic of the application.

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Icons](#icons)
7. [Animations & Motion](#animations--motion)
8. [Backgrounds & Patterns](#backgrounds--patterns)
9. [Shadows & Elevation](#shadows--elevation)
10. [Best Practices](#best-practices)

---

## Brand Identity

### Brand Personality
- **Professional**: Enterprise-grade quality without being sterile
- **Refined**: Attention to detail in every interaction
- **Warm**: Approachable and human, not cold or corporate
- **Minimal**: Clean interfaces that prioritize content
- **Premium**: Subtle luxury through quality, not flashiness

### Core Principles
1. **Clarity over decoration** - Every element serves a purpose
2. **Consistency builds trust** - Predictable patterns create comfort
3. **Subtle delight** - Small animations and transitions that feel effortless
4. **Accessibility first** - Design for everyone, not just the ideal user

---

## Color System

### Brand Color - Terracotta

The primary brand color is a warm, earthy terracotta that conveys sophistication and approachability.

```css
/* CSS Variables */
--brand: 11 50% 53%;           /* HSL: Terracotta - Primary */
--brand-light: 11 50% 95%;     /* Light variant for backgrounds */
--brand-foreground: 0 0% 100%; /* White text on brand */
```

**Tailwind Usage:**
```jsx
<div className="bg-brand text-brand-foreground" />
<div className="text-brand" />
<div className="bg-brand-light" />
```

**Hex Approximation:** `#C17556` (for external tools)

### Neutral Palette

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `background` | 0 0% 100% | Main page background |
| `foreground` | 222.2 84% 4.9% | Primary text color |
| `muted` | 210 40% 96.1% | Subtle backgrounds |
| `muted-foreground` | 215.4 16.3% 46.9% | Secondary text |
| `border` | 220 13% 85% | Standard borders |

### Semantic Colors

| Purpose | Color | Tailwind Class |
|---------|-------|----------------|
| Success | Emerald | `text-emerald-600`, `bg-emerald-100` |
| Warning | Amber | `text-amber-600`, `bg-amber-100` |
| Error/Danger | Red | `text-red-600`, `bg-red-100` |
| Info | Blue | `text-blue-600`, `bg-blue-100` |
| Progress | Blue | `text-blue-600`, `bg-blue-100` |

### Priority Colors

| Priority | Dot | Background | Text |
|----------|-----|------------|------|
| High/Urgent | `bg-red-500` | `bg-red-50` | `text-red-700` |
| Medium | `bg-amber-500` | `bg-amber-50` | `text-amber-700` |
| Low | `bg-emerald-500` | `bg-emerald-50` | `text-emerald-700` |

### Category Colors (Brain Dump)

| Category | Icon Color | Accent Border |
|----------|------------|---------------|
| Meeting | `text-blue-600` | `border-l-blue-500` |
| Thought | `text-purple-600` | `border-l-purple-500` |
| Question | `text-amber-600` | `border-l-amber-500` |
| Concern | `text-red-600` | `border-l-red-500` |
| Personal/People | `text-emerald-600` | `border-l-emerald-500` |

---

## Typography

### Font Stack

The application uses the system font stack for optimal performance and native feel:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
```

### Type Scale

| Element | Size | Weight | Tailwind Classes |
|---------|------|--------|------------------|
| Page Title | 24px | Bold (700) | `text-2xl font-bold text-gray-900` |
| Section Header | 18px | Semibold (600) | `text-lg font-semibold text-gray-900` |
| Card Title | 14px | Semibold (600) | `text-sm font-semibold text-gray-900` |
| Body Text | 14px | Normal (400) | `text-sm text-gray-700` |
| Small Text | 12px | Medium (500) | `text-xs text-gray-500` |
| Micro Text | 10px | Semibold (600) | `text-[10px] font-semibold` |
| Badge Text | 10px | Semibold, Uppercase | `text-[10px] font-semibold uppercase tracking-wide` |

### Text Colors

| Purpose | Class | Usage |
|---------|-------|-------|
| Primary | `text-gray-900` | Headings, important content |
| Secondary | `text-gray-700` | Body text, descriptions |
| Tertiary | `text-gray-500` | Metadata, hints |
| Muted | `text-gray-400` | Timestamps, placeholders |

---

## Spacing & Layout

### Spacing Scale

Based on Tailwind's default 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `0.5` | 2px | Micro gaps |
| `1` | 4px | Tight spacing |
| `1.5` | 6px | Button padding vertical |
| `2` | 8px | Small gaps |
| `3` | 12px | Component padding |
| `4` | 16px | Standard padding |
| `5` | 20px | Section gaps |
| `6` | 24px | Large padding |
| `8` | 32px | Section margins |

### Container Widths

| Context | Max Width | Tailwind |
|---------|-----------|----------|
| Dialog | 448px | `max-w-md` |
| Content Area | 1280px | `max-w-screen-xl` |
| Full Width | 100% | `w-full` |

### Grid Layouts

**Kanban Board (Action Items, Brain Dump):**
```jsx
<div className="grid md:grid-cols-3 gap-5" />     // 3-column
<div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5" /> // 5-column
```

**Stats Row:**
```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3" />
```

**Two-Panel Layout (Investor Updates):**
```jsx
<div className="grid lg:grid-cols-5 gap-6">
  <div className="lg:col-span-2" /> {/* List */}
  <div className="lg:col-span-3" /> {/* Detail */}
</div>
```

---

## Components

### Page Header

The standard page header with icon, title, and subtitle:

```jsx
<div className="mb-8">
  <div className="flex items-center gap-4 mb-6">
    {/* Icon Container */}
    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
      <IconComponent className="h-6 w-6 text-brand" />
    </div>
    {/* Text */}
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
      <p className="text-gray-500 text-sm mt-0.5">
        Page description text
      </p>
    </div>
  </div>
</div>
```

**Key Specifications:**
- Icon container: `p-3 rounded-xl bg-white border border-gray-200 shadow-sm`
- Icon: `h-6 w-6 text-brand`
- Title: `text-2xl font-bold text-gray-900`
- Subtitle: `text-gray-500 text-sm mt-0.5`

### Stat Cards

```jsx
<div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-gray-100">
      <Icon className="h-4 w-4 text-gray-600" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">42</p>
      <p className="text-xs text-gray-500">Label</p>
    </div>
  </div>
</div>
```

**Variants:**
- Default: `bg-gray-100`, `text-gray-600`
- Active/Warning: `bg-amber-100`, `text-amber-600`
- Success: `bg-emerald-100`, `text-emerald-600`
- Danger: `bg-red-100`, `text-red-600`

### Buttons

**Primary Button:**
```jsx
<button className="px-4 py-2.5 bg-brand text-white rounded-xl hover:opacity-90 transition-colors text-sm font-medium shadow-sm">
  Button Text
</button>
```

**Secondary Button:**
```jsx
<button className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
  Button Text
</button>
```

**Danger Button:**
```jsx
<button className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">
  Delete
</button>
```

**Icon Button:**
```jsx
<button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
  <Icon className="h-4 w-4" />
</button>
```

**Destructive Icon Button:**
```jsx
<button className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
  <Trash2 className="h-4 w-4" />
</button>
```

### Filter Pills/Tabs

```jsx
<div className="inline-flex items-center bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl p-1 shadow-sm">
  {options.map(option => (
    <button
      className={cn(
        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-gray-900 text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      )}
    >
      {option.label}
    </button>
  ))}
</div>
```

### Dropdown Menus

**Trigger Button:**
```jsx
<button className={cn(
  "flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm cursor-pointer transition-all",
  isOpen ? "ring-2 ring-gray-200 bg-white" : "hover:bg-white hover:border-gray-300"
)}>
  <span>Label</span>
  <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
</button>
```

**Dropdown Panel:**
```jsx
<motion.div
  initial={{ opacity: 0, y: -4, scale: 0.96 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -4, scale: 0.96 }}
  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
  className="absolute z-[100] bg-white rounded-xl border border-gray-200/80 py-1 min-w-[140px]"
  style={{
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
  }}
>
  {options.map((option, idx) => (
    <button className={cn(
      "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
      isSelected ? "bg-gray-50" : "hover:bg-gray-50",
      idx === 0 && "rounded-t-lg",
      idx === options.length - 1 && "rounded-b-lg"
    )}>
      <Icon className="h-3.5 w-3.5 text-gray-400" />
      <span className="font-medium flex-1 text-left text-gray-700">{option.label}</span>
      {isSelected && <Check className="h-3.5 w-3.5 text-gray-400" />}
    </button>
  ))}
</motion.div>
```

### Cards

**Standard Card:**
```jsx
<div className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200">
  <div className="p-4">
    {/* Content */}
  </div>
</div>
```

**Draggable Card (Kanban):**
```jsx
<div className={cn(
  "bg-white rounded-xl border border-gray-200/80 transition-all duration-200 group relative overflow-hidden",
  "cursor-grab active:cursor-grabbing",
  isDragging ? "opacity-40 scale-95 rotate-1" : "hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5"
)}>
  {/* Priority Indicator Bar */}
  <div className={cn("absolute top-0 left-0 w-1 h-full rounded-l-xl", priorityDotColor)} />
  <div className="p-4 pl-5">
    {/* Content */}
  </div>
</div>
```

**Card with Left Accent Border:**
```jsx
<div className={cn(
  "rounded-xl p-4 border shadow-sm border-l-4",
  "bg-white border-gray-200",
  accentBorderColor // e.g., "border-l-blue-500"
)}>
  {/* Content */}
</div>
```

### Badges

**Priority Badge:**
```jsx
<span className={cn(
  "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide border",
  priorityBg,    // bg-red-50, bg-amber-50, bg-emerald-50
  priorityText,  // text-red-700, text-amber-700, text-emerald-700
  priorityBorder // border-red-200, border-amber-200, border-emerald-200
)}>
  <Icon className="h-3 w-3" />
  {label}
</span>
```

**Status Badge:**
```jsx
<span className={cn(
  'px-2.5 py-1 rounded-md text-xs font-medium',
  status === 'sent'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-700'
)}>
  {status}
</span>
```

**Count Badge:**
```jsx
<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
  {count}
</span>
```

### Modal / Dialog

**Container Structure:**
```jsx
<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
  {/* Backdrop */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
    onClick={onClose}
  />

  {/* Dialog */}
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 10 }}
    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    className="relative w-full max-w-md mx-auto"
  >
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
      {/* Content */}
    </div>
  </motion.div>
</div>
```

### Toast Notifications

**Position:** Fixed, bottom-right (`fixed bottom-6 right-6 z-[100]`)

```jsx
<div className="bg-white rounded-xl shadow-lg border overflow-hidden min-w-[320px] max-w-md">
  <div className="p-4 flex items-start gap-3">
    {/* Icon */}
    <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", iconBgColor)}>
      <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
    </div>
    {/* Content */}
    <div className="flex-1 min-w-0 pt-0.5">
      <p className="text-sm font-semibold text-gray-900">{message}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    {/* Close */}
    <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
      <X className="h-4 w-4" />
    </button>
  </div>
  {/* Progress Bar */}
  <div className="h-1 bg-gray-100">
    <motion.div
      initial={{ width: '100%' }}
      animate={{ width: '0%' }}
      transition={{ duration: duration / 1000, ease: 'linear' }}
      className={cn("h-full", progressBgColor)}
    />
  </div>
</div>
```

**Variants:**
| Variant | Icon Bg | Progress Bg |
|---------|---------|-------------|
| Success | `bg-emerald-500` | `bg-emerald-500` |
| Error | `bg-red-500` | `bg-red-500` |
| Warning | `bg-amber-500` | `bg-amber-500` |
| Info | `bg-blue-500` | `bg-blue-500` |

### Input Fields

**Text Input:**
```jsx
<input
  type="text"
  className="w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent"
  placeholder="Placeholder..."
/>
```

**Textarea:**
```jsx
<textarea
  className="w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent resize-none min-h-[100px]"
  placeholder="Write here..."
/>
```

---

## Icons

### Icon Library
**Lucide React** - Consistent, well-crafted icon set

```bash
npm install lucide-react
```

### Standard Icon Sizes

| Context | Size | Tailwind |
|---------|------|----------|
| Micro (badges) | 12px | `h-3 w-3` |
| Small (inline) | 14px | `h-3.5 w-3.5` |
| Default | 16px | `h-4 w-4` |
| Medium | 20px | `h-5 w-5` |
| Large (headers) | 24px | `h-6 w-6` |
| XL (empty states) | 32px | `h-8 w-8` |

### Icon Colors

| Context | Class |
|---------|-------|
| Brand | `text-brand` |
| Primary | `text-gray-900` |
| Secondary | `text-gray-600` |
| Muted | `text-gray-400` |
| Interactive (hover) | `hover:text-gray-600` |

### Stroke Width
- Default: 2 (Lucide default)
- Headers: `strokeWidth={1.5}` for lighter feel
- Bold: `strokeWidth={2.5}` for emphasis

### Common Icons Used

| Purpose | Icon |
|---------|------|
| Brain Dump | `Brain` |
| Action Items | `ClipboardList` |
| Investor Updates | `Briefcase` |
| Notes | `FileText` |
| Delete | `Trash2` |
| Edit | `Pencil`, `Edit3` |
| Close | `X` |
| Check/Complete | `Check`, `CheckCircle2` |
| Add | `Plus` |
| Menu | `Menu` |
| Settings | `Settings` |
| User | `User`, `UserCircle` |
| Calendar | `Calendar`, `CalendarDays` |
| Clock | `Clock` |
| Priority High | `Zap` |
| Priority Medium | `Flag` |
| Priority Low | `Target` |
| Dropdown | `ChevronDown` |
| Navigate | `ArrowRight`, `ChevronRight` |

---

## Animations & Motion

### Library
**Framer Motion** - Production-grade animations

```bash
npm install framer-motion
```

### Standard Transitions

**Page Enter:**
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4 }}
>
```

**Card Enter (Staggered):**
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
>
```

**Dropdown Open:**
```jsx
initial={{ opacity: 0, y: -4, scale: 0.96 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -4, scale: 0.96 }}
transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
```

**Modal Enter:**
```jsx
initial={{ opacity: 0, scale: 0.95, y: 10 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 10 }}
transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
```

**Toast Enter:**
```jsx
initial={{ opacity: 0, y: 20, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 10, scale: 0.95 }}
transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
```

### CSS Transitions

Standard transition for interactive elements:
```css
transition-all duration-200
```

Hover lift effect:
```css
hover:-translate-y-0.5 hover:shadow-md
```

Icon rotation (dropdown chevron):
```css
transition-transform duration-200
/* When open: */ rotate-180
```

### Easing Curves

| Name | Value | Usage |
|------|-------|-------|
| Smooth | `[0.16, 1, 0.3, 1]` | Most UI animations |
| Linear | `linear` | Progress bars |
| Spring | `{ type: "spring", stiffness: 300, damping: 30 }` | Bouncy interactions |

---

## Backgrounds & Patterns

### Dashboard Background

```css
.dashboard-bg-light {
  background:
    linear-gradient(135deg, #fefefe 0%, #f8f9fa 20%, #fefefe 40%, #f8f9fa 60%, #fefefe 80%, #f8f9fa 100%),
    radial-gradient(ellipse 100% 60% at 50% 0%, rgba(255, 255, 255, 0.8) 0%, transparent 50%),
    radial-gradient(ellipse 80% 50% at 20% 100%, rgba(250, 250, 255, 0.6) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 50%, rgba(255, 250, 250, 0.4) 0%, transparent 50%);
}
```

### Glass Morphism

**Light Card:**
```css
.glass-card-light {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 24px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
```

**Semi-transparent Card:**
```jsx
className="bg-white/70 backdrop-blur-sm"
```

### Subtle Grid Pattern

```css
background-image:
  linear-gradient(rgba(0, 0, 0, 0.01) 1px, transparent 1px),
  linear-gradient(90deg, rgba(0, 0, 0, 0.01) 1px, transparent 1px);
background-size: 50px 50px;
```

---

## Shadows & Elevation

### Shadow Scale

| Level | Tailwind | Usage |
|-------|----------|-------|
| None | `shadow-none` | Flat elements |
| Subtle | `shadow-sm` | Cards at rest |
| Default | `shadow` | Slightly elevated |
| Medium | `shadow-md` | Cards on hover |
| Large | `shadow-lg` | Dropdowns |
| XL | `shadow-xl` | Modals |
| 2XL | `shadow-2xl` | Dialogs |

### Custom Shadows

**Dropdown Shadow:**
```jsx
style={{
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
}}
```

### Border Radius

| Size | Tailwind | Value | Usage |
|------|----------|-------|-------|
| Small | `rounded-md` | 6px | Badges |
| Default | `rounded-lg` | 8px | Buttons, inputs |
| Large | `rounded-xl` | 12px | Cards, dropdowns |
| XL | `rounded-2xl` | 16px | Modals, large cards |

---

## Best Practices

### Consistency Checklist

1. **Headers**: Always use the standard page header pattern with white icon container
2. **Colors**: Use brand color (`text-brand`) for primary icons, not custom colors
3. **Spacing**: Maintain consistent `gap-4` for header elements, `gap-3` for stat cards
4. **Borders**: Use `border-gray-200` for all standard borders
5. **Shadows**: Use `shadow-sm` for cards at rest, `shadow-md` on hover
6. **Animations**: Use Framer Motion for enter/exit, CSS for hovers

### Accessibility

1. **Focus States**: Always include `focus:ring-2 focus:ring-brand/40`
2. **Color Contrast**: Ensure text meets WCAG 2.1 AA standards
3. **Interactive Elements**: Use `cursor-pointer` for clickable elements
4. **Loading States**: Show spinners for async operations
5. **Error States**: Use red color scheme with clear messaging

### Performance

1. **Backdrop Blur**: Use sparingly (`backdrop-blur-sm`)
2. **Animations**: Keep under 300ms for responsiveness
3. **Images**: Use Next.js Image component for optimization
4. **Lazy Loading**: Defer non-critical UI elements

### Code Style

```jsx
// Good: Consistent class ordering
className={cn(
  "base-classes",           // Layout, position
  "bg-white rounded-xl",    // Background, shape
  "border border-gray-200", // Border
  "shadow-sm",              // Shadow
  "hover:shadow-md",        // Hover states
  "transition-all",         // Transitions
  conditionalClass          // Conditional classes last
)}
```

---

## Quick Reference

### Page Header Template
```jsx
<div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
  <Icon className="h-6 w-6 text-brand" />
</div>
```

### Button Styles
- Primary: `bg-brand text-white rounded-xl`
- Secondary: `bg-gray-100 text-gray-700 rounded-xl`
- Danger: `bg-red-600 text-white rounded-xl`

### Card Styles
- Container: `bg-white rounded-xl border border-gray-200/80 shadow-sm`
- Hover: `hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5`

### Color Usage
- Brand accent: `text-brand`
- Primary text: `text-gray-900`
- Secondary text: `text-gray-500`
- Borders: `border-gray-200`

---

*Last updated: January 2026*
*Version: 1.0*
