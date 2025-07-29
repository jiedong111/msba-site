import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CSVAnalysisPage from './pages/CSVAnalysisPage';
import SentimentAnalysisPage from './pages/SentimentAnalysisPage';

function App() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="csv-analysis" element={<CSVAnalysisPage />} />
            <Route path="sentiment-analysis" element={<SentimentAnalysisPage />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
