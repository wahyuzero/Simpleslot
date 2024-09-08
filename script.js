const symbols = ['🍒', '🍊', '🍋', '🍇', '🍉', '🍎', '🍓', '🍍', '💎'];
const symbolWeights = [20, 20, 20, 15, 15, 10, 10, 5, 1];
const reelsContainer = document.getElementById('reels');
const resultElement = document.getElementById('result');
const balanceElement = document.getElementById('balance');
const playerNameElement = document.getElementById('playerName');
const backgroundMusic = document.getElementById('backgroundMusic');
const musicControl = document.getElementById('musicControl');
const spinButton = document.getElementById('spinButton');
const autoSpinCountdownElement = document.createElement('div');
autoSpinCountdownElement.id = 'autoSpinCountdown';
document.getElementById('autoSpinControls').appendChild(autoSpinCountdownElement);

let balance = 0;
let playerName = "";
let spinning = false;
let isMusicPlaying = false;
let totalSpins = 0;
let totalWins = 0;
let highestJackpot = 0;
let currentBet = 10;
let isAutoSpinning = false;
let autoSpinCount = 0;
const jackpotMusic = new Audio('jackpot.mp3');

function showFlashMessage(message, type = 'info') {
    const flashMessage = document.createElement('div');
    flashMessage.className = `flash-message ${type}`;
    flashMessage.textContent = message;
    document.body.appendChild(flashMessage);

    setTimeout(() => {
        flashMessage.classList.add('show');
    }, 10);

    setTimeout(() => {
        flashMessage.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(flashMessage);
        }, 300);
    }, 3000);
}

function toggleMusic() {
    if (isMusicPlaying) {
        backgroundMusic.pause();
        musicControl.textContent = '🔇';
    } else {
        backgroundMusic.play();
        musicControl.textContent = '🔊';
    }
    isMusicPlaying = !isMusicPlaying;
}

function startGame() {
    playerName = document.getElementById('nameInput').value;
    balance = parseInt(document.getElementById('balanceInput').value) || 0;
    if (playerName && balance > 0) {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('slotMachine').style.display = 'block';
        playerNameElement.textContent = `Pemain: ${playerName}`;
        updateBalance();
        initializeReels();
        backgroundMusic.play().then(() => {
            isMusicPlaying = true;
            musicControl.textContent = '🔊';
        }).catch(error => {
            console.log('Autoplay was prevented:', error);
        });
    } else {
        showFlashMessage('Mohon masukkan nama dan saldo awal yang valid.', 'error');
    }
}

function getRandomSymbol() {
    const totalWeight = symbolWeights.reduce((a, b) => a + b, 0);
    let randomWeight = Math.random() * totalWeight;
    for (let i = 0; i < symbols.length; i++) {
        if (randomWeight < symbolWeights[i]) {
            return symbols[i];
        }
        randomWeight -= symbolWeights[i];
    }
    return symbols[symbols.length - 1];
}

function initializeReels() {
    reelsContainer.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const reel = document.createElement('div');
        reel.className = 'reel';
        const reelStrip = document.createElement('div');
        reelStrip.className = 'reel-strip';
        for (let j = 0; j < 16; j++) {
            const symbol = document.createElement('div');
            symbol.className = 'symbol';
            symbol.textContent = getRandomSymbol();
            reelStrip.appendChild(symbol);
        }
        reel.appendChild(reelStrip);
        reelsContainer.appendChild(reel);
    }
}

function increaseBet() {
    if (currentBet < balance) {
        currentBet += 10;
        updateBet();
    }
}

function decreaseBet() {
    if (currentBet > 10) {
        currentBet -= 10;
        updateBet();
    }
}

function setBet(amount) {
    if (amount <= balance) {
        currentBet = amount;
        updateBet();
    } else {
        showFlashMessage('Saldo tidak cukup untuk memasang taruhan ini.', 'error');
    }
}

function setCustomBet() {
    const customBet = parseInt(document.getElementById('customBet').value);
    if (customBet && customBet > 0 && customBet <= balance) {
        currentBet = customBet;
        updateBet();
    } else {
        showFlashMessage('Mohon masukkan jumlah taruhan yang valid.', 'error');
    }
}

function updateBet() {
    document.getElementById('betAmount').textContent = currentBet;
    document.getElementById('spinCost').textContent = currentBet;
}

function spin() {
    if (spinning) {
        return;
    }

    if (balance < currentBet) {
        showFlashMessage('Saldo tidak cukup untuk spin!', 'error');
        stopAutoSpin();
        return;
    }

    spinning = true;
    balance -= currentBet;
    updateBalance();
    totalSpins++;
    updateStats();

    if (isMusicPlaying) {
        const spinSound = new Audio('spin.mp3');
        spinSound.play();
    }

    spinButton.disabled = true;
    const reels = document.querySelectorAll('.reel-strip');
    reels.forEach(reel => {
        const symbols = reel.children;
        const topPosition = -80 * (symbols.length - 4);
        reel.style.top = topPosition + 'px';

        setTimeout(() => {
            reel.style.transition = 'none';
            reel.style.top = '0px';
            setTimeout(() => {
                reel.style.transition = 'top 3s cubic-bezier(0.25, 0.1, 0.25, 1)';
                shuffleSymbols(reel);
            }, 50);
        }, 3000);
    });

    setTimeout(() => {
        checkWin();
        spinning = false;
        spinButton.disabled = false;
        
        if (isAutoSpinning && autoSpinCount > 0) {
            autoSpinCount--;
            updateAutoSpinCountdown();
            if (autoSpinCount > 0) {
                setTimeout(spin, 500);
            } else {
                stopAutoSpin();
            }
        }
    }, 3000);
}

