import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, BarChart3, AlertCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { uploadCSV, testConnection, getModels } from '../services/api';
import FadeContent from '../components/ui/FadeContent';
import AnimatedContent from '../components/ui/AnimatedContent';
import GlassPanel from '../components/ui/GlassPanel';

export default function CSVAnalysisPage() {
  const [file, setFile] = useState(null);
  const [modelName, setModelName] = useState('model');
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const modelData = await getModels();
        if (modelData?.available_models && modelData.available_models.length > 0) {
          setAvailableModels(modelData.available_models);
          setModelName(modelData.available_models[0]); // Set first model as default
        }
      } catch (err) {
        console.error('Failed to fetch models:', err);
      }
    };
    fetchModels();
  }, []);

  const handleConnectionTest = async () => {
    try {
      await testConnection();
      alert('✅ Backend connection successful!');
    } catch (err) {
      alert('❌ Backend connection failed: ' + err.message);
    }
  };

  const handleAnalysis = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await uploadCSV(file, modelName);
      console.log('📊 Analysis result:', data);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze CSV');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!results?.chart_data?.predictions) return [];
    
    return results.chart_data.predictions.map((value, index) => ({
      index: index + 1,
      value: value,
    }));
  };

  return (
    <FadeContent blur={false} duration={800}>
      <div style={{
        padding: '2rem 1.5rem',
        maxWidth: '80rem',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: '300',
            color: 'var(--color-gray-100)',
            marginBottom: '0.5rem'
          }}>
            CSV Analysis
          </h1>
          <p style={{
            color: 'var(--color-gray-500)',
            fontSize: '0.875rem'
          }}>
            Upload and analyze your datasets with AI
          </p>
        </div>
        
        {/* Main content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '1.5rem'
        }}>
          {/* Upload section */}
          <div style={{ flex: '1' }}>
            <AnimatedContent distance={20} direction="up">
              <GlassPanel style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Model Selection */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--color-gray-400)',
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem'
                    }}>Select Model</label>
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.625rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.75rem',
                        color: 'var(--color-gray-100)',
                        fontSize: '0.875rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {availableModels.length === 0 ? (
                        <option value="model">Loading models...</option>
                      ) : (
                        availableModels.map((model) => (
                          <option key={model} value={model}>
                            {model.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </option>
                        ))
                      )}
                    </select>
                    {modelName && (
                      <p style={{
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--color-gray-500)'
                      }}>
                        Using {modelName.replace(/_/g, ' ')} for predictions
                      </p>
                    )}
                  </div>

                  {/* File Upload */}
                  <GlassPanel className="p-8">
                    <div
                      {...getRootProps()}
                      className={`
                        border-2 border-dashed
                        ${isDragActive 
                          ? 'border-violet-500/40 bg-violet-500/[0.02]' 
                          : 'border-white/[0.05] hover:border-white/[0.08]'
                        }
                        rounded-xl p-16
                        transition-all duration-300
                        cursor-pointer
                        group
                      `}
                    >
                      <input {...getInputProps()} />
                      <div className="text-center">
                        {file ? (
                          <div className="space-y-4">
                            <FileText className="w-10 h-10 text-violet-400 mx-auto" />
                            <div>
                              <p className="text-gray-200 font-medium">{file.name}</p>
                              <p className="text-gray-500 text-sm mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-gray-600 group-hover:text-gray-500 transition-colors mx-auto mb-4" />
                            <p className="text-gray-400 text-sm">
                              {isDragActive ? 'Drop your CSV file here' : 'Drop your CSV file here or click to browse'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </GlassPanel>

                  {/* Error Display */}
                  {error && (
                    <GlassPanel className="p-4 border-red-500/20 bg-red-500/[0.02]">
                      <div className="flex items-start space-x-2">
                        <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-red-400 text-sm">{typeof error === 'string' ? error : JSON.stringify(error)}</p>
                      </div>
                    </GlassPanel>
                  )}

                  {/* Test Connection Button */}
                  <button
                    onClick={handleConnectionTest}
                    style={{
                      width: '100%',
                      padding: '0.625rem 1.25rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      color: 'rgba(96, 165, 250, 1)',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      marginBottom: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Test Backend Connection
                  </button>

                  {/* Analyze Button */}
                  <button
                    onClick={handleAnalysis}
                    disabled={!file || loading}
                    className="w-full px-5 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 rounded-xl transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-400 border-t-transparent" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 size={16} />
                        <span>Analyze CSV</span>
                      </>
                    )}
                  </button>
                </div>
              </GlassPanel>
            </AnimatedContent>
          </div>
          
          {/* Stats section - 1 col */}
          <div className="space-y-6">
            {results && [
              { label: 'Mean Score', value: results.summary_stats.mean.toFixed(1), color: 'text-violet-400' },
              { label: 'Outliers', value: `${results.insights.outlier_percentage.toFixed(1)}%`, color: 'text-orange-400' },
              { label: 'Distribution', value: results.insights.distribution_shape, color: 'text-green-400' }
            ].map((stat, i) => (
              <AnimatedContent 
                key={i} 
                distance={20} 
                direction="up" 
                delay={i * 50}
              >
                <GlassPanel style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>{stat.label}</p>
                      <p style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '300', 
                        color: stat.color === 'text-violet-400' ? 'var(--color-violet-400)' :
                               stat.color === 'text-orange-400' ? '#fb923c' : 
                               '#4ade80',
                        marginTop: '0.25rem' 
                      }}>{stat.value}</p>
                    </div>
                    <TrendingUp style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(74, 222, 128, 0.6)' }} />
                  </div>
                </GlassPanel>
              </AnimatedContent>
            ))}
          </div>
        </div>

        {/* Charts and Insights */}
        {results && (
          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Model Info Panel */}
            <AnimatedContent distance={20} direction="up" delay={150}>
              <GlassPanel style={{ padding: '2rem' }}>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '500', 
                  color: 'var(--color-gray-100)', 
                  marginBottom: '1rem' 
                }}>
                  Model Information
                </h2>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: 'var(--color-gray-400)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Model Used: <span style={{ color: 'var(--color-violet-400)' }}>{results.model_used.replace(/_/g, ' ').toUpperCase()}</span>
                  </p>
                  <p style={{ color: 'var(--color-gray-500)', fontSize: '0.75rem' }}>
                    Analysis performed on {results.summary_stats.count} data points
                  </p>
                </div>
              </GlassPanel>
            </AnimatedContent>
            
            {/* Key Insights Panel */}
            <AnimatedContent distance={20} direction="up" delay={200}>
              <GlassPanel style={{ padding: '2rem' }}>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '500', 
                  color: 'var(--color-gray-100)', 
                  marginBottom: '1.5rem' 
                }}>
                  Analysis Insights
                </h2>
                
                {/* Risk Segments */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--color-gray-300)', 
                    marginBottom: '0.75rem' 
                  }}>
                    Risk Segments
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.entries(results.insights.risk_segments).map(([level, data]) => (
                      <div key={level} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ 
                          textTransform: 'capitalize', 
                          color: 'var(--color-gray-400)',
                          fontSize: '0.875rem'
                        }}>
                          {level} Risk ({data.count} items)
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            width: '8rem', 
                            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                            borderRadius: '9999px', 
                            height: '0.5rem' 
                          }}>
                            <div style={{
                              height: '100%',
                              borderRadius: '9999px',
                              width: `${data.percentage}%`,
                              backgroundColor: level === 'low' ? '#10b981' : 
                                              level === 'medium' ? '#f59e0b' : '#ef4444'
                            }} />
                          </div>
                          <span style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--color-gray-500)', 
                            width: '3rem', 
                            textAlign: 'right' 
                          }}>
                            {data.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Percentiles */}
                <div>
                  <h3 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--color-gray-300)', 
                    marginBottom: '0.75rem' 
                  }}>
                    Percentile Breakdown
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.entries(results.insights.percentiles).map(([percentile, value]) => (
                      <div key={percentile} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-gray-400)', fontSize: '0.875rem' }}>
                          {percentile} of predictions are below
                        </span>
                        <span style={{ 
                          fontSize: '1rem', 
                          fontWeight: '500', 
                          color: 'var(--color-gray-100)' 
                        }}>
                          {value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassPanel>
            </AnimatedContent>

            {/* Distribution Chart */}
            <AnimatedContent distance={20} direction="up" delay={250}>
              <GlassPanel style={{ padding: '2rem' }}>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '500', 
                  color: 'var(--color-gray-100)', 
                  marginBottom: '1.5rem' 
                }}>
                  Prediction Distribution
                </h2>
                <div style={{ height: '20rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prepareChartData()}>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="rgba(255,255,255,0.02)" 
                        vertical={false}
                      />
                      <XAxis 
                        dataKey="index"
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
                </div>
              </GlassPanel>
            </AnimatedContent>
          </div>
        )}
      </div>
    </FadeContent>
  );
}