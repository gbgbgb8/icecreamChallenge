// Game state
const gameState = {
    timer: 0,
    coins: 0,
    level: 1,
    currentOrder: {},
    currentCreation: {
        base: null,
        flavor: null,
        toppings: []
    },
    unlockedItems: {
        mint: false,
        oreos: false,
        'gummy-worms': false
    },
    gameActive: false,
    timerInterval: null,
    soundEnabled: false, // Sounds muted by default
    streak: 0, // Track correct orders in a row
    orderStartTime: 0, // Track when the current order started
    difficulty: 'easy', // Default difficulty
    gameStarted: false, // Track if the game has been started from title screen
    difficultySettings: {
        easy: {
            coinsMultiplier: 1.5,      // More coins per order
            levelUpCoinsThreshold: 80, // Easier to level up with coins
            levelUpStreakThreshold: 4, // Easier to level up with streaks
            maxToppingsMultiplier: 0.7, // Fewer toppings in orders
            timeBonusThresholds: [8, 15, 20] // More time for bonuses
        },
        medium: {
            coinsMultiplier: 1.0,       // Standard coins
            levelUpCoinsThreshold: 100, // Standard level up threshold
            levelUpStreakThreshold: 5,  // Standard streak threshold
            maxToppingsMultiplier: 1.0, // Standard toppings
            timeBonusThresholds: [5, 10, 15] // Standard time bonuses
        },
        hard: {
            coinsMultiplier: 0.8,       // Fewer coins per order
            levelUpCoinsThreshold: 150, // Harder to level up with coins
            levelUpStreakThreshold: 7,  // Harder to level up with streaks
            maxToppingsMultiplier: 1.3, // More toppings in orders
            timeBonusThresholds: [3, 7, 12] // Less time for bonuses
        }
    },
    customerEmojis: ['👧', '👦', '👩', '👨', '👵', '👴', '🧒', '👶'],
    baseItems: ['cone', 'cup'],
    flavorItems: {
        basic: ['chocolate', 'strawberry', 'vanilla'],
        unlockable: ['mint']
    },
    toppingItems: {
        basic: ['sprinkles', 'chocolate-chips'],
        unlockable: ['oreos', 'gummy-worms']
    },
    emojiMap: {
        // Bases
        cone: '🍦',
        cup: '🥤',
        // Flavors
        chocolate: '🍫',
        strawberry: '🍓',
        vanilla: '🍨',
        mint: '🍃',
        // Toppings
        sprinkles: '🌈',
        'chocolate-chips': '💩',
        oreos: '🍪',
        'gummy-worms': '🪱'
    },
    feedbackEmojis: {
        correct: ['🎉', '🥳', '⭐', '✨', '👏', '🎊'],
        wrong: ['💥', '💦', '🤦', '😵', '🙊', '😬']
    },
    streakMessages: [
        "🍨 Sweet Start!",
        "🍦 Vanilla Victory!",
        "🍫 Hot Fudge!",
        "🍓 Berry Blast!",
        "🍌 Going Bananas!",
        "🧁 Sugar Rush!",
        "🍪 Cookie Craze!",
        "🍭 Candy Crush!",
        "🍧 Brain Freeze!",
        "🔥 On Fire!"
    ],
    failMessages: [
        "Awe Fudge!",
        "Melting Down!",
        "Sprinkle Spill!",
        "Dropped Scoop!",
        "Sticky Situation!"
    ],
    sounds: {
        correct: new Howl({
            src: ['https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3'],
            volume: 0.5
        }),
        wrong: new Howl({
            src: ['https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3'],
            volume: 0.5
        }),
        click: new Howl({
            src: ['https://cdn.freesound.org/previews/522/522640_10058132-lq.mp3'],
            volume: 0.3
        }),
        levelUp: new Howl({
            src: ['https://cdn.freesound.org/previews/320/320775_5260872-lq.mp3'],
            volume: 0.5
        }),
        purchase: new Howl({
            src: ['https://cdn.freesound.org/previews/352/352661_5858296-lq.mp3'],
            volume: 0.5
        }),
        gameOver: new Howl({
            src: ['https://cdn.freesound.org/previews/277/277021_4932087-lq.mp3'],
            volume: 0.5
        }),
        streak: new Howl({
            src: ['https://cdn.freesound.org/previews/339/339912_5121074-lq.mp3'],
            volume: 0.5
        })
    }
};

