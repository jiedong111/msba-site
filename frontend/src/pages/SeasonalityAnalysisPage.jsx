import { useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Sun, 
  Briefcase, 
  Activity, 
  BarChart3, 
  Grid, 
  Clock, 
  GitBranch, 
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import FadeContent from '../components/ui/FadeContent';
import AnimatedContent from '../components/ui/AnimatedContent';
import GlassPanel from '../components/ui/GlassPanel';
import Aurora from '../components/react-bits/Backgrounds/Aurora';
import seasonalFindings from '../data/seasonal_findings.json';

const colors = {
  primary: '#8B5CF6',
  secondary: '#06B6D4', 
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#6B7280',
  heatmap: {
    empty: '#1F2937',
    low: '#7C3AED',
    medium: '#8B5CF6', 
    high: '#A78BFA',
    max: '#DDD6FE'
  }
};

export default function SeasonalityAnalysisPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Destructure data from JSON
  const {
    metadata,
    summary,
    distributions,
    trends,
    insights,
    visualizations
  } = seasonalFindings;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Grid },
    { id: 'temporal', label: 'Temporal Patterns', icon: Clock },
    { id: 'statistical', label: 'Statistical Analysis', icon: TrendingUp },
    { id: 'evolution', label: 'Evolution', icon: GitBranch },
    { id: 'insights', label: 'Key Insights', icon: Lightbulb }
  ];

  const metrics = [
    {
      icon: Calendar,
      label: "Peak Month",
      value: summary.peak_periods.month.name,
      subvalue: `${summary.peak_periods.month.count} announcements`,
      color: "violet"
    },
    {
      icon: TrendingUp,
      label: "Peak Quarter", 
      value: summary.peak_periods.quarter.name,
      subvalue: `${summary.peak_periods.quarter.percentage}% of total`,
      color: "cyan"
    },
    {
      icon: Sun,
      label: "Peak Season",
      value: summary.peak_periods.season.name,
      subvalue: `${summary.peak_periods.season.count} announcements`,
      color: "amber"
    },
    {
      icon: Briefcase,
      label: "Business Days",
      value: `${distributions.businessDays.weekdays.percentage}%`,
      subvalue: "Weekday preference",
      color: "emerald"
    },
    {
      icon: Activity,
      label: "Seasonality Strength",
      value: insights.keyFindings.seasonalityStrength,
      subvalue: "Peak vs Trough",
      color: "rose"
    },
    {
      icon: BarChart3,
      label: "Statistical Significance",
      value: "p < 0.001",
      subvalue: "Highly significant",
      color: "indigo"
    }
  ];

  const MetricCard = ({ metric, index }) => (
    <AnimatedContent distance={20} direction="up" delay={index * 50}>
      <GlassPanel style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              {metric.label}
            </p>
            <p style={{ color: 'var(--color-gray-100)', fontSize: '1.5rem', fontWeight: '300', marginBottom: '0.25rem' }}>
              {metric.value}
            </p>
            <p style={{ color: 'var(--color-gray-500)', fontSize: '0.75rem' }}>
              {metric.subvalue}
            </p>
          </div>
          <metric.icon style={{ width: '1.25rem', height: '1.25rem', color: `var(--color-${metric.color}-400)` }} />
        </div>
      </GlassPanel>
    </AnimatedContent>
  );

  const MonthlyDistributionChart = () => (
    <GlassPanel style={{ padding: '1.5rem' }}>
      <h3 style={{ color: 'var(--color-gray-200)', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>
        Monthly Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={distributions.monthly}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
          <XAxis 
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            dataKey="month"
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
            formatter={(value, name) => [`${value} announcements`, 'Count']}
            labelFormatter={(label) => `${label}`}
          />
          <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassPanel>
  );

  const QuarterlyBarChart = () => (
    <GlassPanel style={{ padding: '1.5rem' }}>
      <h3 style={{ color: 'var(--color-gray-200)', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>
        Quarterly Comparison
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={distributions.quarterly}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
          <XAxis 
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            dataKey="quarter"
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
            formatter={(value, name) => [`${value} announcements (${distributions.quarterly.find(q => q.quarter === name)?.percentage}%)`, 'Count']}
          />
          <Bar dataKey="count" fill={colors.secondary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassPanel>
  );

  const DayOfWeekChart = () => (
    <GlassPanel style={{ padding: '1.5rem' }}>
      <h3 style={{ color: 'var(--color-gray-200)', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>
        Day of Week Pattern
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={distributions.dayOfWeek}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
          <XAxis 
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            dataKey="day"
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
            formatter={(value, name) => [`${value} announcements`, 'Count']}
          />
          <Bar 
            dataKey="count" 
            fill={colors.positive}
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </GlassPanel>
  );

  const SeasonalPieChart = () => (
    <GlassPanel style={{ padding: '1.5rem' }}>
      <h3 style={{ color: 'var(--color-gray-200)', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>
        Seasonal Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={distributions.seasonal}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill={colors.primary}
            dataKey="count"
            label={({ season, percentage }) => `${season}: ${percentage}%`}
          >
            {distributions.seasonal.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={[colors.primary, colors.secondary, colors.positive, colors.neutral][index % 4]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.9)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </GlassPanel>
  );

  const YearlyTrendChart = () => (
    <GlassPanel style={{ padding: '1.5rem' }}>
      <h3 style={{ color: 'var(--color-gray-200)', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>
        Yearly Trend
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={trends.yearly}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
          <XAxis 
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            dataKey="year"
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
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={colors.primary}
            strokeWidth={2}
            dot={{ fill: colors.primary, r: 4 }}
            activeDot={{ r: 6, fill: colors.primary }}
          />
        </LineChart>
      </ResponsiveContainer>
    </GlassPanel>
  );

  const StatisticalTestsPanel = () => (
    <GlassPanel style={{ padding: '1.5rem' }}>
      <h3 style={{ color: 'var(--color-gray-200)', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>
        Statistical Significance Tests
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {Object.entries(insights.statisticalTests).map(([test, data]) => (
          <div key={test} style={{ 
            padding: '1rem',
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle style={{ 
                width: '1rem', 
                height: '1rem', 
                color: data.significant ? colors.positive : colors.negative 
              }} />
              <h4 style={{ color: 'var(--color-gray-200)', fontSize: '0.875rem', fontWeight: '500', textTransform: 'capitalize' }}>
                {test}
              </h4>
            </div>
            <p style={{ color: 'var(--color-gray-400)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              χ² = {data.chi2.toFixed(2)}
            </p>
            <p style={{ color: 'var(--color-gray-400)', fontSize: '0.75rem' }}>
              p {data.pValue === 0 ? '< 0.001' : `= ${data.pValue}`}
            </p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );

  const SeasonalRadarChart = () => {
    const radarData = Object.entries(insights.seasonalIndices).map(([month, index]) => ({
      month: month.substring(0, 3),
      index: index,
      average: 100
    }));

    return (
      <GlassPanel style={{ padding: '1.5rem' }}>
        <h3 style={{ color: 'var(--color-gray-200)', fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>
          Seasonal Indices
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
            <PolarRadiusAxis 
              tick={{ fill: '#6B7280', fontSize: 10 }} 
              tickCount={6}
              domain={[0, 'dataMax']}
            />
            <Radar
              name="Seasonal Index"
              dataKey="index"
              stroke={colors.primary}
              fill={colors.primary}
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Average"
              dataKey="average"
              stroke={colors.neutral}
              fill="transparent"
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </GlassPanel>
    );
  };

  const KeyFindingsGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
      {Object.entries(insights.keyFindings).map(([key, value], index) => (
        <AnimatedContent key={key} distance={20} direction="up" delay={index * 50}>
          <GlassPanel style={{ padding: '1.5rem' }}>
            <h4 style={{ 
              color: 'var(--color-gray-200)', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              marginBottom: '0.5rem',
              textTransform: 'capitalize'
            }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <p style={{ color: 'var(--color-gray-100)', fontSize: '1.25rem', fontWeight: '300' }}>
              {value}
            </p>
          </GlassPanel>
        </AnimatedContent>
      ))}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <MonthlyDistributionChart />
            <QuarterlyBarChart />
            <DayOfWeekChart />
            <SeasonalPieChart />
          </div>
        );
      case 'temporal':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <YearlyTrendChart />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
              <SeasonalRadarChart />
            </div>
          </div>
        );
      case 'statistical':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <StatisticalTestsPanel />
          </div>
        );
      case 'evolution':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <YearlyTrendChart />
          </div>
        );
      case 'insights':
        return <KeyFindingsGrid />;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: 'black' }}>
      <Aurora />
      
      <div style={{ position: 'relative', zIndex: 10 }}>
        <FadeContent blur={false} duration={800}>
          <div style={{ padding: '2rem 1.5rem', maxWidth: '80rem', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '3rem' }}>
              <h1 style={{
                fontSize: '2.25rem',
                fontWeight: '300',
                color: 'var(--color-gray-100)',
                marginBottom: '0.5rem'
              }}>
                Seasonality Analysis
              </h1>
              <p style={{
                color: 'var(--color-gray-500)',
                fontSize: '0.875rem'
              }}>
                Analysis of {metadata.total_records} records from {metadata.date_range.start} to {metadata.date_range.end}
              </p>
            </div>
            
            {/* Metrics Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem', 
              marginBottom: '3rem' 
            }}>
              {metrics.map((metric, index) => (
                <MetricCard key={metric.label} metric={metric} index={index} />
              ))}
            </div>

            {/* Tab Navigation */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: activeTab === tab.id ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      border: activeTab === tab.id ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '0.75rem',
                      color: activeTab === tab.id ? 'var(--color-violet-400)' : 'var(--color-gray-300)',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <tab.icon style={{ width: '1rem', height: '1rem' }} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {renderTabContent()}
            </div>
          </div>
        </FadeContent>
      </div>
    </div>
  );
}