# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the UI in this repository.

## UI Design Philosophy

Create a **minimal, elegant, dark-themed interface** with subtle glass morphism effects. The design should feel premium and modern without being overwhelming.

## Critical UI Rules

### 1. Background Usage (MANDATORY)

**Use ONLY ONE background per page:**
```jsx
// For main dashboard pages - subtle and professional
import Aurora from './components/react-bits/Backgrounds/Aurora/Aurora'

// For data-heavy pages - adds depth without distraction
import Particles from './components/react-bits/Backgrounds/Particles/Particles'

// Implementation
<div className="min-h-screen relative overflow-hidden">
  <Aurora /> {/* or <Particles /> */}
  <div className="relative z-10">
    {/* All content goes here */}
  </div>
</div>
```

**NEVER:**
- Stack multiple backgrounds
- Use bright/colorful backgrounds (avoid Threads, Lightning, etc.)
- Forget to add `relative z-10` to content container

### 2. Glass Panel Design Pattern

**Create ONE reusable GlassPanel component:**
```jsx
// components/ui/GlassPanel.jsx
const GlassPanel = ({ children, className = "", darker = false }) => (
  <div className={`
    ${darker ? 'bg-black/20' : 'bg-white/[0.02]'}
    backdrop-blur-sm
    border border-white/[0.05]
    rounded-2xl
    ${className}
  `}>
    {children}
  </div>
)
```

### 3. Color System (STRICT)

```css
/* Backgrounds */
Primary: bg-gray-950 or bg-black
Panels: bg-white/[0.02] to bg-white/[0.05]
Hover: bg-white/[0.08]

/* Text */
Primary: text-gray-100
Secondary: text-gray-400  
Muted: text-gray-500
Accent: text-violet-400 or text-purple-400

/* Borders */
Default: border-white/[0.05]
Hover: border-white/[0.1]
Focus: border-violet-500/30

/* Accents (sparingly) */
Primary: violet-500, purple-500
Gradients: from-violet-500 to-purple-600
```

### 4. Spacing & Layout System

```jsx
/* Page Container */
<div className="min-h-screen relative overflow-hidden">
  <Aurora />
  <div className="relative z-10 px-6 py-8 max-w-7xl mx-auto">

/* Section Spacing */
<div className="space-y-12"> {/* Between major sections */}
<div className="space-y-6">  {/* Between cards */}
<div className="space-y-4">  {/* Within cards */}

/* Grid Layouts */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### 5. Typography Rules

```jsx
/* Page Title */
<h1 className="text-4xl font-light text-gray-100 mb-2">
  Dashboard
</h1>
<p className="text-gray-500 text-sm">
  Analyze your data with AI-powered insights
</p>

/* Section Headers */
<h2 className="text-xl font-medium text-gray-100 mb-6">

/* Card Headers */
<h3 className="text-base font-medium text-gray-200">

/* DON'T use gradient text except for ONE hero element per page */
```

### 6. Interactive Elements

```jsx
/* Primary Button */
<button className="
  px-5 py-2.5
  bg-violet-500/10
  hover:bg-violet-500/20
  border border-violet-500/20
  text-violet-400
  rounded-xl
  transition-all duration-200
  font-medium text-sm
">

/* Secondary Button */
<button className="
  px-5 py-2.5
  bg-white/[0.03]
  hover:bg-white/[0.05]
  border border-white/[0.05]
  text-gray-300
  rounded-xl
  transition-all duration-200
  text-sm
">

/* Input Field */
<input className="
  w-full px-4 py-2.5
  bg-white/[0.02]
  border border-white/[0.05]
  rounded-xl
  text-gray-100
  placeholder-gray-600
  focus:outline-none
  focus:border-violet-500/30
  focus:bg-white/[0.03]
  transition-all duration-200
  text-sm
"/>
```

### 7. Data Display Components

```jsx
/* Metric Card */
<GlassPanel className="p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm">Total Processed</p>
      <p className="text-2xl font-light text-gray-100 mt-1">1,234</p>
    </div>
    <TrendingUp className="w-5 h-5 text-green-400/60" />
  </div>
</GlassPanel>

/* Data Table */
<GlassPanel darker className="overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-white/[0.05]">
        <th className="text-left p-4 text-gray-400 font-normal text-sm">
    </thead>
    <tbody>
      <tr className="border-b border-white/[0.03] hover:bg-white/[0.02]">
```

### 8. Animation Usage

```jsx
/* Page-level animations */
import FadeContent from './components/react-bits/Animations/FadeContent/FadeContent'

<FadeContent blur={false} duration={800}>
  {/* Entire page content */}
