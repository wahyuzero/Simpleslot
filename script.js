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

    // Remove existing highlights and lines
    const highlightedSymbols = document.querySelectorAll('.symbol.highlight');
    highlightedSymbols.forEach(symbol => symbol.classList.remove('highlight'));
    
    const existingLines = document.querySelectorAll('.connecting-line');
    existingLines.forEach(line => line.remove());

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
        resultElement.textContent = `Kamu memenang ${winAmount}!`;
        totalWins += winAmount;
        showFlashMessage(`Selamat! Kamu menang ${winAmount}!`, 'success');
        highlightWinningSymbols(visibleSymbols);
    } else {
        resultElement.textContent = 'Coba lagi!';
        showFlashMessage('Belum beruntung. Coba lagi!', 'info');
    }

    updateStats();
}


function drawConnectingLines(positions) {
    const reelsContainer = document.querySelector('.reels');
    const existingLines = document.querySelectorAll('.connecting-line');
    existingLines.forEach(line => line.remove());

    function drawNextLine(index) {
        if (index >= positions.length - 1) return;

        const [x1, y1] = positions[index];
        const [x2, y2] = positions[index + 1];

        const symbol1 = document.querySelector(`.reel:nth-child(${x1 + 1}) .symbol:nth-child(${y1 + 1})`);
        const symbol2 = document.querySelector(`.reel:nth-child(${x2 + 1}) .symbol:nth-child(${y2 + 1})`);

        if (symbol1 && symbol2) {
            const rect1 = symbol1.getBoundingClientRect();
            const rect2 = symbol2.getBoundingClientRect();

            const x = rect1.left + rect1.width / 2;
            const y = rect1.top + rect1.height / 2;
            const endX = rect2.left + rect2.width / 2;
            const endY = rect2.top + rect2.height / 2;

            const length = Math.sqrt(Math.pow(endX - x, 2) + Math.pow(endY - y, 2));
            const angle = Math.atan2(endY - y, endX - x) * 180 / Math.PI;

            const line = document.createElement('div');
            line.className = 'connecting-line';
            line.style.width = '0px';
            line.style.left = `${x}px`;
            line.style.top = `${y}px`;
            line.style.transform = `rotate(${angle}deg)`;

            reelsContainer.appendChild(line);

            setTimeout(() => {
                line.style.transition = 'width 0.03s ease-out';
                line.style.width = `${length}px`;
            }, 50);

            setTimeout(() => drawNextLine(index + 1), 10);
        }
    }

    // Start drawing lines
    drawNextLine(0);

    // Remove lines and highlights after a delay
    setTimeout(() => {
        const lines = document.querySelectorAll('.connecting-line');
        lines.forEach(line => {
            line.style.transition = 'opacity 0.5s ease-out';
            line.style.opacity = '0';
        });
        
        const highlightedSymbols = document.querySelectorAll('.symbol.highlight');
        highlightedSymbols.forEach(symbol => {
            symbol.style.transition = 'transform 0.5s ease-out';
            symbol.style.transform = 'scale(1)';
        });

        setTimeout(() => {
            lines.forEach(line => line.remove());
            highlightedSymbols.forEach(symbol => symbol.classList.remove('highlight'));
        }, 500);
    }, positions.length * 300 + 1000);
}

function highlightWinningSymbols(visibleSymbols) {
    const symbolElements = document.querySelectorAll('.symbol');
    const winningPositions = [];

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const symbol = visibleSymbols[i][j];
            const count = visibleSymbols.flat().filter(s => s === symbol).length;
            if (count >= 3) {
                const element = symbolElements[i * 4 + j];
                element.classList.add('highlight');
                element.style.transition = 'transform 0.3s ease-out';
                element.style.transform = 'scale(1.1)';
                winningPositions.push([i, j]);
            }
        }
    }

    drawConnectingLines(winningPositions);
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
