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

  // Utility function to get feature value with proper fallback
  const getFeatureValue = (featureName, defaultValue) => {
    return featureValues[featureName] !== undefined ? featureValues[featureName] : defaultValue;
  };

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
    // Validate that the value is within bounds for slider features
    const feature = features.find(f => f.name === featureName);
    if (feature && feature.type === 'slider') {
      const min = feature.min_value;
      const max = feature.max_value;
      const step = feature.step || 1;
      
      // Ensure value is within bounds
      const clampedValue = Math.max(min, Math.min(max, value));
      // Round to step precision
      const roundedValue = Math.round(clampedValue / step) * step;
      
      setFeatureValues(prev => ({
        ...prev,
        [featureName]: roundedValue
      }));
    } else {
      setFeatureValues(prev => ({
        ...prev,
        [featureName]: value
      }));
    }
  };

  const setPreset = (presetType) => {
    const presets = {
      'low-risk': {
        'Number of Investors': 8,
        'Trademarks Registered': 5,
        'Number of Events': 25,
        'Financing for entrepreneurs': 8.0,
        'Governmental support and policies': 8.0,
        'Taxes and bureaucracy': 7.0,
        'Governmental programs': 8.0,
        'R&D transfer': 8.0,
        'Commercial and professional infrastructure': 8.0,
        'Internal market dynamics': 8.0,
        'Internal market openness': 8.0,
        'Cultural and social norms': 8.0,
        'Diversity Spotlight Dummy': true,
        'Repeat_Founder': true,
        'High Tech Dummy': true,
        'Food and Restaurant Dummy': false,
        'America Dummy': true,
        'Asia Dummy': false,
        'Middle East Dummy': false
      },
      'average': {
        'Number of Investors': 3,
        'Trademarks Registered': 2,
        'Number of Events': 10,
        'Financing for entrepreneurs': 5.0,
        'Governmental support and policies': 5.0,
        'Taxes and bureaucracy': 5.0,
        'Governmental programs': 5.0,
        'R&D transfer': 5.0,
        'Commercial and professional infrastructure': 5.0,
        'Internal market dynamics': 5.0,
        'Internal market openness': 5.0,
        'Cultural and social norms': 5.0,
        'Diversity Spotlight Dummy': false,
        'Repeat_Founder': false,
        'High Tech Dummy': true,
        'Food and Restaurant Dummy': false,
        'America Dummy': true,
        'Asia Dummy': false,
        'Middle East Dummy': false
      },
      'high-risk': {
        'Number of Investors': 0,
        'Trademarks Registered': 0,
        'Number of Events': 1,
        'Financing for entrepreneurs': 2.0,
        'Governmental support and policies': 2.0,
        'Taxes and bureaucracy': 3.0,
        'Governmental programs': 2.0,
        'R&D transfer': 2.0,
        'Commercial and professional infrastructure': 2.0,
        'Internal market dynamics': 2.0,
        'Internal market openness': 2.0,
        'Cultural and social norms': 2.0,
        'Diversity Spotlight Dummy': false,
        'Repeat_Founder': false,
        'High Tech Dummy': false,
        'Food and Restaurant Dummy': true,
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
          <div className="px-6 py-6 pb-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-3xl font-light text-gray-100 mb-1">
                Startup Risk Calculator
              </h1>
              <p className="text-gray-500 text-sm">
                Adjust parameters to see real-time failure risk predictions
              </p>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              
              {/* Left Column - Controls */}
              <div className="lg:col-span-2 flex flex-col space-y-4">

                {/* Top Controls - Fixed */}
                <div className="space-y-4 flex-shrink-0">
                  {/* Model Selection */}
                  <AnimatedContent distance={20} direction="up">
                    <GlassPanel className="p-4">
                      <h2 className="text-lg font-medium text-gray-100 mb-3 flex items-center">
                        <Calculator className="w-4 h-4 mr-2 text-violet-400" />
                        Model Selection
                      </h2>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 bg-black/50 border border-white/[0.05] rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500/30 focus:bg-black/70 transition-all duration-200 text-sm"
                      >
                        {models.map(model => (
                          <option key={model.name} value={model.name} className="bg-black text-gray-100">
                            {model.display_name}
                          </option>
                        ))}
                      </select>
                    </GlassPanel>
                  </AnimatedContent>

                  {/* Preset Buttons */}
                  <AnimatedContent distance={20} direction="up" delay={50}>
                    <GlassPanel className="p-4">
                      <h3 className="text-base font-medium text-gray-200 mb-3">Quick Presets</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setPreset('low-risk')}
                          className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                          Low Risk
                        </button>
                        <button
                          onClick={() => setPreset('average')}
                          className="px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                          Average
                        </button>
                        <button
                          onClick={() => setPreset('high-risk')}
                          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                          High Risk
                        </button>
                      </div>
                    </GlassPanel>
                  </AnimatedContent>
                </div>

                {/* Feature Controls - Scrollable */}
                <AnimatedContent distance={20} direction="up" delay={100}>
                  <GlassPanel className="p-4">
                    <h3 className="text-base font-medium text-gray-200 mb-4">Startup Parameters</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar pb-2">
                      {features.map((feature, index) => (
                        <div key={feature.name} className="space-y-2 pb-3 border-b border-white/[0.05] last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-300">
                              {feature.display_name}
                            </label>
                            <span className="text-sm text-gray-400">
                              {(() => {
                                const value = getFeatureValue(feature.name, feature.default_value);
                                if (feature.name === "Number of Investors") {
                                  return value.toFixed(0);
                                }
                                if (feature.name === "Trademarks Registered") {
                                  return value.toFixed(0);
                                }
                                if (feature.name === "Number of Events") {
                                  return value.toFixed(0);
                                }
                                if (feature.name === "Financing for entrepreneurs") {
                                  return value.toFixed(1);
                                }
                                if (feature.name === "Governmental support and policies") {
                                  return value.toFixed(1);
                                }
                                if (feature.name === "Taxes and bureaucracy") {
                                  return value.toFixed(1);
                                }
                                if (feature.name === "Governmental programs") {
                                  return value.toFixed(1);
                                }
                                if (feature.name === "R&D transfer") {
                                  return value.toFixed(1);
                                }
                                if (feature.name === "Commercial and professional infrastructure") {
                                  return value.toFixed(1);
                                }
                                if (feature.name === "Internal market dynamics") {
                                  return value.toFixed(1);
                                }
                                if (feature.name === "Internal market openness") {
                                  return value.toFixed(1);
                                }
                                if (feature.name === "Cultural and social norms") {
                                  return value.toFixed(1);
                                }
                                return value;
                              })()}
                            </span>
                          </div>
                          
                          {feature.type === 'slider' ? (
                            <div className="relative">
                              <input
                                type="range"
                                min={feature.min_value}
                                max={feature.max_value}
                                step={feature.step || 1}
                                value={getFeatureValue(feature.name, feature.default_value)}
                                onChange={(e) => handleFeatureChange(feature.name, parseFloat(e.target.value))}
                                className="w-full h-2 bg-white/[0.05] rounded-lg appearance-none cursor-pointer slider"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <button
                                onClick={() => handleFeatureChange(feature.name, !getFeatureValue(feature.name, false))}
                                className={`
                                  relative inline-flex h-6 w-11 items-center rounded-full
                                  transition-colors duration-200 ease-in-out
                                  ${getFeatureValue(feature.name, false) 
                                    ? 'bg-violet-500' 
                                    : 'bg-white/[0.05]'
                                  }
                                `}
                              >
                                <span
                                  className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white
                                    transition-transform duration-200 ease-in-out
                                    ${getFeatureValue(feature.name, false) ? 'translate-x-6' : 'translate-x-1'}
                                  `}
                                />
                              </button>
                              <span className="ml-3 text-sm text-gray-400">
                                {getFeatureValue(feature.name, false) ? 'Yes' : 'No'}
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
              <div className="space-y-4">
                
                {/* Risk Score Display */}
                <AnimatedContent distance={20} direction="up" delay={150}>
                  <GlassPanel className="p-4 text-center">
                    <h3 className="text-base font-medium text-gray-200 mb-4 flex items-center justify-center">
                      <Target className="w-4 h-4 mr-2 text-violet-400" />
                      Failure Risk
                    </h3>
                    
                    {loading ? (
                      <div className="space-y-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-violet-400 border-t-transparent mx-auto" />
                        <p className="text-gray-400 text-sm">Calculating...</p>
                      </div>
                    ) : riskResult ? (
                      <div className="space-y-4">
                        {/* Risk Gauge */}
                        <div className="relative w-24 h-12 mx-auto">
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
                          <div className="text-2xl font-light text-gray-100 mb-2">
                            {(riskResult.risk_score * 100).toFixed(1)}%
                          </div>
                          <div className={`
                            inline-block px-2 py-1 rounded-full text-xs font-medium
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
                    <GlassPanel className="p-4">
                      <h3 className="text-base font-medium text-gray-200 mb-3 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-orange-400" />
                        Key Risk Factors
                      </h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {riskResult.key_factors.map((factor, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-300">
                                {factor.factor}
                              </span>
                              <span className={`
                                text-xs px-1 py-0.5 rounded-full
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
                    <GlassPanel className="p-4">
                      <h3 className="text-base font-medium text-gray-200 mb-3 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
                        Recommendations
                      </h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {riskResult.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="w-1 h-1 bg-violet-400 rounded-full mt-1.5 flex-shrink-0" />
                            <p className="text-xs text-gray-300">{recommendation}</p>
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
                <GlassPanel className="p-3 border-red-500/20 bg-red-500/[0.02] mt-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                </GlassPanel>
              </AnimatedContent>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/[0.05]">
              <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
                <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                  <span>MSBA Risk Assessment Tool</span>
                  <span>•</span>
                  <span>Powered by Machine Learning</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span>Real-time Analysis</span>
                  <span>•</span>
                  <span>Startup Risk Prediction</span>
                </div>
              </div>
            </div>
          </div>
        </FadeContent>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}