</FadeContent>

/* Card animations */
import AnimatedContent from './components/react-bits/Animations/AnimatedContent/AnimatedContent'

<AnimatedContent distance={20} direction="up" delay={index * 50}>
  <GlassPanel>
    {/* Card content */}
  </GlassPanel>
</AnimatedContent>

/* NEVER animate individual text elements or buttons */
```

### 9. File Upload Design

```jsx
<GlassPanel className="p-8">
  <div
    className={`
      border-2 border-dashed
      ${isDragging 
        ? 'border-violet-500/40 bg-violet-500/[0.02]' 
        : 'border-white/[0.05] hover:border-white/[0.08]'
      }
      rounded-xl p-16
      transition-all duration-300
      cursor-pointer
      group
    `}
  >
    <div className="text-center">
      <Upload className="
        w-10 h-10 
        text-gray-600 
        group-hover:text-gray-500 
        transition-colors 
        mx-auto mb-4
      " />
      <p className="text-gray-400 text-sm">
        Drop your CSV file here or click to browse
      </p>
    </div>
  </div>
</GlassPanel>
```

### 10. Chart Styling

```jsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid 
      strokeDasharray="3 3" 
      stroke="rgba(255,255,255,0.02)" 
      vertical={false}
    />
    <XAxis 
      stroke="rgba(255,255,255,0.1)"
      tick={{ fill: '#6B7280', fontSize: 12 }}
      axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
    />
    <YAxis 
      stroke="rgba(255,255,255,0.1)"
      tick={{ fill: '#6B7280', fontSize: 12 }}
      axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
    />
    <Tooltip
      contentStyle={{
        backgroundColor: 'rgba(0,0,0,0.9)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px'
      }}
      cursor={{ stroke: 'rgba(139,92,246,0.1)' }}
    />
    <Line
      type="monotone"
      dataKey="value"
      stroke="#8B5CF6"
      strokeWidth={1.5}
      dot={false}
      activeDot={{ r: 4, fill: '#8B5CF6' }}
    />
  </LineChart>
</ResponsiveContainer>
```

## What NOT to Do (CRITICAL)

### ❌ NEVER:
1. Use multiple bright colors or rainbow effects
2. Add thick borders or outlines
3. Use opacity-X classes (use /[0.X] for precise control)
4. Stack glass effects (one subtle layer only)
5. Use pure white text (use text-gray-100)
6. Create busy patterns or overwhelming animations
7. Use neon or glowing effects
8. Add shadows to glass panels (they should be subtle)
9. Use gradient backgrounds on panels
10. Mix different animation libraries

### ✅ ALWAYS:
1. Keep it minimal and breathable
2. Use consistent spacing
3. Maintain visual hierarchy with subtle contrast
4. Test on dark backgrounds
5. Use muted colors for non-critical elements
6. Keep animations smooth and subtle
7. Ensure text is readable (proper contrast)
8. Use consistent border radius (rounded-xl or rounded-2xl)
9. Keep focus states subtle
10. Let the background provide ambiance, not distraction

## Example Page Structure

```jsx
function AnalysisPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Subtle background */}
      <Aurora />
      
      {/* Content */}
      <div className="relative z-10">
        <FadeContent blur={false} duration={800}>
          <div className="px-6 py-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-light text-gray-100 mb-2">
                Data Analysis
              </h1>
              <p className="text-gray-500 text-sm">
                Upload and analyze your datasets with AI
              </p>
            </div>
            
            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload section - 2 cols */}
              <div className="lg:col-span-2">
                <AnimatedContent distance={20} direction="up">
                  <GlassPanel className="p-8">
                    {/* Upload component */}
                  </GlassPanel>
                </AnimatedContent>
              </div>
              
              {/* Stats section - 1 col */}
              <div className="space-y-6">
                {[1,2,3].map((_, i) => (
                  <AnimatedContent 
                    key={i} 
                    distance={20} 
                    direction="up" 
                    delay={i * 50}
                  >
                    <GlassPanel className="p-6">
                      {/* Stat card */}
                    </GlassPanel>
                  </AnimatedContent>
                ))}
              </div>
            </div>
          </div>
        </FadeContent>
      </div>
    </div>
  )
}
```

## Testing Your UI

Before committing, verify:
1. Background is subtle and not distracting
2. Text is readable on all glass panels
3. Interactive elements have clear hover states
4. Spacing is consistent throughout
5. No more than 2-3 accent colors visible
6. Animations are smooth and subtle
7. Glass effects are barely noticeable
8. Overall feeling is clean and professional