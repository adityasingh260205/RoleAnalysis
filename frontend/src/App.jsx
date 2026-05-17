import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // --- 1. STATE FOR ADD CANDIDATE FORM ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // --- 2. STATE FOR JOB MATCHING ---
  const [jobSkills, setJobSkills] = useState('');
  const [jobExp, setJobExp] = useState('');
  const [results, setResults] = useState([]);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 3. STATE FOR INTERVIEW QUESTIONS (BONUS FEATURE) ---
  const [interviewData, setInterviewData] = useState({});

  // --- HANDLER: ADD CANDIDATE ---
  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      await axios.post('https://candidate-api-1tki.onrender.com/api/candidates', {
        name, email, skills: skillsArray, experience: Number(experience)
      });
      setStatusMessage('✅ Candidate added successfully!');
      setName(''); setEmail(''); setSkills(''); setExperience('');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setStatusMessage('❌ Error adding candidate.');
    }
  };

  // --- HANDLER: MATCH CANDIDATES & GET AI INSIGHT ---
  const handleMatchCandidates = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);
    setAiRecommendation('');
    setInterviewData({}); // Clear old questions on a new search

    try {
      const skillsArray = jobSkills.split(',').map(skill => skill.trim());

      // 1. Fetch Basic Matching Logic (Scores)
      const matchResponse = await axios.post('https://candidate-api-1tki.onrender.com/api/match', {
        requiredSkills: skillsArray,
        minExperience: Number(jobExp)
      });
      
      const matchedCandidates = matchResponse.data;
      setResults(matchedCandidates);

      // 2. Fetch OpenRouter AI Explanation (If candidates exist)
      if (matchedCandidates.length > 0) {
        const aiResponse = await axios.post('https://candidate-api-1tki.onrender.com/api/ai/shortlist', {
          requiredSkills: skillsArray,
          minExperience: Number(jobExp),
          candidates: matchedCandidates
        });
        setAiRecommendation(aiResponse.data.recommendation);
      } else {
         setAiRecommendation("No candidates met the minimum experience requirement.");
      }

    } catch (error) {
      console.error("Error matching candidates:", error);
      setAiRecommendation("❌ Failed to fetch AI insights. Check backend terminal for errors.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: GENERATE INTERVIEW QUESTIONS ---
  const handleGenerateQuestions = async (candidate, index) => {
    // Set a loading state for this specific candidate card
    setInterviewData(prev => ({ ...prev, [index]: '⏳ Generating tailored questions...' }));
    
    try {
      const skillsArray = jobSkills.split(',').map(skill => skill.trim());
      
      const response = await axios.post('https://candidate-api-1tki.onrender.com/api/ai/interview', {
        candidateName: candidate.name,
        skills: candidate.skills,
        jobRole: skillsArray
      });
      
      setInterviewData(prev => ({ ...prev, [index]: response.data.questions }));
    } catch (error) {
      console.error("Error generating questions:", error);
      setInterviewData(prev => ({ ...prev, [index]: '❌ Failed to generate questions.' }));
    }
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>Al-Powered Candidate Shortlisting</h1>
        <p>Intelligently match candidates to job requirements.</p>
      </header>

      <main className="bento-grid">
        
        {/* --- Box 1: Add Candidate Form --- */}
        <section className="bento-card">
          <h2>1. Add New Candidate</h2>
          <form onSubmit={handleAddCandidate} className="custom-form">
            <input type="text" placeholder="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="text" placeholder="Skills (e.g. React, Node.js)" required value={skills} onChange={(e) => setSkills(e.target.value)} />
            <input type="number" placeholder="Years of Experience" required min="0" value={experience} onChange={(e) => setExperience(e.target.value)} />
            <button type="submit" className="primary-btn">Save Candidate</button>
          </form>
          {statusMessage && <p className="status-msg">{statusMessage}</p>}
        </section>

        {/* --- Box 2: Job Requirements Form --- */}
        <section className="bento-card">
          <h2>2. Job Requirements</h2>
          <form onSubmit={handleMatchCandidates} className="custom-form">
            <input type="text" placeholder="Required Skills (e.g. React, Node.js)" required value={jobSkills} onChange={(e) => setJobSkills(e.target.value)} />
            <input type="number" placeholder="Minimum Experience (Years)" required min="0" value={jobExp} onChange={(e) => setJobExp(e.target.value)} />
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Analyzing...' : 'Find Best Matches'}
            </button>
          </form>
        </section>

        {/* --- Box 3: AI Results Display --- */}
        <section className="bento-card results-card">
          <h2>3. Shortlisted Results & AI Insight</h2>
          
          {loading && <p style={{ color: '#60a5fa', textAlign: 'center', marginTop: '2rem' }}>🧠 AI is analyzing candidate profiles...</p>}
          
          {!loading && results.length > 0 && (
            <div className="results-container">
              
              {/* Candidate Cards */}
              <div className="candidate-list">
                {results.map((candidate, index) => (
                  <div key={index} className="candidate-item">
                    <div className="candidate-header">
                      <h3>{candidate.name}</h3>
                      <span className="match-badge">{candidate.matchScore}% Match</span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      <strong>Exp:</strong> {candidate.experience} years | <strong>Skills:</strong> {candidate.skills.join(', ')}
                    </p>

                    {/* Bonus Feature: Interview Question Button */}
                    <button 
                      className="secondary-btn" 
                      onClick={() => handleGenerateQuestions(candidate, index)}
                    >
                      Ask AI for Interview Qs
                    </button>

                    {/* Bonus Feature: Display the Questions if they exist */}
                    {interviewData[index] && (
                      <div className="interview-qs-box">
                        <p style={{ whiteSpace: 'pre-line', fontSize: '0.85rem', color: '#e2e8f0' }}>
                          {interviewData[index]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* AI Insight Box */}
              <div className="ai-insight-box">
                <h3>✨ OpenRouter AI Analysis</h3>
                <p style={{ whiteSpace: 'pre-line', color: '#e2e8f0' }}>{aiRecommendation}</p>
              </div>
            </div>
          )}

          {!loading && results.length === 0 && !aiRecommendation && (
            <p style={{ color: '#64748b', textAlign: 'center', marginTop: '2rem' }}>Enter job requirements to see shortlisted candidates and AI analysis.</p>
          )}
        </section>

      </main>
    </div>
  );
}

export default App;