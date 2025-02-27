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
    sounds: {
        correct: new Howl({
            src: ['https://assets.mixkit.co/sfx/preview/mixkit-game-reward-sound-2069.mp3'],
            volume: 0.5
        }),
        wrong: new Howl({
            src: ['https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3'],
            volume: 0.5
        }),
        click: new Howl({
            src: ['https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3'],
            volume: 0.3
        }),
        levelUp: new Howl({
            src: ['https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'],
            volume: 0.5
        }),
        purchase: new Howl({
            src: ['https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-1992.mp3'],
            volume: 0.5
        }),
        gameOver: new Howl({
            src: ['https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3'],
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
const closeButtons = document.querySelectorAll('.close');

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

    playAgainButton.addEventListener('click', startNewGame);

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === shopModal) {
            shopModal.style.display = 'none';
        }
    });

    // Start the game
    startNewGame();
}

// Start a new game
function startNewGame() {
    // Reset game state
    gameState.timer = 0;
    gameState.coins = 0;
    gameState.level = 1;
    gameState.gameActive = true;
    
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
    }
    
    // Start the timer
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    // Generate first order
    generateNewOrder();
    
    // Hide modals
    gameOverModal.style.display = 'none';
}

// Update the timer
function updateTimer() {
    if (gameState.gameActive) {
        gameState.timer++;
        timeElement.textContent = gameState.timer;
        
        // Level up check based on time played
        if (gameState.timer % 60 === 0 && gameState.timer > 0) {
            // Every minute, make the game slightly harder
            if (gameState.level < 5) { // Cap at level 5
                levelUp();
            }
        }
    }
}

// End the game - now triggered by player choice or when reaching max level
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

// Generate a new customer order
function generateNewOrder() {
    const order = {
        base: getRandomItem(gameState.baseItems),
        flavor: getRandomFlavor(),
        toppings: []
    };
    
    // Add toppings based on level
    const maxToppings = Math.min(Math.floor(gameState.level / 2) + 1, 3);
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
        // Calculate coins based on level and complexity
        const baseCoins = 10 * gameState.level;
        const toppingBonus = gameState.currentOrder.toppings.length * 5;
        const earnedCoins = baseCoins + toppingBonus;
        
        // Add coins
        gameState.coins += earnedCoins;
        
        // Show coin animation
        const coinAnimation = document.createElement('div');
        coinAnimation.className = 'coin-animation';
        coinAnimation.textContent = `+${earnedCoins} 🪙`;
        document.querySelector('.coins').appendChild(coinAnimation);
        
        // Remove animation after it completes
        setTimeout(() => {
            coinAnimation.remove();
        }, 1500);
        
        // Play correct sound
        playSound('correct');
        
        // Add correct animation
        currentCreationElement.classList.add('correct-animation');
        
        // Show confetti/celebration emoji
        showFeedbackEmoji(true);
        
        setTimeout(() => {
            currentCreationElement.classList.remove('correct-animation');
        }, 500);
        
        // Check for level up based on coins
        const shouldLevelUp = (gameState.coins >= gameState.level * 100);
        
        if (shouldLevelUp && gameState.level < 5) { // Cap at level 5
            levelUp();
        } else {
            // Generate new order
            generateNewOrder();
        }
    } else {
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

// Initialize the game when the page loads
window.addEventListener('load', initGame);
