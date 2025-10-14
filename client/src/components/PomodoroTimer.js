import React, { useState, useEffect, useRef } from 'react';
import './PomodoroTimer.css';

const PomodoroTimer = () => {
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(workTime * 60);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef(null);
  const audioRef = useRef(new Audio('/notification.mp3'));

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  useEffect(() => {
    if (timeLeft === 0) {
      clearInterval(timerRef.current);
      setIsActive(false);
      setIsFinished(true);
      audioRef.current.play();
    }
  }, [timeLeft]);

  useEffect(() => {
    if (!isActive && !isFinished) {
        setTimeLeft((isBreak ? breakTime : workTime) * 60);
    }
  }, [workTime, breakTime, isBreak, isActive, isFinished]);

  const toggleTimer = () => {
    if (isFinished) {
      setIsFinished(false);
      setIsBreak(prev => !prev);
    } else {
      setIsActive(prev => !prev);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setIsFinished(false);
    setTimeLeft(workTime * 60);
    clearInterval(timerRef.current);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const buttonClass = () => {
    if (isFinished) return 'finished';
    return isActive ? 'active' : '';
  };

  const getButtonText = () => {
    if (isFinished) {
        return isBreak ? "Start Work" : "Start Break";
    }
    return formatTime(timeLeft);
  }

  return (
    <div className="pomodoro-container">
      <button
        className={`pomodoro-button ${buttonClass()}`}
        onClick={() => {
            if(isFinished) {
                toggleTimer();
            } else {
                setDropdownOpen(prev => !prev)
            }
        }}
      >
        {getButtonText()}
      </button>

      {isDropdownOpen && (
        <div className="pomodoro-dropdown">
          <div className="dropdown-section">
            <label>Work</label>
            <input
              type="number"
              value={workTime}
              onChange={(e) => setWorkTime(e.target.value)}
              min="1"
            />
            <span>mins</span>
          </div>
          <div className="dropdown-section">
            <label>Break</label>
            <input
              type="number"
              value={breakTime}
              onChange={(e) => setBreakTime(e.target.value)}
              min="1"
            />
            <span>mins</span>
          </div>
          <div className="pomodoro-actions">
            <button onClick={toggleTimer}>{isActive ? 'Pause' : 'Start'}</button>
            <button onClick={resetTimer}>Reset</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;