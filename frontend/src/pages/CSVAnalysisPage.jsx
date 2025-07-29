import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, BarChart3, AlertCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { uploadCSV, testConnection } from '../services/api';
import FadeContent from '../components/ui/FadeContent';
import AnimatedContent from '../components/ui/AnimatedContent';
import GlassPanel from '../components/ui/GlassPanel';

export default function CSVAnalysisPage() {
  const [file, setFile] = useState(null);
  const [modelName, setModelName] = useState('model');
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
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze CSV');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!results?.predictions) return [];
    
    return results.predictions.slice(0, 50).map((value, index) => ({
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
                  {/* Model Name Input */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: 'var(--color-gray-400)',
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem'
                    }}>Model Name</label>
                    <input
                      type="text"
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
                        outline: 'none'
                      }}
                      placeholder="Enter model name (e.g., model)"
                    />
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
              { label: 'Total Predictions', value: results.summary_stats.total_predictions },
              { label: 'Mean', value: results.summary_stats.mean_prediction.toFixed(2) },
              { label: 'Std Dev', value: results.summary_stats.std_prediction.toFixed(2) }
            ].map((stat, i) => (
              <AnimatedContent 
                key={i} 
                distance={20} 
                direction="up" 
                delay={i * 50}
              >
                <GlassPanel className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">{stat.label}</p>
                      <p className="text-2xl font-light text-gray-100 mt-1">{stat.value}</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-400/60" />
                  </div>
                </GlassPanel>
              </AnimatedContent>
            ))}
          </div>
        </div>

        {/* Charts */}
        {results && (
          <div className="mt-12">
            <AnimatedContent distance={20} direction="up" delay={200}>
              <GlassPanel className="p-8">
                <h2 className="text-xl font-medium text-gray-100 mb-6">Prediction Distribution</h2>
                <div className="h-80">
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