// Import React and ReactDOM
const { useState, useEffect } = React;
const { createRoot } = ReactDOM;

// Basic Button component
const Button = ({ className, onClick, children, variant = 'default', size = 'md' }) => {
    const baseClass = 'btn px-4 py-2 rounded transition duration-200 ease-in-out';
    const variantClass = variant === 'outline' ? 'border border-blue-500 text-blue-500 hover:bg-blue-100' :
        variant === 'destructive' ? 'bg-red-500 text-white hover:bg-red-600' :
            'bg-blue-500 text-white hover:bg-blue-600';
    const sizeClass = size === 'sm' ? 'text-sm' : 'text-base';

    return (
        <button onClick={onClick} className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}>
            {children}
        </button>
    );
};

// Basic Input component
const Input = ({ value, onChange, className }) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        className={`border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
);

// Basic Card components
const Card = ({ children, className }) => (
    <div className={`border border-gray-300 rounded-lg shadow-sm bg-white ${className}`}>
        {children}
    </div>
);

const CardHeader = ({ children }) => (
    <div className="px-4 py-2 border-b border-gray-300 bg-gray-50">
        {children}
    </div>
);

const CardTitle = ({ children }) => (
    <h2 className="text-lg font-semibold text-gray-800">
        {children}
    </h2>
);

const CardContent = ({ children }) => (
    <div className="px-4 py-2">
        {children}
    </div>
);

// Icon components (simplified)
const IconWrapper = ({ children }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);

const Plus = () => (
    <IconWrapper>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </IconWrapper>
);

const Minus = () => (
    <IconWrapper>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </IconWrapper>
);

const Play = () => (
    <IconWrapper>
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </IconWrapper>
);

const Pause = () => (
    <IconWrapper>
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
    </IconWrapper>
);

const X = () => (
    <IconWrapper>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </IconWrapper>
);

const Volume2 = () => (
    <IconWrapper>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </IconWrapper>
);

// Create a debounce function for optimized state updates
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

// High-precision timer formatter function (defined outside component to avoid initialization issues)
const formatTimeDisplay = (milliseconds, showMs = false) => {
    // Ensure non-negative value
    const ms = Math.max(0, milliseconds);
    const totalSeconds = ms / 1000;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    
    if (showMs) {
        // Show hundredths of a second for more precision when enabled
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    } else {
        // Standard minutes:seconds format when milliseconds are disabled
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
};

// Timer component
const Timer = ({ initialTime, onRemove }) => {
    // Time in milliseconds for high precision
    const [timeMs, setTimeMs] = useState(initialTime * 1000);
    const [currentInitialTimeMs, setCurrentInitialTimeMs] = useState(initialTime * 1000);
    const [isRunning, setIsRunning] = useState(false);
    const [name, setName] = useState(`${initialTime / 60} min timer`);
    const [isComplete, setIsComplete] = useState(false);
    const [audio] = useState(new Audio('trimmed_audio.mp3'));
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMilliseconds, setShowMilliseconds] = useState(false);
    const [displayTime, setDisplayTime] = useState(formatTimeDisplay(initialTime * 1000, showMilliseconds));
    // Use refs to avoid re-renders and improve precision
    const startTimeRef = React.useRef(0);
    const targetEndTimeRef = React.useRef(0);
    const pausedTimeRemainingRef = React.useRef(0);
    const lastUpdateTimeRef = React.useRef(0);
    const driftCorrectionRef = React.useRef(0);
    const animationFrameRef = React.useRef();
    const driftCheckIntervalRef = React.useRef();
    
    // Drift compensation mechanism
    useEffect(() => {
        if (isRunning && timeMs > 0) {
            // Clear any existing animation frames
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            
            // Store the exact current time for precision
            const now = performance.now();
            
            // If resuming from pause, use the stored remaining time
            if (pausedTimeRemainingRef.current > 0) {
                targetEndTimeRef.current = now + pausedTimeRemainingRef.current;
                pausedTimeRemainingRef.current = 0;
            } else {
                // Starting fresh - set target end time
                targetEndTimeRef.current = now + timeMs;
            }
            
            startTimeRef.current = now;
            lastUpdateTimeRef.current = now;
            
            // Set up drift checking at regular intervals (every 10 seconds)
            driftCheckIntervalRef.current = setInterval(() => {
                const currentTime = performance.now();
                const elapsedTime = currentTime - startTimeRef.current;
                const expectedTimeRemaining = targetEndTimeRef.current - currentTime;
                const actualTimeRemaining = currentInitialTimeMs - elapsedTime;
                
                // Calculate drift (positive means timer is running slow, negative means fast)
                const drift = actualTimeRemaining - expectedTimeRemaining;
                
                if (Math.abs(drift) > 10) { // Only correct if drift > 10ms
                    // Store the drift correction
                    driftCorrectionRef.current = drift;
                    
                    // Apply correction to target end time
                    targetEndTimeRef.current += drift;
                    
                    console.log(`Drift detected: ${drift.toFixed(3)}ms, correcting timer`);
                }
            }, 10000);
            
            // Create debounced state updaters for better performance
            const debouncedSetTimeMs = debounce((value) => {
                setTimeMs(value);
            }, 30); // Only update state every 30ms max
            
            // Separate time display updater to avoid UI jank
            const updateDisplayTime = (value) => {
                setDisplayTime(formatTimeDisplay(value, showMilliseconds));
            };
            
            // High-precision timer using requestAnimationFrame
            const updateTimer = () => {
                if (!isRunning) return; // Ensure we don't continue if timer was stopped
                
                const currentTime = performance.now();
                const frameTime = currentTime - lastUpdateTimeRef.current;
                lastUpdateTimeRef.current = currentTime;
                
                // Check if we've been running too slow (tab in background, etc)
                if (frameTime > 100) {
                    console.log(`Timer slowed down: ${frameTime.toFixed(1)}ms between frames`);
                    // Adjust for slow frames - recalculate based on actual elapsed time
                    const actualElapsed = currentTime - startTimeRef.current;
                    const shouldBeRemaining = currentInitialTimeMs - actualElapsed;
                    if (Math.abs(shouldBeRemaining - (targetEndTimeRef.current - currentTime)) > 50) {
                        // Correct the end time to match the real elapsed time
                        targetEndTimeRef.current = currentTime + shouldBeRemaining;
                        console.log(`Corrected timer end time by ${shouldBeRemaining - (targetEndTimeRef.current - currentTime)}ms`);
                    }
                }
                
                const remaining = Math.max(0, targetEndTimeRef.current - currentTime);
                
                // Update display every frame for smooth visualization
                updateDisplayTime(remaining);
                
                // Only update state occasionally to prevent re-renders
                if (Math.abs(remaining - timeMs) > 50 || remaining <= 0) {
                    debouncedSetTimeMs(remaining);
                }
                
                if (remaining <= 0) {
                    clearInterval(driftCheckIntervalRef.current);
                    setIsComplete(true);
                    setIsRunning(false);
                    playSound();
                } else if (isRunning) {
                    // Use timeout based on expected frame rate for better timer resolution
                    // This is more precise than relying on browser's animation frame timing
                    setTimeout(() => {
                        animationFrameRef.current = requestAnimationFrame(updateTimer);
                    }, 4); // Aim for ~250 fps for timer calculations, higher than display refresh
                }
            };
            
            // Start the animation frame loop
            animationFrameRef.current = requestAnimationFrame(updateTimer);
        } else if (!isRunning && timeMs > 0) {
            // Store remaining time when paused
            pausedTimeRemainingRef.current = timeMs;
        }
        
        // Cleanup function
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (driftCheckIntervalRef.current) {
                clearInterval(driftCheckIntervalRef.current);
            }
        };
    }, [isRunning, currentInitialTimeMs]);

    const playSound = () => {
        if (isAudioEnabled) {
            audio.loop = true;
            audio.play().catch(error => {
                console.error("Audio play failed:", error);
                setIsAudioEnabled(false);
            });
        }
    };

    const stopSound = () => {
        audio.pause();
        audio.currentTime = 0;
        setIsComplete(false);
    };

    const resetTimer = () => {
        stopSound();
        
        // Reset all timing related state and refs
        setTimeMs(currentInitialTimeMs);
        setDisplayTime(formatTimeDisplay(currentInitialTimeMs, showMilliseconds));
        setIsRunning(false);
        
        // Cancel all pending operations
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        
        if (driftCheckIntervalRef.current) {
            clearInterval(driftCheckIntervalRef.current);
            driftCheckIntervalRef.current = null;
        }
        
        // Reset all refs
        startTimeRef.current = 0;
        targetEndTimeRef.current = 0;
        pausedTimeRemainingRef.current = currentInitialTimeMs;
        lastUpdateTimeRef.current = 0;
        driftCorrectionRef.current = 0;
    };

    const handlePlayPause = () => {
        if (!isAudioEnabled) {
            setIsAudioEnabled(true);
            audio.load();
        }
        
        if (timeMs <= 0) {
            // Set to 1 second if timer is at zero
            setTimeMs(1000);
            setCurrentInitialTimeMs(1000);
            // Reset refs for clean state
            startTimeRef.current = 0;
            targetEndTimeRef.current = 0;
            pausedTimeRemainingRef.current = 1000;
            driftCorrectionRef.current = 0;
            setIsRunning(true);
        } else {
            // Toggle running state
            setIsRunning(!isRunning);
        }
    };

    // Toggle milliseconds display
    const toggleMilliseconds = () => {
        setShowMilliseconds(!showMilliseconds);
        // Update display immediately
        setDisplayTime(formatTimeDisplay(timeMs, !showMilliseconds));
    };

    // Use the global formatTimeDisplay function to avoid reference issues
    const formatTime = (ms) => formatTimeDisplay(ms, showMilliseconds);

    const adjustTime = (amountSecs) => {
        const amountMs = amountSecs * 1000;
        const newTimeMs = Math.max(0, timeMs + amountMs);
        
        setTimeMs(newTimeMs);
        
        if (!isRunning) {
            // Update initial time reference for drift calculations
            setCurrentInitialTimeMs(newTimeMs);
            pausedTimeRemainingRef.current = newTimeMs;
        } else {
            // Adjust the target end time when changing time during running
            const now = performance.now();
            targetEndTimeRef.current = now + newTimeMs;
            // Reset drift correction when manually adjusting time
            driftCorrectionRef.current = 0;
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(!showDeleteConfirm);
    };

    const confirmDelete = () => {
        setShowDeleteConfirm(false);
        onRemove();
    };

    return (
        <Card className={`mb-4 timer-card ${isComplete ? 'timer-complete bg-red-50' : ''}`}>
            <CardHeader>
                <CardTitle>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full"
                    />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-4">
                    <Button onClick={() => adjustTime(-30)} size="sm" variant="outline"><Minus /></Button>
                    <span className="timer-display">{displayTime}</span>
                    <Button onClick={() => adjustTime(30)} size="sm" variant="outline"><Plus /></Button>
                </div>
                <div className="flex justify-between mb-2">
                    <Button onClick={handlePlayPause} variant="outline">
                        {isRunning ? <Pause /> : <Play />}
                    </Button>
                    <Button className="reset-btn" onClick={resetTimer} variant="outline">
                        Reset
                    </Button>
                    {isComplete ? (
                        <Button onClick={stopSound} variant="outline">
                            <Volume2 />
                        </Button>
                    ) : (
                        <Button onClick={handleDeleteClick} variant="destructive">
                            <X />
                        </Button>
                    )}
                </div>
                <div className="flex justify-center">
                    <Button
                        onClick={toggleMilliseconds}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                    >
                        {showMilliseconds ? "Hide ms" : "Show ms"}
                    </Button>
                </div>
            </CardContent>
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg">
                        <p>Are you sure you want to delete this timer?</p>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={confirmDelete} variant="destructive">
                                Delete
                            </Button>
                            <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="mr-2">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};
// PomodoroApp component
const PomodoroApp = () => {
    const [timers, setTimers] = useState([
        { id: 1, time: 1 * 60 },
        { id: 2, time: 5 * 60 },
        { id: 3, time: 10 * 60 },
        { id: 4, time: 25 * 60 },
    ]);

    const addTimer = (minutes) => {
        const newTimer = {
            id: Date.now(),
            time: minutes * 60,
        };
        setTimers([...timers, newTimer]);
    };

    const removeTimer = (id) => {
        setTimers(timers.filter(timer => timer.id !== id));
    };

    return (
        <div className="container">
            <h1>Atomic Precision Timer App🍅⏱️</h1>
            <div>
                <button className="btn" onClick={() => addTimer(5)}>Add 5min</button>
                <button className="btn" onClick={() => addTimer(10)}>Add 10min</button>
                <button className="btn" onClick={() => addTimer(25)}>Add 25min</button>
            </div>
            {timers.map(timer => (
                <Timer
                    key={timer.id}
                    initialTime={timer.time}
                    onRemove={() => removeTimer(timer.id)}
                />
            ))}
            <footer className={"app-footer"}>
                <a href="https://github.com/dmytro-pro/react-timer" className="github-link" target="_blank">
                    dmytro-pro/react-timer
                </a>
            </footer>
        </div>
    );
};

// Render the app
const root = createRoot(document.getElementById('root'));
root.render(<PomodoroApp />);
