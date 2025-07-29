import { Link } from 'react-router-dom';
import { BarChart3, Brain } from 'lucide-react';
import FadeContent from '../components/ui/FadeContent';
import AnimatedContent from '../components/ui/AnimatedContent';
import GlassPanel from '../components/ui/GlassPanel';

export default function HomePage() {
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
            Data Analysis
          </h1>
          <p style={{
            color: 'var(--color-gray-500)',
            fontSize: '0.875rem'
          }}>
            Analyze your data with AI-powered insights
          </p>
        </div>
        
        {/* Main content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          maxWidth: '64rem'
        }}>
          {/* CSV Analysis */}
          <AnimatedContent distance={20} direction="up">
            <Link 
              to="/csv-analysis" 
              style={{ display: 'block', textDecoration: 'none' }}
              className="group"
            >
              <GlassPanel style={{
                padding: '2rem',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BarChart3 style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      color: 'var(--color-violet-400)'
                    }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: 'var(--color-gray-200)'
                    }}>
                      CSV Analysis
                    </h3>
                    <p style={{
                      color: 'var(--color-gray-500)',
                      fontSize: '0.875rem',
                      lineHeight: '1.6'
                    }}>
                      Upload CSV files and run predictions using machine learning models. 
                      Get instant insights with visualizations.
                    </p>
                  </div>
                  
                  <div style={{ paddingTop: '0.5rem' }}>
                    <span style={{
                      color: 'var(--color-violet-400)',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      Get Started →
                    </span>
                  </div>
                </div>
              </GlassPanel>
            </Link>
          </AnimatedContent>

          {/* Sentiment Analysis */}
          <AnimatedContent distance={20} direction="up" delay={50}>
            <Link 
              to="/sentiment-analysis" 
              style={{ display: 'block', textDecoration: 'none' }}
              className="group"
            >
              <GlassPanel style={{
                padding: '2rem',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Brain style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      color: 'var(--color-violet-400)'
                    }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: 'var(--color-gray-200)'
                    }}>
                      Sentiment Analysis
                    </h3>
                    <p style={{
                      color: 'var(--color-gray-500)',
                      fontSize: '0.875rem',
                      lineHeight: '1.6'
                    }}>
                      Analyze company sentiment and assess risk levels using web data and AI. 
                      Get comprehensive market intelligence.
                    </p>
                  </div>
                  
                  <div style={{ paddingTop: '0.5rem' }}>
                    <span style={{
                      color: 'var(--color-violet-400)',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      Get Started →
                    </span>
                  </div>
                </div>
              </GlassPanel>
            </Link>
          </AnimatedContent>
        </div>
      </div>
    </FadeContent>
  );
}