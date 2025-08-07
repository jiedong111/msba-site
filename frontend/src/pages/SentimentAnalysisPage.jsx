import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Globe, BarChart3, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { analyzeSentiment } from '../services/api';
import FadeContent from '../components/ui/FadeContent';
import AnimatedContent from '../components/ui/AnimatedContent';
import GlassPanel from '../components/ui/GlassPanel';

export default function SentimentAnalysisPage() {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [temporalData, setTemporalData] = useState(null);
  const [loadingTemporal, setLoadingTemporal] = useState(false);

  const handleAnalysis = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeSentiment(companyName);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze sentiment');
    } finally {
      setLoading(false);
    }
  };

  // Fetch temporal sentiment data when regular analysis completes
  const fetchTemporalSentiment = async () => {
    if (!companyName.trim()) return;
    
    setLoadingTemporal(true);
    try {
      const response = await fetch(`/api/sentiment/temporal/${encodeURIComponent(companyName)}?months=6`);
      if (!response.ok) throw new Error('Failed to fetch temporal data');
      
      const data = await response.json();
      
      // Transform for Recharts
      const chartData = data.data.map(d => ({
        period: d.period.split(' ')[0].substring(0, 3), // Short month name
        fullPeriod: d.period,
        sentiment: parseFloat((d.sentiment * 100).toFixed(1)),
        ma: parseFloat((d.ma * 100).toFixed(1)),
        confidence: parseFloat((d.confidence * 100).toFixed(0)),
        sources: d.sources
      }));
      
      setTemporalData({
        chart: chartData,
        stats: data.stats,
        company: data.company
      });
    } catch (error) {
      console.error('Failed to fetch temporal sentiment:', error);
    } finally {
      setLoadingTemporal(false);
    }
  };

  // Trigger temporal analysis when regular analysis completes
  useEffect(() => {
    if (results) {
      fetchTemporalSentiment();
    }
  }, [results]);

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return <CheckCircle className="text-green-400/60" size={20} />;
      case 'medium':
        return <AlertTriangle className="text-yellow-400/60" size={20} />;
      case 'high':
        return <TrendingDown className="text-red-400/60" size={20} />;
      default:
        return null;
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-400 border-green-400/20 bg-green-400/[0.02]';
      case 'medium':
        return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/[0.02]';
      case 'high':
        return 'text-red-400 border-red-400/20 bg-red-400/[0.02]';
      default:
        return '';
    }
  };

  return (
    <FadeContent blur={false} duration={800}>
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-100 mb-2">
            Sentiment Analysis
          </h1>
          <p className="text-gray-500 text-sm">
            Analyze company sentiment and risk using web data and AI
          </p>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input section - 2 cols */}
          <div className="lg:col-span-2">
            <AnimatedContent distance={20} direction="up">
              <GlassPanel className="p-8">
                <form onSubmit={handleAnalysis} className="space-y-6">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Company Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500/30 focus:bg-white/[0.03] transition-all duration-200 text-sm pr-12"
                        placeholder="Enter company name (e.g., Apple, Microsoft)"
                      />
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <GlassPanel className="p-4 border-red-500/20 bg-red-500/[0.02]">
                      <p className="text-red-400 text-sm">{error}</p>
                    </GlassPanel>
                  )}

                  <button
                    type="submit"
                    disabled={!companyName.trim() || loading}
                    className="w-full px-5 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 rounded-xl transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-400 border-t-transparent" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp size={16} />
                        <span>Analyze Sentiment</span>
                      </>
                    )}
                  </button>
                </form>
              </GlassPanel>
            </AnimatedContent>
          </div>
          
          {/* Quick stats section - 1 col */}
          <div className="space-y-6">
            {results && (
              <>
                <AnimatedContent distance={20} direction="up" delay={50}>
                  <GlassPanel className="p-6">
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">Sentiment Score</p>
                      <p className="text-3xl font-light text-gray-100 mt-1">
                        {(results.sentiment_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  </GlassPanel>
                </AnimatedContent>
                
                <AnimatedContent distance={20} direction="up" delay={100}>
                  <GlassPanel className={`p-6 border ${getRiskColor(results.risk_level)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">Risk Level</p>
                        <p className="text-xl font-medium mt-1 capitalize">{results.risk_level}</p>
                      </div>
                      {getRiskIcon(results.risk_level)}
                    </div>
                  </GlassPanel>
                </AnimatedContent>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="mt-12 space-y-6">
            {/* Temporal Sentiment Wave */}
            {loadingTemporal ? (
              <AnimatedContent distance={20} direction="up" delay={150}>
                <GlassPanel className="p-8">
                  <div className="flex items-center justify-center h-64">
                    <div className="space-y-4 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-400 border-t-transparent mx-auto" />
                      <p className="text-gray-400">Analyzing historical sentiment patterns...</p>
                    </div>
                  </div>
                </GlassPanel>
              </AnimatedContent>
            ) : temporalData && (
              <AnimatedContent distance={20} direction="up" delay={150}>
                <GlassPanel className="p-8">
                  <h2 className="text-xl font-medium text-gray-100 mb-6 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-violet-400" />
                    Sentiment Trend Analysis
                  </h2>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800/20 p-4 rounded-xl border border-white/[0.05]">
                      <p className="text-gray-500 text-sm">Current</p>
                      <p className="text-2xl font-light text-violet-400">
                        {(temporalData.stats.current * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-gray-800/20 p-4 rounded-xl border border-white/[0.05]">
                      <p className="text-gray-500 text-sm">Average</p>
                      <p className="text-2xl font-light text-gray-100">
                        {(temporalData.stats.mean * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-gray-800/20 p-4 rounded-xl border border-white/[0.05]">
                      <p className="text-gray-500 text-sm">Volatility</p>
                      <p className="text-2xl font-light text-yellow-400">
                        {temporalData.stats.volatility}
                      </p>
                    </div>
                    <div className="bg-gray-800/20 p-4 rounded-xl border border-white/[0.05]">
                      <p className="text-gray-500 text-sm">Trend</p>
                      <div className="flex items-center space-x-2">
                        {temporalData.stats.trend === 'rising' ? (
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        ) : temporalData.stats.trend === 'falling' ? (
                          <TrendingDown className="w-5 h-5 text-red-400" />
                        ) : (
                          <BarChart3 className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-lg font-light text-gray-100 capitalize">
                          {temporalData.stats.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={temporalData.chart}>
                        <defs>
                          <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                          </linearGradient>
                          <linearGradient id="maGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="rgba(255,255,255,0.03)" 
                          vertical={false}
                        />
                        
                        <XAxis 
                          dataKey="period" 
                          stroke="rgba(255,255,255,0.4)"
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        
                        <YAxis 
                          stroke="rgba(255,255,255,0.4)"
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            padding: '12px',
                            fontSize: '12px'
                          }}
                          formatter={(value, name) => {
                            if (name === 'sentiment') return [`${value}%`, 'Sentiment'];
                            if (name === 'ma') return [`${value}%`, 'Moving Average'];
                            return [value, name];
                          }}
                          labelFormatter={(label, payload) => {
                            const data = payload?.[0]?.payload;
                            return data ? `${data.fullPeriod} (${data.sources} sources)` : label;
                          }}
                        />
                        
                        <Area
                          type="monotone"
                          dataKey="sentiment"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fill="url(#sentGradient)"
                          name="sentiment"
                        />
                        
                        {/* Moving Average Line - We'll overlay this as another Area with no fill */}
                        <Area
                          type="monotone"
                          dataKey="ma"
                          stroke="#10b981"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          fill="none"
                          name="ma"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-gray-500 text-xs">
                      * Analysis based on temporal search results for each period
                    </p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-0.5 bg-violet-400 rounded"></div>
                        <span className="text-gray-500">Sentiment</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-0.5 bg-green-400 rounded" style={{backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #10b981 2px, #10b981 4px)'}}></div>
                        <span className="text-gray-500">3-Period MA</span>
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              </AnimatedContent>
            )}

            {/* Contributing Factors */}
            <AnimatedContent distance={20} direction="up" delay={200}>
              <GlassPanel className="p-8">
                <h2 className="text-xl font-medium text-gray-100 mb-6">Contributing Factors</h2>
                <div className="space-y-3">
                  {results.contributing_factors.map((factor, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                      <p className="text-gray-400 text-sm">{factor}</p>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </AnimatedContent>

            {/* Web Sources */}
            <AnimatedContent distance={20} direction="up" delay={250}>
              <GlassPanel className="p-8">
                <h2 className="text-xl font-medium text-gray-100 mb-6">Web Sources</h2>
                <div className="space-y-4">
                  {results.web_sources.map((source, index) => (
                    <GlassPanel key={index} darker className="p-4 hover:bg-white/[0.03] transition-all duration-200">
                      <div className="flex items-start space-x-3">
                        <Globe className="text-gray-600 mt-1 flex-shrink-0" size={14} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-200 text-sm mb-1 truncate">{source.title}</h4>
                          <p className="text-gray-500 text-xs leading-relaxed">{source.snippet}</p>
                        </div>
                      </div>
                    </GlassPanel>
                  ))}
                </div>
              </GlassPanel>
            </AnimatedContent>
          </div>
        )}
      </div>
    </FadeContent>
  );
}