// DOM Elements
const timeElement = document.getElementById('time');
const coinsElement = document.getElementById('coins');
const levelElement = document.getElementById('level');
const customerOrderElement = document.getElementById('customer-order');
const customerEmojiElement = document.querySelector('.customer-emoji');
const currentCreationElement = document.getElementById('current-creation');
const baseDisplayElement = document.getElementById('base-display');
const serveButton = document.getElementById('serve-button');
const resetButton = document.getElementById('reset-button');
const finishButton = document.getElementById('finish-button');
const shopButton = document.getElementById('shop-button');
const soundToggleElement = document.getElementById('sound-toggle');
const shopModal = document.getElementById('shop-modal');
const levelUpModal = document.getElementById('level-up-modal');
const gameOverModal = document.getElementById('game-over-modal');
const newLevelElement = document.getElementById('new-level');
const finalCoinsElement = document.getElementById('final-coins');
const finalLevelElement = document.getElementById('final-level');
const continueButton = document.getElementById('continue-button');
const playAgainButton = document.getElementById('play-again-button');
const returnToTitleButton = document.getElementById('return-to-title-button');
const closeButtons = document.querySelectorAll('.close');
const difficultySelector = document.getElementById('difficulty');
const titleScreenModal = document.getElementById('title-screen-modal');
const difficultyButtons = document.querySelectorAll('.difficulty-button');
const difficultyTitle = document.getElementById('difficulty-title');
const difficultyDescription = document.getElementById('difficulty-description');
const startGameButton = document.getElementById('start-game-button');

// Difficulty descriptions
const difficultyDescriptions = {
    easy: "More coins per order, easier level-up requirements, simpler orders, and more time for speed bonuses.",
    medium: "Standard gameplay with balanced rewards and challenges.",
    hard: "Fewer coins per order, tougher level-up requirements, more complex orders, and stricter time limits for bonuses."
};

// Play a sound if sound is enabled
function playSound(soundName) {
    if (gameState.soundEnabled && gameState.sounds[soundName]) {
        gameState.sounds[soundName].play();
    }
}

// Toggle sound on/off
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundToggleElement.textContent = gameState.soundEnabled ? '🔊' : '🔇';
    
    // Play a test sound when enabling
    if (gameState.soundEnabled) {
        playSound('click');
    }
}

// Initialize the game
function initGame() {
    // Set up event listeners
    document.querySelectorAll('.ingredient').forEach(item => {
        item.addEventListener('click', handleIngredientClick);
        
        // Make sure locked items show the correct emoji when unlocked
        if (item.classList.contains('locked')) {
            const itemName = item.dataset.item;
            // Store the correct emoji as a data attribute for later use
            item.dataset.unlockedEmoji = gameState.emojiMap[itemName];
            
            // Add tooltip text showing what the item is
            const itemType = itemName === 'mint' ? 'Flavor' : 'Topping';
            const cost = itemName === 'mint' ? '50' : (itemName === 'oreos' ? '75' : '100');
            item.title = `${itemName.charAt(0).toUpperCase() + itemName.slice(1).replace('-', ' ')} ${itemType} (${cost} coins)`;
        }
    });

    serveButton.addEventListener('click', handleServe);
    resetButton.addEventListener('click', resetCreation);
    finishButton.addEventListener('click', endGame);
    shopButton.addEventListener('click', openShop);
    soundToggleElement.addEventListener('click', toggleSound);
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            shopModal.style.display = 'none';
        });
    });

    document.querySelectorAll('.buy-button').forEach(button => {
        button.addEventListener('click', handlePurchase);
    });

    continueButton.addEventListener('click', () => {
        levelUpModal.style.display = 'none';
        generateNewOrder();
    });

    playAgainButton.addEventListener('click', () => {
        gameOverModal.style.display = 'none';
        startNewGame();
    });
    
    returnToTitleButton.addEventListener('click', () => {
        gameOverModal.style.display = 'none';
        showTitleScreen();
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === shopModal) {
            shopModal.style.display = 'none';
        }
    });

    // Add difficulty change listener for in-game selector
    difficultySelector.addEventListener('change', changeDifficulty);

    // Title screen difficulty buttons
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove selected class from all buttons
            difficultyButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add selected class to clicked button
            button.classList.add('selected');
            
            // Update difficulty
            const selectedDifficulty = button.dataset.difficulty;
            gameState.difficulty = selectedDifficulty;
            
            // Update difficulty selector in game UI to match
            difficultySelector.value = selectedDifficulty;
            
            // Update description
            updateDifficultyDescription(selectedDifficulty);
        });
    });
    
    // Start game button
    startGameButton.addEventListener('click', () => {
        titleScreenModal.style.display = 'none';
        startNewGame();
    });

    // Show title screen instead of starting game immediately
    showTitleScreen();
}

