// Game variables
let score = 0;
let level = 1;
let combo = 0;
let comboTimer = null;
let isPaused = false;
let isMuted = false;
let isZenMode = false;
let powerLevel = 0;
let isPowerActive = false;
let bubbleInterval = null;
let speedMultiplier = 1;
let bubbleCount = 0;
let maxBubbles = 20;
let bubbleColors = 5;
let goldenBubbleChance = 0.05;
let currentTheme = 1;
let highScore = localStorage.getItem('highScore') || 0;
let currentScreen = 'menu'; // 'menu', 'game', 'end'

// DOM Elements
const gameContainer = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const comboElement = document.getElementById('combo');
const pauseButton = document.getElementById('pause-button');
const zenModeButton = document.getElementById('zen-mode');
const challengeModeButton = document.getElementById('challenge-mode');
const muteButton = document.getElementById('mute-button');
const powerButton = document.getElementById('power-button');
const powerFill = document.getElementById('power-fill');
const levelIndicator = document.getElementById('level-indicator');
const modalOverlay = document.getElementById('modal-overlay');
const resumeButton = document.getElementById('resume-button');
const restartButton = document.getElementById('restart-button');
const toggleSoundButton = document.getElementById('toggle-sound-button');
const pauseScoreElement = document.getElementById('pause-score');
const pauseLevelElement = document.getElementById('pause-level');
const themeButtons = document.querySelectorAll('.theme-btn');

// Audio elements
const popSound = new Audio();
popSound.src = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'; // Replace with your sound URL
const levelUpSound = new Audio();
levelUpSound.src = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'; // Replace with your sound URL
const powerSound = new Audio();
powerSound.src = 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3'; // Replace with your sound URL
const comboSound = new Audio();
comboSound.src = 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'; // Replace with your sound URL

// Initialize the game
function initGame() {
    clearInterval(bubbleInterval);
    score = 0;
    level = 1;
    combo = 0;
    powerLevel = 0;
    isPowerActive = false;
    speedMultiplier = 1;
    bubbleCount = 0;
    
    updateUI();
    updatePowerMeter();
    
    gameContainer.innerHTML = '';
    
    if (isZenMode) {
        bubbleInterval = setInterval(createBubble, 800);
    } else {
        bubbleInterval = setInterval(createBubble, 800 / speedMultiplier);
    }
}

