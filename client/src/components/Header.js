import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import Sidebar from './Sidebar';
import PomodoroTimer from './PomodoroTimer'; // Import the new component
import './Header.css';

const Header = ({ onViewRoadmapsClick, pageTitle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useContext(AuthContext);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [profilePicUrl, setProfilePicUrl] = useState('https://i.imgur.com/3YQeY9r.png');

    useEffect(() => {
        if (auth.user && auth.user.profilePictureUrl) {
            if (auth.user.profilePictureUrl.startsWith('/uploads')) {
                setProfilePicUrl(`http://localhost:5001${auth.user.profilePictureUrl}?t=${new Date().getTime()}`);
            } else {
                setProfilePicUrl(auth.user.profilePictureUrl);
            }
        } else {
            setProfilePicUrl('https://i.imgur.com/3YQeY9r.png');
        }
    }, [auth.user]);

    const handleLogout = () => {
        auth.logout();
        setDropdownOpen(false);
    };

    const handleAuthClick = () => {
        navigate('/auth');
    };

    const handleLogoClick = () => {
        if (auth.isAuthenticated) {
            setIsSidebarOpen(true);
        } else {
            navigate('/');
        }
    };

    const toggleDropdown = () => {
        setDropdownOpen(prev => !prev);
    }

    const showViewRoadmapsButton = location.pathname === '/pathways' && auth.isAuthenticated;

    return (
        <>
            <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
            <header className="homepage-header">
                <div className="header-left">
                    <div className="logo-container" onClick={handleLogoClick}>
                        <div className="logo-circles">
                            <div className="circle circle-1"></div>
                            <div className="circle circle-2"></div>
                        </div>
                    </div>
                    {pageTitle && <h2 className="header-page-title">{pageTitle}</h2>}
                    {showViewRoadmapsButton && (
                         <button className="view-roadmaps-button" onClick={onViewRoadmapsClick}>
                            View Roadmaps
                         </button>
                    )}
                </div>
                <div className="header-buttons">
                    {auth.isAuthenticated ? (
                        <>
                            <PomodoroTimer />
                            <div className="header-profile-container" onClick={toggleDropdown}>
                                <div className="profile-icon">
                                    <img src={profilePicUrl} alt="Profile" key={profilePicUrl} />
                                </div>
                                {dropdownOpen && <ProfileDropdown onLogout={handleLogout} />}
                            </div>
                        </>
                    ) : (
                        <button className="signup-login-button" onClick={handleAuthClick}>
                            Signup / Login
                        </button>
                    )}
                </div>
            </header>
        </>
    );
};

export default Header;