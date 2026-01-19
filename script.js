const actionButton = document.getElementById('actionButton');
const gameArea = document.getElementById('game-area');
const logContainer = document.getElementById('log-container');

// Mapping av ID-er
const defenseElements = {
    'moat': document.getElementById('moat'),
    'wall': document.getElementById('wall'),
    'macrophage': document.getElementById('macrophage'),
    'dendritic': document.getElementById('dendritic'),
    't-helper': document.getElementById('t-helper'),
    'b-cell': document.getElementById('b-cell')
};

// Simuleringstrinnene
const simulationSteps = [
    { id: 'spawn', msg: "🦠 <strong>Trinn 1:</strong> Bakterier dukker opp ved horisonten!", action: spawnBacterium, count: 5 },
    { id: 'moat', msg: "🌊 <strong>Trinn 2:</strong> Det ytre forsvaret (Slimhinner/Vollgrav) bremser fienden.", action: highlightElement, elm: 'moat' },
    { id: 'approach', msg: "⚠️ <strong>Trinn 3:</strong> Bakteriene bryter igjennom det første forsvaret!", action: moveBacteriaTo, targetY: 280 },
    { id: 'wall', msg: "🧱 <strong>Trinn 4:</strong> Huden (Borgmuren) brytes. Alarm!", action: highlightElement, elm: 'wall' },
    { id: 'macrophage', msg: "👹 <strong>Trinn 5:</strong> Det medfødte forsvaret (Vakt-troll) prøver å holde stand!", action: highlightElement, elm: 'macrophage' },
    { id: 'dendritic', msg: "🏇 <strong>Trinn 6:</strong> Speidere (Dendrittiske celler) henter informasjon.", action: highlightElement, elm: 'dendritic' },
    { id: 't-helper', msg: "👑 <strong>Trinn 7:</strong> Generalen (T-hjelpeceller) mottar info og beordrer angrep.", action: highlightElement, elm: 't-helper' },
    // Her kommer den nye action-funksjonen:
    { id: 'attack', msg: "🏹 <strong>Trinn 8:</strong> Smia (B-celler) skyter antistoffer (piler) mot fienden!", action: fireWeapons }, 
    { id: 'win', msg: "✅ <strong>Seier:</strong> Infeksjonen er slått ned!", action: victoryEffect }
];

let bacteria = [];
let currentStepIndex = 0;

function addLogEntry(message) {
    const entry = document.createElement('p');
    entry.className = 'log-entry';
    entry.innerHTML = message;
    logContainer.prepend(entry);
}

function resetGame() {
    logContainer.innerHTML = '<p class="log-entry">Klar til innsats. Trykk "START ANGREP!"</p>';
    // Fjern gamle bakterier og prosjektiler
    bacteria.forEach(b => b.remove());
    document.querySelectorAll('.projectile').forEach(p => p.remove());
    bacteria = [];
    
    for (const key in defenseElements) {
        defenseElements[key].classList.remove('highlighted', 'victory-pulse');
    }
    gameArea.classList.remove('victory-pulse');
    
    currentStepIndex = 0;
    updateButtonState("start");
}

function updateButtonState(state) {
    if (state === "start") {
        actionButton.innerText = "START ANGREP!";
        actionButton.className = "mt-5 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-xl";
    } else if (state === "next") {
        actionButton.innerText = "NESTE STEG ➔";
        actionButton.className = "mt-5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-xl";
    } else if (state === "finished") {
        actionButton.innerText = "PRØV IGJEN ↺";
        actionButton.className = "mt-5 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-xl";
    }
}

function nextStep() {
    if (currentStepIndex >= simulationSteps.length) {
        resetGame();
        return;
    }

    const step = simulationSteps[currentStepIndex];
    addLogEntry(step.msg);

    // Utfør handlingen
    if (step.action === spawnBacterium) {
        step.action(step.count);
    } else if (step.action === highlightElement) {
        step.action(step.elm);
    } else if (step.action === moveBacteriaTo) {
        step.action(step.targetY);
    } else if (step.action === fireWeapons) {
        highlightElement('b-cell'); // Pass på at smia lyser
        step.action(); // Kjør angrepsfunksjonen
    } else if (step.action === victoryEffect) {
        step.action();
    }

    currentStepIndex++;

    if (currentStepIndex >= simulationSteps.length) {
        updateButtonState("finished");
    } else {
        updateButtonState("next");
    }
}