// Show title screen
function showTitleScreen() {
    // Reset game state
    resetGameState();
    
    // Select default difficulty button
    const defaultDifficultyButton = document.querySelector(`.difficulty-button[data-difficulty="${gameState.difficulty}"]`);
    if (defaultDifficultyButton) {
        // Remove selected class from all buttons
        difficultyButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Add selected class to default button
        defaultDifficultyButton.classList.add('selected');
        
        // Update description
        updateDifficultyDescription(gameState.difficulty);
    }
    
    // Show title screen
    titleScreenModal.style.display = 'block';
    
    // Hide any other modals
    gameOverModal.style.display = 'none';
    levelUpModal.style.display = 'none';
    shopModal.style.display = 'none';
}

// Update difficulty description
function updateDifficultyDescription(difficulty) {
    difficultyTitle.textContent = `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode`;
    difficultyDescription.textContent = difficultyDescriptions[difficulty];
}

// Reset game state
function resetGameState() {
    gameState.timer = 0;
    gameState.coins = 0;
    gameState.level = 1;
    gameState.gameActive = false;
    gameState.gameStarted = false;
    gameState.streak = 0;
    gameState.orderStartTime = 0;
    
    // Reset unlocked items
    gameState.unlockedItems = {
        mint: false,
        oreos: false,
        'gummy-worms': false
    };
    
    // Reset locked items in the UI
    document.querySelectorAll('.ingredient').forEach(item => {
        const itemName = item.dataset.item;
        if (gameState.flavorItems.unlockable.includes(itemName) || 
            gameState.toppingItems.unlockable.includes(itemName)) {
            item.classList.add('locked');
            item.textContent = '🔒';
        }
    });
    
    // Update UI
    updateUI();
    
    // Clear any existing timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// Start a new game
function startNewGame() {
    // Set game as active and started
    gameState.gameActive = true;
    gameState.gameStarted = true;
    
    // Update UI
    updateUI();
    
    // Clear any existing timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    // Start the timer
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    // Generate first order
    generateNewOrder();
    
    // Hide modals
    gameOverModal.style.display = 'none';
    titleScreenModal.style.display = 'none';
}

// Update the timer
function updateTimer() {
    if (gameState.gameActive) {
        gameState.timer++;
        timeElement.textContent = gameState.timer;
        
        // Removed automatic time-based level up
    }
}

// End the game
function endGame() {
    gameState.gameActive = false;
    clearInterval(gameState.timerInterval);
    
    // Update final stats
    document.getElementById('final-time').textContent = gameState.timer;
    finalCoinsElement.textContent = gameState.coins;
    finalLevelElement.textContent = gameState.level;
    
    // Show game over modal
    gameOverModal.style.display = 'block';
    
    // Play game over sound
    playSound('gameOver');
}

// Calculate order complexity
function calculateOrderComplexity(order) {
    // Base complexity: 1 for base + flavor
    let complexity = 1;
    
    // Add complexity for each topping
    complexity += order.toppings.length * 0.5;
    
    // Add complexity for special items
    if (order.flavor === 'mint') complexity += 0.5;
    if (order.toppings.includes('oreos')) complexity += 0.5;
    if (order.toppings.includes('gummy-worms')) complexity += 0.5;
    
    return Math.max(1, Math.min(5, complexity)); // Clamp between 1-5
}

// Calculate time bonus based on how quickly the order was fulfilled
function calculateTimeBonus(orderStartTime, currentTime) {
    const timeTaken = currentTime - orderStartTime;
    const thresholds = gameState.difficultySettings[gameState.difficulty].timeBonusThresholds;
    
    // Fast service (under first threshold)
    if (timeTaken < thresholds[0]) return 2.0;
    
    // Good service (under second threshold)
    if (timeTaken < thresholds[1]) return 1.5;
    
    // Average service (under third threshold)
    if (timeTaken < thresholds[2]) return 1.2;
    
    // Slow service (over third threshold)
    return 1.0;
}

// Get streak message
function getStreakMessage(streak, isSuccess) {
    if (!isSuccess) {
        // Return a random fail message
        return gameState.failMessages[Math.floor(Math.random() * gameState.failMessages.length)];
    }
    
    // Cap the streak index to the max available messages
    const messageIndex = Math.min(streak, gameState.streakMessages.length - 1);
    return gameState.streakMessages[messageIndex];
}

// Generate a new customer order
function generateNewOrder() {
    const order = {
        base: getRandomItem(gameState.baseItems),
        flavor: getRandomFlavor(),
        toppings: []
    };
    
    // Add toppings based on level and difficulty
    const difficultyMultiplier = gameState.difficultySettings[gameState.difficulty].maxToppingsMultiplier;
    const maxToppings = Math.min(Math.floor((gameState.level / 2 + 1) * difficultyMultiplier), 3);
    const numToppings = Math.max(1, Math.floor(Math.random() * maxToppings) + 1);
    
    const availableToppings = [...gameState.toppingItems.basic];
    
    // Add unlocked toppings
    for (const topping of gameState.toppingItems.unlockable) {
        if (gameState.unlockedItems[topping]) {
            availableToppings.push(topping);
        }
    }
    
    // Randomly select toppings
    for (let i = 0; i < numToppings; i++) {
        if (availableToppings.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableToppings.length);
            const topping = availableToppings.splice(randomIndex, 1)[0];
            order.toppings.push(topping);
        }
    }
    
    gameState.currentOrder = order;
    
    // Calculate and store the complexity
    gameState.currentOrder.complexity = calculateOrderComplexity(order);
    
    // Record the start time for this order
    gameState.orderStartTime = gameState.timer;
    
    // Update customer emoji
    const randomEmoji = getRandomItem(gameState.customerEmojis);
    customerEmojiElement.textContent = randomEmoji;
    
    // Update order text
    customerOrderElement.textContent = generateOrderText(order);
    
    // Reset current creation
    resetCreation();
}

