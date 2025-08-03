import { useState, useEffect, useCallback } from 'react';
import { Calculator, TrendingUp, AlertTriangle, Target, Lightbulb } from 'lucide-react';
import { calculateRisk, getRiskFeatures, getRiskModels } from '../services/api';
import FadeContent from '../components/ui/FadeContent';
import AnimatedContent from '../components/ui/AnimatedContent';
import GlassPanel from '../components/ui/GlassPanel';
import SimpleParticles from '../components/ui/SimpleParticles';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function RiskCalculatorPage() {
  const [features, setFeatures] = useState([]);
  const [featureValues, setFeatureValues] = useState({});
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('xgboost_model');
  const [riskResult, setRiskResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce feature values to prevent too many API calls
  const debouncedFeatureValues = useDebounce(featureValues, 300);

  // Load features and models on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [featuresData, modelsData] = await Promise.all([
          getRiskFeatures(),
          getRiskModels()
        ]);
        
        setFeatures(featuresData.features || []);
        setModels(modelsData.models || []);
        
        // Set default feature values
        const defaults = {};
        featuresData.features?.forEach(feature => {
          defaults[feature.name] = feature.default_value;
        });
        setFeatureValues(defaults);
        
      } catch (err) {
        setError('Failed to load risk calculator data');
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, []);

  // Calculate risk when feature values change
  useEffect(() => {
    if (Object.keys(debouncedFeatureValues).length > 0) {
      calculateRiskScore();
    }
  }, [debouncedFeatureValues, selectedModel]);

  const calculateRiskScore = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await calculateRisk(debouncedFeatureValues, selectedModel);
      setRiskResult(result);
    } catch (err) {
      setError('Failed to calculate risk score');
      console.error('Risk calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureChange = (featureName, value) => {
    setFeatureValues(prev => ({
      ...prev,
      [featureName]: value
    }));
  };

  const setPreset = (presetType) => {
    const presets = {
      'low-risk': {
        'Number of Investors': 8,
        'Trademarks Registered': 5,
        'Number of Events': 25,
        'Financing for entrepreneurs': 6.5,
        'Governmental support and policies': 6.0,
        'R&D transfer': 6.0,
        'Commercial and professional infrastructure': 6.5,
        'Internal market dynamics': 6.0,
        'Diversity Spotlight Dummy': true,
        'Repeat_Founder': true,
        'High Tech Dummy': true,
        'America Dummy': true,
        'Asia Dummy': false,
        'Middle East Dummy': false
      },
      'average': {
        'Number of Investors': 3,
        'Trademarks Registered': 2,
        'Number of Events': 10,
        'Financing for entrepreneurs': 4.5,
        'Governmental support and policies': 4.0,
        'R&D transfer': 4.0,
        'Commercial and professional infrastructure': 5.0,
        'Internal market dynamics': 4.5,
        'Diversity Spotlight Dummy': false,
        'Repeat_Founder': false,
        'High Tech Dummy': true,
        'America Dummy': true,
        'Asia Dummy': false,
        'Middle East Dummy': false
      },
      'high-risk': {
        'Number of Investors': 0,
        'Trademarks Registered': 0,
        'Number of Events': 1,
        'Financing for entrepreneurs': 2.0,
        'Governmental support and policies': 2.5,
        'R&D transfer': 2.5,
        'Commercial and professional infrastructure': 3.0,
        'Internal market dynamics': 3.0,
        'Diversity Spotlight Dummy': false,
        'Repeat_Founder': false,
        'High Tech Dummy': false,
        'America Dummy': false,
        'Asia Dummy': true,
        'Middle East Dummy': false
      }
    };

    setFeatureValues(prev => ({
      ...prev,
      ...presets[presetType]
    }));
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRiskGaugeRotation = (riskScore) => {
    // Convert 0-1 score to -90 to 90 degrees (semicircle)
    return -90 + (riskScore * 180);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <SimpleParticles />
      
      <div className="relative z-10">
        <FadeContent blur={false} duration={800}>
          <div className="px-6 py-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-light text-gray-100 mb-2">
                Startup Risk Calculator
              </h1>
              <p className="text-gray-500 text-sm">
                Adjust parameters to see real-time failure risk predictions
              </p>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Controls */}
              <div className="lg:col-span-2 space-y-6">

                {/* Model Selection */}
                <AnimatedContent distance={20} direction="up">
                  <GlassPanel className="p-6">
                    <h2 className="text-xl font-medium text-gray-100 mb-4 flex items-center">
                      <Calculator className="w-5 h-5 mr-2 text-violet-400" />
                      Model Selection
                    </h2>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500/30 focus:bg-white/[0.03] transition-all duration-200 text-sm"
                    >
                      {models.map(model => (
                        <option key={model.name} value={model.name}>
                          {model.display_name}
                        </option>
                      ))}
                    </select>
                  </GlassPanel>
                </AnimatedContent>

                {/* Preset Buttons */}
                <AnimatedContent distance={20} direction="up" delay={50}>
                  <GlassPanel className="p-6">
                    <h3 className="text-lg font-medium text-gray-200 mb-4">Quick Presets</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setPreset('low-risk')}
                        className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl transition-all duration-200 text-sm font-medium"
                      >
                        Low Risk
                      </button>
                      <button
                        onClick={() => setPreset('average')}
                        className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 rounded-xl transition-all duration-200 text-sm font-medium"
                      >
                        Average
                      </button>
                      <button
                        onClick={() => setPreset('high-risk')}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all duration-200 text-sm font-medium"
                      >
                        High Risk
                      </button>
                    </div>
                  </GlassPanel>
                </AnimatedContent>

                {/* Feature Controls */}
                <AnimatedContent distance={20} direction="up" delay={100}>
                  <GlassPanel className="p-6">
                    <h3 className="text-lg font-medium text-gray-200 mb-6">Startup Parameters</h3>
                    <div className="space-y-6">
                      {features.map((feature, index) => (
                        <div key={feature.name} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-300">
                              {feature.display_name}
                            </label>
                            <span className="text-sm text-gray-400">
                              {featureValues[feature.name]}
                            </span>
                          </div>
                          
                          {feature.type === 'slider' ? (
                            <div className="relative">
                              <input
                                type="range"
                                min={feature.min_value}
                                max={feature.max_value}
                                step={feature.step || 1}
                                value={featureValues[feature.name] || feature.default_value}
                                onChange={(e) => handleFeatureChange(feature.name, parseFloat(e.target.value))}
                                className="w-full h-2 bg-white/[0.05] rounded-lg appearance-none cursor-pointer slider"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <button
                                onClick={() => handleFeatureChange(feature.name, !featureValues[feature.name])}
                                className={`
                                  relative inline-flex h-6 w-11 items-center rounded-full
                                  transition-colors duration-200 ease-in-out
                                  ${featureValues[feature.name] 
                                    ? 'bg-violet-500' 
                                    : 'bg-white/[0.05]'
                                  }
                                `}
                              >
                                <span
                                  className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white
                                    transition-transform duration-200 ease-in-out
                                    ${featureValues[feature.name] ? 'translate-x-6' : 'translate-x-1'}
                                  `}
                                />
                              </button>
                              <span className="ml-3 text-sm text-gray-400">
                                {featureValues[feature.name] ? 'Yes' : 'No'}
                              </span>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500">{feature.description}</p>
                        </div>
                      ))}
                    </div>
                  </GlassPanel>
                </AnimatedContent>
              </div>

              {/* Right Column - Results */}
              <div className="space-y-6">
                
                {/* Risk Score Display */}
                <AnimatedContent distance={20} direction="up" delay={150}>
                  <GlassPanel className="p-6 text-center">
                    <h3 className="text-lg font-medium text-gray-200 mb-6 flex items-center justify-center">
                      <Target className="w-5 h-5 mr-2 text-violet-400" />
                      Failure Risk
                    </h3>
                    
                    {loading ? (
                      <div className="space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-2 border-violet-400 border-t-transparent mx-auto" />
                        <p className="text-gray-400 text-sm">Calculating...</p>
                      </div>
                    ) : riskResult ? (
                      <div className="space-y-6">
                        {/* Risk Gauge */}
                        <div className="relative w-32 h-16 mx-auto">
                          <svg viewBox="0 0 100 50" className="w-full h-full">
                            {/* Background arc */}
                            <path
                              d="M 10 40 A 30 30 0 0 1 90 40"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="8"
                              fill="none"
                            />
                            {/* Risk arc */}
                            <path
                              d="M 10 40 A 30 30 0 0 1 90 40"
                              stroke={getRiskColor(riskResult.risk_level)}
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${(riskResult.risk_score * 126)} 126`}
                              className="transition-all duration-500 ease-in-out"
                            />
                            {/* Needle */}
                            <line
                              x1="50"
                              y1="40"
                              x2="50"
                              y2="20"
                              stroke={getRiskColor(riskResult.risk_level)}
                              strokeWidth="2"
                              transform={`rotate(${getRiskGaugeRotation(riskResult.risk_score)} 50 40)`}
                              className="transition-transform duration-500 ease-in-out"
                            />
                          </svg>
                        </div>
                        
                        {/* Risk Score */}
                        <div>
                          <div className="text-3xl font-light text-gray-100 mb-2">
                            {(riskResult.risk_score * 100).toFixed(1)}%
                          </div>
                          <div className={`
                            inline-block px-3 py-1 rounded-full text-sm font-medium
                            ${riskResult.risk_level === 'low' ? 'bg-green-500/20 text-green-400' :
                              riskResult.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'}
                          `}>
                            {riskResult.risk_level.toUpperCase()} RISK
                          </div>
                        </div>
                        
                        {/* Confidence */}
                        <div className="text-xs text-gray-500">
                          Confidence: {(riskResult.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        Adjust parameters to see risk assessment
                      </div>
                    )}
                  </GlassPanel>
                </AnimatedContent>

                {/* Key Factors */}
                {riskResult?.key_factors?.length > 0 && (
                  <AnimatedContent distance={20} direction="up" delay={200}>
                    <GlassPanel className="p-6">
                      <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
                        Key Risk Factors
                      </h3>
                      <div className="space-y-3">
                        {riskResult.key_factors.map((factor, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-300">
                                {factor.factor}
                              </span>
                              <span className={`
                                text-xs px-2 py-1 rounded-full
                                ${factor.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                                  factor.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'}
                              `}>
                                {factor.impact}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{factor.description}</p>
                          </div>
                        ))}
                      </div>
                    </GlassPanel>
                  </AnimatedContent>
                )}

                {/* Recommendations */}
                {riskResult?.recommendations?.length > 0 && (
                  <AnimatedContent distance={20} direction="up" delay={250}>
                    <GlassPanel className="p-6">
                      <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                        Recommendations
                      </h3>
                      <div className="space-y-3">
                        {riskResult.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-sm text-gray-300">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </GlassPanel>
                  </AnimatedContent>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <AnimatedContent distance={20} direction="up" delay={300}>
                <GlassPanel className="p-4 border-red-500/20 bg-red-500/[0.02] mt-6">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                </GlassPanel>
              </AnimatedContent>
            )}
          </div>
        </FadeContent>
      </div>
    </div>
  );
}