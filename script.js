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
    { id: 'approach', msg: "⚠️ <strong>Trinn 3:</strong> Bakteriene trenger gjennom det første forsvaret!", action: moveBacteriaTo, targetY: 280 },
    { id: 'wall', msg: "🧱 <strong>Trinn 4:</strong> Huden (Borgmuren) brytes. Alarm!", action: highlightElement, elm: 'wall' },
    { id: 'macrophage', msg: "👹 <strong>Trinn 5:</strong> Det medfødte forsvaret (Makrofager/Troll) angriper!", action: highlightElement, elm: 'macrophage' },
    { id: 'dendritic', msg: "🏇 <strong>Trinn 6:</strong> Speidere (Dendrittiske celler) samler informasjon.", action: highlightElement, elm: 'dendritic' },
    { id: 't-helper', msg: "👑 <strong>Trinn 7:</strong> Det tilpassede forsvaret varsles (T-hjelpeceller/General).", action: highlightElement, elm: 't-helper' },
    { id: 'b-cell', msg: "🔨 <strong>Trinn 8:</strong> Produksjonen av våpen starter (B-celler/Smia)!", action: highlightElement, elm: 'b-cell' },
    { id: 'win', msg: "✅ <strong>Seier:</strong> Trusselen er nøytralisert!", action: () => {} } // Tom handling for seier foreløpig
];

let bacteria = [];
let currentStepIndex = 0; // Holder styr på hvor vi er i historien

function addLogEntry(message) {
    const entry = document.createElement('p');
    entry.className = 'log-entry';
    entry.innerHTML = message;
    logContainer.prepend(entry);
}

function resetGame() {
    logContainer.innerHTML = '<p class="log-entry">Klar til innsats. Trykk "START ANGREP!"</p>';
    bacteria.forEach(b => b.remove());
    bacteria = [];
    for (const key in defenseElements) {
        defenseElements[key].classList.remove('highlighted');
    }
    currentStepIndex = 0;
    updateButtonState("start");
}

function updateButtonState(state) {
    if (state === "start") {
        actionButton.innerText = "START ANGREP!";
        actionButton.classList.remove("bg-green-600", "hover:bg-green-700");
        actionButton.classList.add("bg-red-600", "hover:bg-red-700");
    } else if (state === "next") {
        actionButton.innerText = "NESTE STEG ➔";
        actionButton.classList.remove("bg-red-600", "hover:bg-red-700");
        actionButton.classList.add("bg-blue-600", "hover:bg-blue-700");
    } else if (state === "finished") {
        actionButton.innerText = "PRØV IGJEN ↺";
        actionButton.classList.remove("bg-blue-600", "hover:bg-blue-700");
        actionButton.classList.add("bg-green-600", "hover:bg-green-700");
    }
}

// Hovedfunksjon som kjører neste steg
function nextStep() {
    // Hvis vi er ferdige, reset spillet
    if (currentStepIndex >= simulationSteps.length) {
        resetGame();
        return;
    }

    const step = simulationSteps[currentStepIndex];
    addLogEntry(step.msg);

    // Utfør handlingen basert på trinnets konfigurasjon
    if (step.action === spawnBacterium) {
        step.action(step.count);
    } else if (step.action === highlightElement) {
        step.action(step.elm);
    } else if (step.action === moveBacteriaTo) {
        step.action(step.targetY);
    }

    currentStepIndex++;

    // Sjekk om vi er ferdige eller skal fortsette
    if (currentStepIndex >= simulationSteps.length) {
        updateButtonState("finished");
    } else {
        updateButtonState("next");
    }
}

// Handlinger (Actions)
function spawnBacterium(count) {
    for (let i = 0; i < count; i++) {
        const b = document.createElement('div');
        b.className = 'bacterium';
        b.style.left = `${Math.random() * (gameArea.offsetWidth - 40) + 20}px`;
        b.style.top = `-30px`; 
        gameArea.appendChild(b);
        bacteria.push(b);
        // Liten forsinkelse for visuell effekt
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
            b.style.transform = `translate(${350 + (Math.random() * 100) - 50}px, ${targetY + (Math.random() * 20) - 10}px)`; 
        }, index * 100);
    });
}

function highlightElement(elementId) {
    // Fjerner highlight fra forrige trinn for å holde fokus
    for (const key in defenseElements) {
        defenseElements[key].classList.remove('highlighted');
    }
    defenseElements[elementId].classList.add('highlighted');
}

// Koble knappen til nextStep funksjonen
actionButton.addEventListener('click', nextStep);