// Generate readable order text
function generateOrderText(order) {
    let text = `I'd like a ${order.base} with ${order.flavor} ice cream`;
    
    if (order.toppings.length > 0) {
        if (order.toppings.length === 1) {
            text += ` and ${order.toppings[0]}`;
        } else {
            const lastTopping = order.toppings.pop();
            text += ` with ${order.toppings.join(', ')} and ${lastTopping}`;
            order.toppings.push(lastTopping); // Restore the array
        }
    }
    
    return text + ', please!';
}

// Get a random item from an array
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Get a random flavor based on unlocked items
function getRandomFlavor() {
    const availableFlavors = [...gameState.flavorItems.basic];
    
    // Add unlocked flavors
    for (const flavor of gameState.flavorItems.unlockable) {
        if (gameState.unlockedItems[flavor]) {
            availableFlavors.push(flavor);
        }
    }
    
    return getRandomItem(availableFlavors);
}

// Handle ingredient click
function handleIngredientClick(event) {
    const ingredient = event.currentTarget;
    const itemType = ingredient.parentElement.id;
    const itemName = ingredient.dataset.item;
    
    // Check if item is locked
    if (ingredient.classList.contains('locked')) {
        return;
    }
    
    // Play click sound
    playSound('click');
    
    // Handle different item types
    switch (itemType) {
        case 'base-items':
            gameState.currentCreation.base = itemName;
            break;
        case 'flavor-items':
            gameState.currentCreation.flavor = itemName;
            break;
        case 'topping-items':
            // Don't add duplicate toppings
            if (!gameState.currentCreation.toppings.includes(itemName)) {
                gameState.currentCreation.toppings.push(itemName);
            }
            break;
    }
    
    // Update the display
    updateCreationDisplay();
}