function shuffleSymbols(reel) {
    const symbols = Array.from(reel.children);
    for (let i = symbols.length - 1; i > 0; i--) {
        symbols[i].textContent = getRandomSymbol();
    }
}

function checkWin() {
    const reels = document.querySelectorAll('.reel-strip');
    const visibleSymbols = Array.from(reels).map(reel => 
        Array.from(reel.children).slice(0, 4).map(symbol => symbol.textContent)
    );
    const symbolCounts = {};
    let isJackpot = Math.random() < 0.1;  // settingan jp

    visibleSymbols.flat().forEach(symbol => {
        symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });

    let winAmount = 0;
    Object.entries(symbolCounts).forEach(([symbol, count]) => {
        if (count === 3) winAmount += currentBet * 0.08;
        else if (count === 4) winAmount += currentBet * 0.2;
        else if (count === 5) winAmount += currentBet * 0.6;
        else if (count >= 6) winAmount += currentBet * 1.4;
    });

    if (isJackpot) {
        const jackpotAmount = currentBet * 200;
        winAmount += jackpotAmount;
        if (jackpotAmount > highestJackpot) {
            highestJackpot = jackpotAmount;
        }
        
        reels.forEach(reel => {
            Array.from(reel.children).slice(0, 4).forEach(symbol => {
                symbol.textContent = '💎';
            });
        });

        if (isAutoSpinning) {
            pauseAutoSpin();
        }
        showJackpotAnimation(jackpotAmount);
    }

    balance += winAmount;
    updateBalance();

    if (winAmount > 0) {
        resultElement.textContent = `Anda memenangkan ${winAmount}!`;
        totalWins += winAmount;
        showFlashMessage(`Selamat! Anda memenangkan ${winAmount}!`, 'success');
    } else {
        resultElement.textContent = 'Coba lagi!';
        showFlashMessage('Belum beruntung. Coba lagi!', 'info');
    }

    updateStats();
}

function updateBalance() {
    balanceElement.textContent = `Saldo: ${balance}`;
}

function showJackpotAnimation(jackpotAmount) {
    const jackpotElement = document.createElement('div');
    jackpotElement.className = 'jackpot-animation';
    document.body.appendChild(jackpotElement);

    if (isMusicPlaying) {
        backgroundMusic.pause();
        jackpotMusic.play();
    }

    let currentAmount = 0;
    const animationInterval = setInterval(() => {
        if (currentAmount < jackpotAmount) {
            currentAmount += Math.ceil(jackpotAmount / 100);
            if (currentAmount > jackpotAmount) currentAmount = jackpotAmount;
            jackpotElement.textContent = `MARWINNN!!! x200 ${currentAmount}`;
        } else {
            clearInterval(animationInterval);
            setTimeout(() => {
                document.body.removeChild(jackpotElement);
                if (isMusicPlaying) {
                    jackpotMusic.pause();
                    jackpotMusic.currentTime = 0;
                    backgroundMusic.play();
                }
                if (isAutoSpinning) {
                    resumeAutoSpin();
                }
            }, 3000);
        }
    }, 30);
}

function updateStats() {
    document.getElementById('totalSpins').textContent = totalSpins;
    document.getElementById('totalWins').textContent = totalWins;
    document.getElementById('highestJackpot').textContent = highestJackpot;
}

function startAutoSpin(spins) {
    if (isAutoSpinning) return;
    
    if (balance < currentBet) {
        showFlashMessage('Saldo tidak cukup untuk auto spin!   Anda Rungkad', 'error');
        return;
    }
    
    isAutoSpinning = true;
    autoSpinCount = spins;
    updateAutoSpinCountdown();
    spin();
}

function stopAutoSpin() {
    isAutoSpinning = false;
    autoSpinCount = 0;
    updateAutoSpinCountdown();
}

function pauseAutoSpin() {
    isAutoSpinning = false;
}

function resumeAutoSpin() {
    if (autoSpinCount > 0) {
        isAutoSpinning = true;
        setTimeout(spin, 500);
    }
}

function updateAutoSpinCountdown() {
    autoSpinCountdownElement.textContent = `Sisa auto spin: ${autoSpinCount}`;
}

function setCustomSpin() {
    const customSpins = parseInt(document.getElementById('customSpin').value) || 0;
    if (customSpins > 0) {
        startAutoSpin(customSpins);
    } else {
        showFlashMessage('Mohon masukkan jumlah putaran otomatis yang valid.', 'error');
    }
}

musicControl.addEventListener('click', toggleMusic);
spinButton.addEventListener('click', spin);
document.getElementById('autoSpin10').addEventListener('click', () => startAutoSpin(10));
document.getElementById('autoSpin100').addEventListener('click', () => startAutoSpin(100));
document.getElementById('startCustomAutoSpin').addEventListener('click', setCustomSpin);
document.getElementById('increaseBet').addEventListener('click', increaseBet);
document.getElementById('decreaseBet').addEventListener('click', decreaseBet);
document.getElementById('bet10').addEventListener('click', () => setBet(10));
document.getElementById('bet100').addEventListener('click', () => setBet(100));
document.getElementById('bet1000').addEventListener('click', () => setBet(1000));
document.getElementById('setCustomBet').addEventListener('click', setCustomBet);