// Create a bubble
function createBubble() {
    if (isPaused || bubbleCount >= maxBubbles) return;
    
    const bubble = document.createElement('div');
    const size = Math.random() * 60 + 40; // Random size between 40px and 100px
    
    // Random position within the container
    const posX = Math.random() * (gameContainer.offsetWidth - size);
    const posY = Math.random() * (gameContainer.offsetHeight - size);
    
    // Set random movement speed
    const speedX = (Math.random() - 0.5) * 2 * speedMultiplier;
    const speedY = (Math.random() - 0.5) * 2 * speedMultiplier;
    
    // Determine if bubble is golden (special)
    const isGolden = Math.random() < goldenBubbleChance;
    
    // Set bubble properties
    bubble.className = isGolden ? 'bubble golden' : `bubble color-${Math.floor(Math.random() * bubbleColors) + 1}`;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${posX}px`;
    bubble.style.top = `${posY}px`;
    
    // Store movement data directly on the element
    bubble.dataset.speedX = speedX;
    bubble.dataset.speedY = speedY;
    bubble.dataset.points = isGolden ? 50 : 10;
    
    // Add click event
    bubble.addEventListener('click', () => {
        if (isPaused) return;
        popBubble(bubble);
    });
    
    gameContainer.appendChild(bubble);
    bubbleCount++;
    
    // Set timeout to remove bubble if not clicked
    if (!isZenMode) {
        setTimeout(() => {
            if (bubble.parentNode === gameContainer) {
                gameContainer.removeChild(bubble);
                bubbleCount--;
                combo = 0;
                updateUI();
            }
        }, 6000 / speedMultiplier); // Bubbles last shorter as game progresses
    }
}

// Pop a bubble
function popBubble(bubble) {
    if (!isMuted) {
        popSound.currentTime = 0;
        popSound.play();
    }
    
    // Add points
    const points = parseInt(bubble.dataset.points);
    const isGolden = bubble.classList.contains('golden');
    
    // Apply combo multiplier
    let pointsToAdd = points;
    if (combo > 0) {
        pointsToAdd = points * (1 + combo / 10);
    }
    
    score += Math.round(pointsToAdd);
    
    // Increment combo
    combo++;
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        combo = 0;
        updateUI();
    }, 2000);
    
    // Add combo indicator
    const comboIndicator = document.createElement('div');
    comboIndicator.className = 'combo-indicator';
    comboIndicator.style.left = `${bubble.offsetLeft + bubble.offsetWidth / 2}px`;
    comboIndicator.style.top = `${bubble.offsetTop}px`;
    comboIndicator.textContent = combo > 1 ? `x${combo}` : '+' + points;
    
    gameContainer.appendChild(comboIndicator);
    
    // Play combo sound for big combos
    if (combo > 5 && !isMuted) {
        comboSound.currentTime = 0;
        comboSound.play();
    }
    
    // Remove combo indicator after animation
    setTimeout(() => {
        if (comboIndicator.parentNode === gameContainer) {
            gameContainer.removeChild(comboIndicator);
        }
    }, 1000);
    
    // Add power for each pop
    if (!isZenMode) {
        powerLevel += isGolden ? 20 : 5;
        if (powerLevel > 100) powerLevel = 100;
        updatePowerMeter();
    }
    
    // Apply pop animation
    bubble.classList.add('bubble-pop');
    setTimeout(() => {
        if (bubble.parentNode === gameContainer) {
            gameContainer.removeChild(bubble);
            bubbleCount--;
        }
    }, 300);
    
    // Level up based on score
    const shouldLevelUp = !isZenMode && score >= level * 500;
    if (shouldLevelUp) {
        levelUp();
    }
    
    updateUI();
}

// Level up
function levelUp() {
    level++;
    speedMultiplier = 1 + (level - 1) * 0.2;
    
    // Clear and restart bubble creation with new speed
    clearInterval(bubbleInterval);
    bubbleInterval = setInterval(createBubble, 800 / speedMultiplier);
    
    // Show level up indicator
    levelIndicator.textContent = `Level ${level}`;
    levelIndicator.id = 'level-up';
    
    if (!isMuted) {
        levelUpSound.currentTime = 0;
        levelUpSound.play();
    }
    
    // Reset level indicator after animation
    setTimeout(() => {
        levelIndicator.id = 'level-indicator';
    }, 2000);
    
    // Increase difficulty
    maxBubbles = Math.min(30, 20 + level);
    goldenBubbleChance = Math.min(0.2, 0.05 + level * 0.01);
}

// Activate power
function activatePower() {
    if (powerLevel < 100 || isPowerActive || isZenMode) return;
    
    isPowerActive = true;
    powerButton.classList.add('active');
    
    if (!isMuted) {
        powerSound.currentTime = 0;
        powerSound.play();
    }
    
    // Power effect: slow down time
    const originalSpeedMultiplier = speedMultiplier;
    speedMultiplier = speedMultiplier * 0.5;
    
    // Clear and restart bubble creation with slowed speed
    clearInterval(bubbleInterval);
    bubbleInterval = setInterval(createBubble, 800 / speedMultiplier);
    
    // Power lasts for 5 seconds
    setTimeout(() => {
        isPowerActive = false;
        powerButton.classList.remove('active');
        powerLevel = 0;
        updatePowerMeter();
        
        // Restore normal speed
        speedMultiplier = originalSpeedMultiplier;
        clearInterval(bubbleInterval);
        bubbleInterval = setInterval(createBubble, 800 / speedMultiplier);
    }, 5000);
}

// Update UI elements
function updateUI() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    comboElement.textContent = combo;
    pauseScoreElement.textContent = score;
    pauseLevelElement.textContent = level;
}

// Update power meter display
function updatePowerMeter() {
    powerFill.style.height = `${powerLevel}%`;
    if (powerLevel >= 100) {
        powerButton.classList.add('active');
    } else {
        powerButton.classList.remove('active');
    }
}

// Toggle pause
function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
        modalOverlay.classList.add('active');
        pauseButton.textContent = 'Resume';
    } else {
        modalOverlay.classList.remove('active');
        pauseButton.textContent = 'Pause';
    }
}

// Toggle mute
function toggleMute() {
    isMuted = !isMuted;
    
    if (isMuted) {
        muteButton.textContent = '🔇';
        toggleSoundButton.textContent = 'Unmute Sound';
    } else {
        muteButton.textContent = '🔊';
        toggleSoundButton.textContent = 'Mute Sound';
    }
}

// Toggle game mode
function toggleGameMode() {
    isZenMode = !isZenMode;
    
    if (isZenMode) {
        zenModeButton.classList.add('active');
        challengeModeButton.classList.remove('active');
    } else {
        zenModeButton.classList.remove('active');
        challengeModeButton.classList.add('active');
    }
    
    initGame();
}

// Change theme
function changeTheme(themeNumber) {
    currentTheme = themeNumber;
    
    // Update active button
    themeButtons.forEach((btn, index) => {
        if (index + 1 === themeNumber) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Change background gradient
    const themes = {
        1: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
        2: 'linear-gradient(135deg, #43cea2, #185a9d)',
        3: 'linear-gradient(135deg, #ff6b6b, #556270)'
    };
    
    document.body.style.background = themes[themeNumber];
}

// Animation loop for moving bubbles
function animateBubbles() {
    if (isPaused) return;
    
    const bubbles = document.querySelectorAll('.bubble');
    
    bubbles.forEach(bubble => {
        if (bubble.classList.contains('bubble-pop')) return;
        
        // Get current position
        let posX = parseFloat(bubble.style.left);
        let posY = parseFloat(bubble.style.top);
        
        // Get speed
        const speedX = parseFloat(bubble.dataset.speedX);
        const speedY = parseFloat(bubble.dataset.speedY);
        
        // Update position
        posX += speedX;
        posY += speedY;
        
        // Check boundaries and bounce
        const bubbleSize = bubble.offsetWidth;
        
        if (posX <= 0 || posX >= gameContainer.offsetWidth - bubbleSize) {
            bubble.dataset.speedX = -speedX;
        }
        
        if (posY <= 0 || posY >= gameContainer.offsetHeight - bubbleSize) {
            bubble.dataset.speedY = -speedY;
        }
        
        // Keep bubbles within boundaries
        posX = Math.max(0, Math.min(posX, gameContainer.offsetWidth - bubbleSize));
        posY = Math.max(0, Math.min(posY, gameContainer.offsetHeight - bubbleSize));
        
        // Update bubble position
        bubble.style.left = `${posX}px`;
        bubble.style.top = `${posY}px`;
    });
    
    requestAnimationFrame(animateBubbles);
}

// Event Listeners
pauseButton.addEventListener('click', togglePause);
muteButton.addEventListener('click', toggleMute);
zenModeButton.addEventListener('click', () => {
    if (!isZenMode) toggleGameMode();
});
challengeModeButton.addEventListener('click', () => {
    if (isZenMode) toggleGameMode();
});
powerButton.addEventListener('click', activatePower);
resumeButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', () => {
    togglePause();
    initGame();
});
toggleSoundButton.addEventListener('click', toggleMute);

themeButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        changeTheme(index + 1);
    });
});

// Window resize handler
window.addEventListener('resize', () => {
    // Ensure bubbles stay within bounds after resize
    const bubbles = document.querySelectorAll('.bubble');
    bubbles.forEach(bubble => {
        const bubbleSize = bubble.offsetWidth;
        let posX = parseFloat(bubble.style.left);
        let posY = parseFloat(bubble.style.top);
        
        posX = Math.min(posX, gameContainer.offsetWidth - bubbleSize);
        posY = Math.min(posY, gameContainer.offsetHeight - bubbleSize);
        
        bubble.style.left = `${posX}px`;
        bubble.style.top = `${posY}px`;
    });
});

// Save high score to localStorage
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
}

// Show start menu screen
function showStartMenu() {
    currentScreen = 'menu';
    // Hide game elements
    document.getElementById('header').style.display = 'none';
    gameContainer.style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('power-meter').style.display = 'none';
    document.getElementById('power-button').style.display = 'none';
    
    // Create and show menu if it doesn't exist
    if (!document.getElementById('start-menu')) {
        const startMenu = document.createElement('div');
        startMenu.id = 'start-menu';
        startMenu.innerHTML = `
            <h1>Bubble Pop Zen</h1>
            <h3>High Score: <span id="menu-high-score">${highScore}</span></h3>
            
            <div class="menu-section">
                <h4>Game Mode</h4>
                <div class="option-group">
                    <button id="menu-zen" class="option-button">Zen Mode</button>
                    <button id="menu-challenge" class="option-button active">Challenge Mode</button>
                </div>
            </div>
            
            <div class="menu-section">
                <h4>Theme</h4>
                <div class="option-group">
                    <div id="menu-theme-1" class="theme-option active"></div>
                    <div id="menu-theme-2" class="theme-option"></div>
                    <div id="menu-theme-3" class="theme-option"></div>
                </div>
            </div>
            
            <div class="menu-section">
                <h4>Sound</h4>
                <div class="option-group">
                    <button id="menu-sound-on" class="option-button active">On</button>
                    <button id="menu-sound-off" class="option-button">Off</button>
                </div>
            </div>
            
            <button id="start-game-button" class="large-button">Start Game</button>
        `;
        
        document.body.appendChild(startMenu);
        
        // Add event listeners for menu options
        document.getElementById('menu-zen').addEventListener('click', () => {
            isZenMode = true;
            document.getElementById('menu-zen').classList.add('active');
            document.getElementById('menu-challenge').classList.remove('active');
        });
        
        document.getElementById('menu-challenge').addEventListener('click', () => {
            isZenMode = false;
            document.getElementById('menu-challenge').classList.add('active');
            document.getElementById('menu-zen').classList.remove('active');
        });
        
        document.getElementById('menu-sound-on').addEventListener('click', () => {
            isMuted = false;
            document.getElementById('menu-sound-on').classList.add('active');
            document.getElementById('menu-sound-off').classList.remove('active');
        });
        
        document.getElementById('menu-sound-off').addEventListener('click', () => {
            isMuted = true;
            document.getElementById('menu-sound-off').classList.add('active');
            document.getElementById('menu-sound-on').classList.remove('active');
        });
        
        // Theme selectors
        const menuThemes = document.querySelectorAll('.theme-option');
        menuThemes.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                menuThemes.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                changeTheme(index + 1);
            });
        });
        
        // Start game button
        document.getElementById('start-game-button').addEventListener('click', () => {
            document.getElementById('start-menu').style.display = 'none';
            showGameScreen();
        });
    } else {
        document.getElementById('menu-high-score').textContent = highScore;
        document.getElementById('start-menu').style.display = 'flex';
    }
}

// Show game screen
function showGameScreen() {
    currentScreen = 'game';
    // Hide menu
    if (document.getElementById('start-menu')) {
        document.getElementById('start-menu').style.display = 'none';
    }
    
    // Hide end screen
    if (document.getElementById('end-screen')) {
        document.getElementById('end-screen').style.display = 'none';
    }
    
    // Show minimalist game UI
    document.getElementById('header').style.display = 'flex';
    gameContainer.style.display = 'block';
    document.getElementById('controls').style.display = 'flex';
    document.getElementById('power-meter').style.display = 'block';
    document.getElementById('power-button').style.display = 'flex';
    
    // Simplify UI for mobile
    const themeControls = document.getElementById('theme-controls');
    themeControls.style.display = 'none';
    
    // Change controls to icons
    pauseButton.innerHTML = '⏸️';
    pauseButton.classList.add('icon-button');
    
    muteButton.classList.add('icon-button');
    
    // Add exit button
    if (!document.getElementById('exit-button')) {
        const exitButton = document.createElement('button');
        exitButton.id = 'exit-button';
        exitButton.className = 'button icon-button';
        exitButton.innerHTML = '✖️';
        exitButton.addEventListener('click', endGame);
        document.getElementById('controls').appendChild(exitButton);
    }
    
    // Hide game mode buttons
    zenModeButton.style.display = 'none';
    challengeModeButton.style.display = 'none';
    
    // Initialize and start the game
    initGame();
    requestAnimationFrame(animateBubbles);
}

// Show end screen
function showEndScreen() {
    currentScreen = 'end';
    // Save high score
    saveHighScore();
    
    // Hide game elements
    document.getElementById('header').style.display = 'none';
    gameContainer.style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('power-meter').style.display = 'none';
    document.getElementById('power-button').style.display = 'none';
    
    // Clear any remaining bubbles and intervals
    clearInterval(bubbleInterval);
    gameContainer.innerHTML = '';
    
    // Create and show end screen
    if (!document.getElementById('end-screen')) {
        const endScreen = document.createElement('div');
        endScreen.id = 'end-screen';
        endScreen.innerHTML = `
            <h1>Game Over</h1>
            <div class="score-container">
                <div class="score-item">
                    <h3>Your Score</h3>
                    <p id="final-score">${score}</p>
                </div>
                <div class="score-item">
                    <h3>High Score</h3>
                    <p id="final-high-score">${highScore}</p>
                </div>
            </div>
            <div class="end-stats">
                <div class="stat">Level Reached: <span id="final-level">${level}</span></div>
                <div class="stat">Max Combo: <span id="final-combo">${combo}</span></div>
            </div>
            <button id="play-again-button" class="large-button">Play Again</button>
            <button id="main-menu-button" class="large-button">Main Menu</button>
        `;
        
        document.body.appendChild(endScreen);
        
        // Add event listeners
        document.getElementById('play-again-button').addEventListener('click', () => {
            document.getElementById('end-screen').style.display = 'none';
            showGameScreen();
        });
        
        document.getElementById('main-menu-button').addEventListener('click', () => {
            document.getElementById('end-screen').style.display = 'none';
            showStartMenu();
        });
    } else {
        // Update scores
        document.getElementById('final-score').textContent = score;
        document.getElementById('final-high-score').textContent = highScore;
        document.getElementById('final-level').textContent = level;
        document.getElementById('final-combo').textContent = combo;
        document.getElementById('end-screen').style.display = 'flex';
    }
}

// End the current game and show end screen
function endGame() {
    saveHighScore();
    showEndScreen();
}

// Modify togglePause to work with new UI
const originalTogglePause = togglePause;
togglePause = function() {
    originalTogglePause();
    if (isPaused) {
        pauseButton.innerHTML = '▶️';
    } else {
        pauseButton.innerHTML = '⏸️';
    }
};

// Start the application
window.addEventListener('load', () => {
    // Load high score
    highScore = parseInt(localStorage.getItem('highScore') || '0');
    
    // Start with the menu screen
    showStartMenu();
});