// --- LOGIKK FOR BAKTERIER ---

function spawnBacterium(count) {
    for (let i = 0; i < count; i++) {
        const b = document.createElement('div');
        b.className = 'bacterium';
        b.style.left = `${Math.random() * (gameArea.offsetWidth - 60) + 30}px`;
        b.style.top = `-30px`; 
        gameArea.appendChild(b);
        bacteria.push(b);
        setTimeout(() => {
            b.style.opacity = 1;
            b.style.transform = `translateY(${360 + Math.random() * 30}px)`; 
        }, i * 100);
    }
}

function moveBacteriaTo(targetY) {
    bacteria.forEach((b, index) => {
        setTimeout(() => {
            b.style.transition = 'transform 2s ease-out';
            // Flytter bakteriene til porten
            const randomX = 350 + (Math.random() * 100) - 50;
            const randomY = targetY + (Math.random() * 40) - 20;
            b.style.transform = `translate(${randomX}px, ${randomY}px)`; 
            
            // Lagrer posisjonen på elementet for enklere treff-beregning senere
            b.dataset.x = randomX;
            b.dataset.y = randomY;
        }, index * 100);
    });
}

// --- LOGIKK FOR HØYLIGHTING ---

function highlightElement(elementId) {
    for (const key in defenseElements) {
        defenseElements[key].classList.remove('highlighted');
    }
    defenseElements[elementId].classList.add('highlighted');
}

// --- LOGIKK FOR ANGREP (ACTION!) ---

function fireWeapons() {
    // 1. Finn startposisjonen til B-cellen (Smia)
    const bCell = defenseElements['b-cell'].getBoundingClientRect();
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    // Beregn startkoordinater relativt til spillområdet
    const startX = bCell.left - gameAreaRect.left + bCell.width / 2;
    const startY = bCell.top - gameAreaRect.top + bCell.height / 2;

    // 2. Skyt på hver levende bakterie
    bacteria.forEach((bact, index) => {
        // Lag prosjektilet
        const projectile = document.createElement('div');
        projectile.className = 'projectile';
        projectile.innerText = 'Y'; // Antistoffer er Y-formede!
        
        // Sett startposisjon
        projectile.style.left = `${startX}px`;
        projectile.style.top = `${startY}px`;
        gameArea.appendChild(projectile);

        // Hent målets (bakteriens) posisjon
        // Vi må bruke transform-verdiene vi satte tidligere, eller getBoundingClientRect
        const bactRect = bact.getBoundingClientRect();
        const targetX = bactRect.left - gameAreaRect.left;
        const targetY = bactRect.top - gameAreaRect.top;

        // 3. Animer flyturen
        // Vi bruker setTimeout for å sikre at browseren tegner startposisjonen før den animerer
        setTimeout(() => {
            projectile.style.transform = 'scale(1) rotate(180deg)'; // Roter så "Y" ser ut som en pil nedover/bortover
            projectile.style.left = `${targetX}px`;
            projectile.style.top = `${targetY}px`;
        }, 50 + (index * 100)); // Litt forsinkelse mellom hvert skudd for "maskingevær"-effekt

        // 4. Når prosjektilet treffer (etter 1 sekund transition)
        setTimeout(() => {
            projectile.remove(); // Fjern pilen
            killBacterium(bact); // Drep bakterien
        }, 1050 + (index * 100));
    });
}

function killBacterium(bact) {
    bact.classList.add('dying');
    // Fjern helt fra DOM etter at animasjonen er ferdig
    setTimeout(() => {
        bact.remove();
        // Fjern fra arrayet vårt også
        bacteria = bacteria.filter(b => b !== bact);
    }, 500);
}

function victoryEffect() {
    // Fjern highlight
    for (const key in defenseElements) {
        defenseElements[key].classList.remove('highlighted');
    }
    // Få hele borgen til å pulsere av glede
    document.getElementById('fortress-svg').classList.add('victory-pulse');
}

actionButton.addEventListener('click', nextStep);
