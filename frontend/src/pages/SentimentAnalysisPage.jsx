import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Globe } from 'lucide-react';
import { analyzeSentiment } from '../services/api';
import FadeContent from '../components/ui/FadeContent';
import AnimatedContent from '../components/ui/AnimatedContent';
import GlassPanel from '../components/ui/GlassPanel';

export default function SentimentAnalysisPage() {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

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
            {/* Contributing Factors */}
            <AnimatedContent distance={20} direction="up" delay={150}>
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
            <AnimatedContent distance={20} direction="up" delay={200}>
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