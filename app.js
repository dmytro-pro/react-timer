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

// Timer component
const Timer = ({ initialTime, onRemove }) => {
    const [time, setTime] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);
    const [name, setName] = useState(`${initialTime / 60} min timer`);
    const [isComplete, setIsComplete] = useState(false);
    const [audio] = useState(new Audio('trimmed_audio.mp3'));
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        let interval;
        if (isRunning && time > 0) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime - 1);
            }, 1000);
        } else if (time === 0 && isRunning) {
            setIsComplete(true);
            setIsRunning(false);
            playSound();
        }
        return () => clearInterval(interval);
    }, [isRunning, time]);

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
        setTime(initialTime);
        setIsRunning(false);
    };

    const handlePlayPause = () => {
        if (!isAudioEnabled) {
            setIsAudioEnabled(true);

            audio.load();
        }
        if (time === 0) {
            setTime(1);
            setIsRunning(true);
        } else {
            setIsRunning(!isRunning);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const adjustTime = (amount) => {
        setTime((prevTime) => Math.max(0, prevTime + amount));
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
                    <span className="timer-display">{formatTime(time)}</span>
                    <Button onClick={() => adjustTime(30)} size="sm" variant="outline"><Plus /></Button>
                </div>
                <div className="flex justify-between">
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
            <h1>Pomodoro Timer App🍅</h1>
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
                    <img className={"bottom-logo"} src="github-mark.svg" alt="github logo"/>dmytro-pro/react-timer
                </a>
            </footer>
        </div>
    );
};

// Render the app
const root = createRoot(document.getElementById('root'));
root.render(<PomodoroApp />);