// Update the creation display
function updateCreationDisplay() {
    // Clear the display
    currentCreationElement.innerHTML = '';
    
    // Create a container for the creation
    const creationContainer = document.createElement('div');
    creationContainer.className = 'creation-container';
    
    // If nothing selected, show prompt
    if (!gameState.currentCreation.base && !gameState.currentCreation.flavor && gameState.currentCreation.toppings.length === 0) {
        const promptElement = document.createElement('div');
        promptElement.className = 'base-item';
        promptElement.textContent = '👋 Start here!';
        currentCreationElement.appendChild(promptElement);
        return;
    }
    
    // Add base if selected
    if (gameState.currentCreation.base) {
        const baseElement = document.createElement('div');
        baseElement.className = 'creation-item';
        baseElement.textContent = gameState.emojiMap[gameState.currentCreation.base];
        baseElement.dataset.item = gameState.currentCreation.base;
        currentCreationElement.appendChild(baseElement);
    }
    
    // Add flavor if selected
    if (gameState.currentCreation.flavor) {
        const flavorElement = document.createElement('div');
        flavorElement.className = 'creation-item';
        flavorElement.textContent = gameState.emojiMap[gameState.currentCreation.flavor];
        flavorElement.dataset.item = gameState.currentCreation.flavor;
        currentCreationElement.appendChild(flavorElement);
    }
    
    // Add toppings if any
    gameState.currentCreation.toppings.forEach(topping => {
        const toppingElement = document.createElement('div');
        toppingElement.className = 'creation-item';
        toppingElement.textContent = gameState.emojiMap[topping];
        toppingElement.dataset.item = topping;
        currentCreationElement.appendChild(toppingElement);
    });
    
    // Add a "+" between items to show they're being combined
    const creationItems = currentCreationElement.querySelectorAll('.creation-item');
    if (creationItems.length > 1) {
        for (let i = 0; i < creationItems.length - 1; i++) {
            const plusElement = document.createElement('div');
            plusElement.className = 'creation-plus';
            plusElement.textContent = '+';
            currentCreationElement.insertBefore(plusElement, creationItems[i + 1]);
        }
    }
}

// Reset the current creation
function resetCreation() {
    gameState.currentCreation = {
        base: null,
        flavor: null,
        toppings: []
    };
    
    updateCreationDisplay();
}

