// src/SplashScreen.js
import React, { useEffect, useState } from 'react';
import './SplashScreen.css'; // Optional: create a CSS file for styles

const SplashScreen = ({ onSplashEnd }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onSplashEnd(); // Call the function to indicate the splash screen has ended
        }, 3000); // Change duration as needed

        return () => clearTimeout(timer); // Cleanup the timer
    }, [onSplashEnd]);

    if (!isVisible) return null;

    return (
        <div className="splash-screen">
            <h1>Welcome to My App</h1>
        </div>
    );
};

export default SplashScreen;
