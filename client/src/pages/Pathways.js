import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Pathways.css'; 

const SavedRoadmapsSidebar = ({ roadmaps, onClose, onContinue, onDelete, isOpen }) => {
    const calculateProgress = (roadmap) => {
        if (!roadmap.topics || roadmap.topics.length === 0) return 0;
        const completedTopics = roadmap.topics.filter(t => t.completed).length;
        return (completedTopics / roadmap.topics.length) * 100;
    };

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
            <div className={`saved-roadmaps-sidebar ${isOpen ? 'open' : ''}`}>
                <button className="close-button" onClick={onClose}>&times;</button>
                <h2>My Roadmaps</h2>
                <div className="saved-roadmaps-list">
                    {(!roadmaps || roadmaps.length === 0) ? (
                        <p className="no-roadmaps-message">You haven't generated any roadmaps yet.</p>
                    ) : (
                        roadmaps.map((roadmap) => (
                            <div key={roadmap._id} className="saved-roadmap-item">
                                <h3>{roadmap.title}</h3>
                                <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: `${calculateProgress(roadmap)}%` }}></div>
                                    <span className="progress-text">{Math.round(calculateProgress(roadmap))}% Complete</span>
                                </div>
                                <div className="roadmap-actions">
                                    <button onClick={() => onContinue(roadmap)} className="continue-button">Continue</button>
                                    {/* --- NEW DELETE BUTTON --- */}
                                    <button onClick={() => onDelete(roadmap._id)} className="delete-button">Delete</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};


const Pathways = ({ setViewRoadmapsHandler }) => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [language, setLanguage] = useState('Python');
  const [level, setLevel] = useState('Beginner');
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [showSavedSidebar, setShowSavedSidebar] = useState(false);

  const handleViewRoadmapsClick = () => {
    fetchSavedRoadmaps(); 
    setShowSavedSidebar(true);
  };
  
  useEffect(() => {
    if (setViewRoadmapsHandler) {
      setViewRoadmapsHandler(() => handleViewRoadmapsClick);
    }
    return () => {
      if (setViewRoadmapsHandler) {
        setViewRoadmapsHandler(null);
      }
    };
  }, [setViewRoadmapsHandler]);


  useEffect(() => {
    ScrollTrigger.refresh();
  }, [activeRoadmap]);

  const fetchSavedRoadmaps = async () => {
      if (!token) return;
      try {
          const res = await axios.get('http://localhost:5001/api/roadmap/my-roadmaps', {
              headers: { 'x-auth-token': token }
          });
          setSavedRoadmaps(res.data);
      } catch (err) {
          console.error("Could not fetch saved roadmaps", err);
      }
  };

  useEffect(() => {
    fetchSavedRoadmaps();
  }, [token]);

  const generateRoadmap = async (customPrompt = null) => {
    setIsLoading(true);
    setError('');
    setActiveRoadmap(null);

    const requestBody = customPrompt ? { customPrompt } : { language, level };
    
    if (customPrompt) setIsAiLoading(true);

    try {
      const res = await axios.post('http://localhost:5001/api/roadmap/generate', requestBody, {
          headers: { 'x-auth-token': token }
      });
      setActiveRoadmap(res.data);
      await fetchSavedRoadmaps(); 
    } catch (err) {
      const errorMessage = 'Failed to generate roadmap. The AI may be busy, please try again.';
      setError(errorMessage);
      console.error(err);
    }
    setIsLoading(false);
    setIsAiLoading(false);
    setChatInput('');
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiLoading || isLoading) return;
    generateRoadmap(chatInput);
  };
  
  const handleTopicCompletion = async (topicTitle, isCompleted) => {
      if (!activeRoadmap || !token) return;

      try {
          await axios.put('http://localhost:5001/api/roadmap/progress', { 
            roadmapId: activeRoadmap._id,
            topic: topicTitle, 
            completed: isCompleted 
          }, { headers: { 'x-auth-token': token }});

          const updatedTopics = activeRoadmap.topics.map(t => 
              t.topic === topicTitle ? { ...t, completed: isCompleted } : t
          );
          setActiveRoadmap({ ...activeRoadmap, topics: updatedTopics });
          
          setSavedRoadmaps(prev => prev.map(r => 
              r._id === activeRoadmap._id ? { ...r, topics: updatedTopics } : r
          ));

      } catch(err) {
          console.error("Failed to update progress", err);
      }
  };

  const handleContinueRoadmap = (roadmap) => {
      setActiveRoadmap(roadmap);
      setShowSavedSidebar(false);
  };

  // --- NEW DELETE FUNCTION ---
  const handleDeleteRoadmap = async (roadmapId) => {
      if (window.confirm("Are you sure you want to delete this roadmap? This action cannot be undone.")) {
          try {
              await axios.delete(`http://localhost:5001/api/roadmap/${roadmapId}`, {
                  headers: { 'x-auth-token': token }
              });
              // If the deleted roadmap was the active one, clear it
              if (activeRoadmap && activeRoadmap._id === roadmapId) {
                  setActiveRoadmap(null);
              }
              // Update the state to remove the roadmap from the sidebar
              setSavedRoadmaps(prev => prev.filter(r => r._id !== roadmapId));
          } catch (err) {
              console.error("Failed to delete roadmap", err);
              alert("Could not delete the roadmap. Please try again.");
          }
      }
  };


  return (
    <div className="pathways-container">
      <SavedRoadmapsSidebar 
        roadmaps={savedRoadmaps} 
        isOpen={showSavedSidebar}
        onClose={() => setShowSavedSidebar(false)} 
        onContinue={handleContinueRoadmap}
        onDelete={handleDeleteRoadmap} // Pass the delete handler
      />

      <div className="pathways-main-content">
        <div className="roadmap-generator-card">
          <div className="card-header">
              <h1 className="pathways-title">Create Your AI-Powered Roadmap</h1>
          </div>
          <p className="pathways-subtitle">Select a language or chat with Mee to generate a personalized plan.</p>
          
          <div className="generator-options">
              <div className="form-group">
                <label htmlFor="language">I want to learn:</label>
                <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="Java">Java</option>
                  <option value="C++">C++</option>
                  <option value="SQL">SQL</option>
                  <option value="Go">Go</option>
                  <option value="Ruby">Ruby</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="level">My level is:</label>
                <select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <button className="generate-button" onClick={() => generateRoadmap()} disabled={isLoading}>
                {isLoading && !isAiLoading ? 'Generating...' : 'Generate My Roadmap'}
              </button>
          </div>
        </div>
        
        <div className="ai-chat-box">
           <p className="ai-chat-prefix">Or... Talk to Mee</p>
           <form className="chat-input-form-pathways" onSubmit={handleChatSubmit}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Make me a plan for learning web scraping with Python..."
                disabled={isAiLoading || isLoading}
              />
              <button type="submit" disabled={isAiLoading || isLoading}>
                  {isAiLoading ? '...' : 'Send'}
              </button>
          </form>
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>

      {activeRoadmap && (
        <div className="roadmap-display">
            <h2>Current Roadmap: {activeRoadmap.title}</h2>
            <ul>
                {activeRoadmap.topics.map((item, index) => (
                <li key={index} className={`roadmap-item ${item.completed ? 'completed' : ''}`}>
                    <input 
                        type="checkbox" 
                        className="progress-checkbox"
                        checked={item.completed}
                        onChange={(e) => handleTopicCompletion(item.topic, e.target.checked)}
                    />
                    <div className="roadmap-item-content">
                        <h3>{index + 1}. {item.topic}</h3>
                        <p>{item.description}</p>
                    </div>
                    <Link
                        to={`/sandbox?topic=${encodeURIComponent(item.topic)}&q=${encodeURIComponent(item.youtube_query)}`}
                        className="start-learning-link"
                    >
                        Start Learning →
                    </Link>
                </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};

export default Pathways;