// Handle serving the creation
function handleServe() {
    if (!gameState.gameActive) return;
    
    // Check if creation matches order
    const isCorrect = checkOrder();
    
    if (isCorrect) {
        // Calculate base coins based on level, complexity and difficulty
        const complexity = gameState.currentOrder.complexity;
        const difficultyMultiplier = gameState.difficultySettings[gameState.difficulty].coinsMultiplier;
        const baseCoins = Math.round(10 * gameState.level * complexity * difficultyMultiplier);
        
        // Calculate time bonus
        const timeBonus = calculateTimeBonus(gameState.orderStartTime, gameState.timer);
        
        // Calculate streak bonus (starts at 1.0, increases by 0.1 for each streak up to 2.0)
        const streakBonus = Math.min(2.0, 1.0 + (gameState.streak * 0.1));
        
        // Calculate total coins with all bonuses
        const earnedCoins = Math.round(baseCoins * timeBonus * streakBonus);
        
        // Increment streak
        gameState.streak++;
        
        // Add coins
        gameState.coins += earnedCoins;
        
        // Get streak message
        const streakMessage = getStreakMessage(gameState.streak - 1, true);
        
        // Show coin animation with streak message
        const coinAnimation = document.createElement('div');
        coinAnimation.className = 'coin-animation';
        
        // Show different text based on bonuses
        let bonusText = '';
        if (timeBonus > 1.0) bonusText += ' ⚡ Speed Bonus!';
        if (streakBonus > 1.0) bonusText += ` 🔥 x${gameState.streak} Streak!`;
        
        coinAnimation.innerHTML = `+${earnedCoins} 🪙<br>${streakMessage}${bonusText}`;
        document.querySelector('.coins').appendChild(coinAnimation);
        
        // Remove animation after it completes
        setTimeout(() => {
            coinAnimation.remove();
        }, 1500);
        
        // Play correct sound
        playSound('correct');
        
        // Play streak sound if streak is 3 or higher
        if (gameState.streak >= 3) {
            playSound('streak');
        }
        
        // Add correct animation
        currentCreationElement.classList.add('correct-animation');
        
        // Show confetti/celebration emoji
        showFeedbackEmoji(true);
        
        setTimeout(() => {
            currentCreationElement.classList.remove('correct-animation');
        }, 500);
        
        // Check for level up based on multiple factors
        checkForLevelUp();
        
        // Generate new order
        generateNewOrder();
    } else {
        // Reset streak
        const oldStreak = gameState.streak;
        gameState.streak = 0;
        
        // Get fail message
        const failMessage = getStreakMessage(0, false);
        
        // Show streak broken message if had a streak
        if (oldStreak >= 2) {
            const streakBroken = document.createElement('div');
            streakBroken.className = 'streak-broken';
            streakBroken.innerHTML = `${failMessage}<br>Streak Broken!`;
            document.querySelector('.coins').appendChild(streakBroken);
            
            // Remove animation after it completes
            setTimeout(() => {
                streakBroken.remove();
            }, 1500);
        }
        
        // Play wrong sound
        playSound('wrong');
        
        // Add wrong animation
        currentCreationElement.classList.add('wrong-animation');
        
        // Show splat/error emoji
        showFeedbackEmoji(false);
        
        setTimeout(() => {
            currentCreationElement.classList.remove('wrong-animation');
        }, 500);
    }
    
    // Update UI
    updateUI();
}

// Check if the creation matches the order
function checkOrder() {
    const order = gameState.currentOrder;
    const creation = gameState.currentCreation;
    
    // Check base and flavor
    if (order.base !== creation.base || order.flavor !== creation.flavor) {
        return false;
    }
    
    // Check toppings (order doesn't matter)
    if (order.toppings.length !== creation.toppings.length) {
        return false;
    }
    
    // Check if all order toppings are in the creation
    for (const topping of order.toppings) {
        if (!creation.toppings.includes(topping)) {
            return false;
        }
    }
    
    return true;
}

// Level up
function levelUp() {
    gameState.level++;
    
    // Update level display
    newLevelElement.textContent = gameState.level;
    
    // Show level up modal
    levelUpModal.style.display = 'block';
    
    // Play level up sound
    playSound('levelUp');
}

// Open the shop
function openShop() {
    // Update shop items based on what's unlocked
    document.querySelectorAll('.shop-item').forEach(item => {
        const itemName = item.dataset.item;
        const buyButton = item.querySelector('.buy-button');
        
        if (gameState.unlockedItems[itemName]) {
            buyButton.textContent = 'Unlocked';
            buyButton.disabled = true;
            item.classList.add('unlocked');
        } else {
            buyButton.textContent = 'Buy';
            buyButton.disabled = false;
            item.classList.remove('unlocked');
        }
    });
    
    // Show shop modal
    shopModal.style.display = 'block';
}

