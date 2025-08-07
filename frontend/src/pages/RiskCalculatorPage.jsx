import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Calculator, TrendingUp, AlertTriangle, Target, Lightbulb } from 'lucide-react';
import { calculateRisk, getRiskFeatures, getRiskModels } from '../services/api';
import FadeContent from '../components/ui/FadeContent';
import AnimatedContent from '../components/ui/AnimatedContent';
import GlassPanel from '../components/ui/GlassPanel';
import SimpleParticles from '../components/ui/SimpleParticles';

// Simple debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function RiskCalculatorPage() {
  const [features, setFeatures] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('xgboost_model');
  const [riskResult, setRiskResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const formRef = useRef(null);

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
        
        // Initial calculation will happen via form change event
      } catch (err) {
        setError('Failed to load risk calculator data');
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, []);

  // Calculate risk from form data
  const calculateRiskScore = useCallback(async () => {
    if (!formRef.current || features.length === 0) return;
    
    const formData = new FormData(formRef.current);
    const values = {};
    
    features.forEach(feature => {
      const value = formData.get(feature.name);
      if (feature.type === 'slider') {
        values[feature.name] = parseFloat(value);
      } else {
        // Toggle switches
        values[feature.name] = value === 'on';
      }
    });
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await calculateRisk(values, selectedModel);
      setRiskResult(result);
    } catch (err) {
      setError('Failed to calculate risk score');
      console.error('Risk calculation error:', err);
    } finally {
      setLoading(false);
    }
  }, [features, selectedModel]);

  // Debounced calculation
  const debouncedCalculate = useMemo(
    () => debounce(calculateRiskScore, 500),
    [calculateRiskScore]
  );

  // Trigger initial calculation when features are loaded
  useEffect(() => {
    if (features.length > 0) {
      calculateRiskScore();
    }
  }, [features.length, calculateRiskScore]);

  // Handle model change
  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
    debouncedCalculate();
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

  // Format display value for features
  const formatDisplayValue = (feature, value) => {
    const integerFeatures = ["Number of Investors", "Trademarks Registered", "Number of Events"];
    const decimalFeatures = [
      "Financing for entrepreneurs",
      "Governmental support and policies",
      "Taxes and bureaucracy",
      "Governmental programs",
      "R&D transfer",
      "Commercial and professional infrastructure",
      "Internal market dynamics",
      "Internal market openness",
      "Cultural and social norms"
    ];
    
    if (integerFeatures.includes(feature.name)) {
      return parseFloat(value).toFixed(0);
    }
    if (decimalFeatures.includes(feature.name)) {
      return parseFloat(value).toFixed(1);
    }
    return value;
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
            <form ref={formRef} onChange={debouncedCalculate}>
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
                          onChange={handleModelChange}
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
                  </div>

                  {/* Feature Controls - Scrollable */}
                  <AnimatedContent distance={20} direction="up" delay={100}>
                    <GlassPanel className="p-4">
                      <h3 className="text-base font-medium text-gray-200 mb-4">Startup Parameters</h3>
                      <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar pb-2">
                        {features.map((feature) => (
                          <FeatureInput key={feature.name} feature={feature} formatDisplayValue={formatDisplayValue} />
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
                          
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">
                          Adjust parameters to see risk assessment
                        </div>
                      )}
                    </GlassPanel>
                  </AnimatedContent>

                </div>
              </div>
            </form>

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

// Simplified FeatureInput component - uncontrolled
function FeatureInput({ feature, formatDisplayValue }) {
  const [displayValue, setDisplayValue] = useState(feature.default_value);
  
  if (feature.type === 'slider') {
    return (
      <div className="space-y-2 pb-3 border-b border-white/[0.05] last:border-b-0 last:pb-0">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-300">
            {feature.display_name}
          </label>
          <span className="text-sm text-gray-400">
            {formatDisplayValue(feature, displayValue)}
          </span>
        </div>
        
        <div className="relative">
          <input
            name={feature.name}
            type="range"
            min={feature.min_value}
            max={feature.max_value}
            step={feature.step || 1}
            defaultValue={feature.default_value}
            onInput={(e) => setDisplayValue(e.target.value)}
            className="w-full h-2 bg-white/[0.05] rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        
        <p className="text-xs text-gray-500">{feature.description}</p>
      </div>
    );
  }
  
  // Toggle switch
  return (
    <div className="space-y-2 pb-3 border-b border-white/[0.05] last:border-b-0 last:pb-0">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">
          {feature.display_name}
        </label>
      </div>
      
      <div className="flex items-center">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            name={feature.name}
            type="checkbox"
            defaultChecked={feature.default_value}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/[0.05] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
          <span className="ml-3 text-sm text-gray-400">
            <span className="peer-checked:hidden">No</span>
            <span className="hidden peer-checked:inline">Yes</span>
          </span>
        </label>
      </div>
      
      <p className="text-xs text-gray-500">{feature.description}</p>
    </div>
  );
}