// Handle purchase
function handlePurchase(event) {
    const button = event.currentTarget;
    const shopItem = button.closest('.shop-item');
    const itemName = shopItem.dataset.item;
    const itemCost = parseInt(shopItem.dataset.cost);
    
    // Check if player has enough coins
    if (gameState.coins >= itemCost) {
        // Deduct coins
        gameState.coins -= itemCost;
        
        // Unlock item
        gameState.unlockedItems[itemName] = true;
        
        // Update UI
        button.textContent = 'Unlocked';
        button.disabled = true;
        shopItem.classList.add('unlocked');
        
        // Update ingredient display
        document.querySelectorAll('.ingredient').forEach(ingredient => {
            if (ingredient.dataset.item === itemName) {
                ingredient.classList.remove('locked');
                // Update the emoji display for unlocked items
                ingredient.textContent = gameState.emojiMap[itemName];
            }
        });
        
        // Play purchase sound
        playSound('purchase');
        
        // Update coins display
        updateUI();
    } else {
        // Not enough coins - shake the coin display
        const coinsDisplay = document.querySelector('.coins');
        coinsDisplay.classList.add('wrong-animation');
        setTimeout(() => {
            coinsDisplay.classList.remove('wrong-animation');
        }, 500);
        
        // Add not-enough-coins class to shop item
        shopItem.classList.add('not-enough-coins');
        setTimeout(() => {
            shopItem.classList.remove('not-enough-coins');
        }, 500);
        
        // Play wrong sound
        playSound('wrong');
    }
}

// Update UI elements
function updateUI() {
    timeElement.textContent = gameState.timer;
    coinsElement.textContent = gameState.coins;
    levelElement.textContent = gameState.level;
    
    // Update streak indicator
    const streakElement = document.querySelector('.streak');
    if (streakElement) {
        document.getElementById('streak-counter').textContent = gameState.streak;
        
        // Highlight streak when active
        if (gameState.streak >= 2) {
            streakElement.setAttribute('data-active', 'true');
        } else {
            streakElement.removeAttribute('data-active');
        }
    }
}

// Show feedback emoji for correct/incorrect orders
function showFeedbackEmoji(isCorrect) {
    const feedbackContainer = document.createElement('div');
    feedbackContainer.className = isCorrect ? 'feedback-emoji correct' : 'feedback-emoji wrong';
    
    // Choose random emoji from the appropriate array
    const emojis = isCorrect ? gameState.feedbackEmojis.correct : gameState.feedbackEmojis.wrong;
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    feedbackContainer.textContent = randomEmoji;
    currentCreationElement.appendChild(feedbackContainer);
    
    // Remove after animation completes
    setTimeout(() => {
        feedbackContainer.remove();
    }, 1500);
}

// New function to check for level up based on multiple factors
function checkForLevelUp() {
    // Don't level up past level 5
    if (gameState.level >= 5) return;
    
    // Get difficulty settings
    const settings = gameState.difficultySettings[gameState.difficulty];
    
    // Level up criteria - any of these can trigger a level up:
    
    // 1. Coins threshold: Different thresholds for each level and difficulty
    const coinsThreshold = gameState.level * settings.levelUpCoinsThreshold;
    
    // 2. Streak threshold: Higher streaks can trigger level ups, varies by difficulty
    const streakThreshold = settings.levelUpStreakThreshold;
    
    // 3. Items unlocked: Unlocking new items can trigger level ups
    const unlockedItemsCount = Object.values(gameState.unlockedItems).filter(Boolean).length;
    const itemsThreshold = Math.floor(gameState.level / 2); // Level 2: 1 item, Level 4: 2 items
    
    // Check if any threshold is met
    if (gameState.coins >= coinsThreshold || 
        gameState.streak >= streakThreshold || 
        unlockedItemsCount >= itemsThreshold) {
        levelUp();
    }
}

// Change difficulty - now only used for in-game changes
function changeDifficulty() {
    // Only allow changing difficulty before the game starts or when restarting
    if (!gameState.gameStarted || !gameState.gameActive) {
        gameState.difficulty = difficultySelector.value;
        
        // If game has been started but is not active, restart with new difficulty
        if (gameState.gameStarted && !gameState.gameActive) {
            startNewGame();
        }
        
        // Show toast notification
        showToastNotification(`Difficulty set to ${gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1)}!`);
    } else {
        // Reset the selector to current difficulty if trying to change mid-game
        difficultySelector.value = gameState.difficulty;
        showToastNotification("Can't change difficulty during gameplay! Finish your game first.");
    }
}

// Show toast notification
function showToastNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after animation
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

// Initialize the game when the page loads
window.addEventListener('load', initGame);
