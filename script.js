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
    const bCell = defenseElements['b-cell'].getBoundingClientRect();
    const gameAreaRect = gameArea.getBoundingClientRect();
    
    // Beregn startkoordinater (senter av Smia)
    const startX = bCell.left - gameAreaRect.left + bCell.width / 2;
    const startY = bCell.top - gameAreaRect.top + bCell.height / 2;

    bacteria.forEach((bact, index) => {
        // Hent målets posisjon (vi bruker dataset hvis lagret, eller live posisjon)
        const bactRect = bact.getBoundingClientRect();
        // Vi sikter på midten av bakterien
        const targetX = (bactRect.left - gameAreaRect.left) + 10; 
        const targetY = (bactRect.top - gameAreaRect.top) + 10;

        // 1. Tegn siktelinjen (Trace) først
        createTraceLine(startX, startY, targetX, targetY);

        // 2. Klargjør prosjektilet
        const projectile = document.createElement('div');
        projectile.className = 'projectile';
        projectile.innerText = 'Y';
        projectile.style.left = `${startX}px`;
        projectile.style.top = `${startY}px`;
        gameArea.appendChild(projectile);

        // 3. Vent litt så eleven ser siktelinjen, SÅ skyt!
        // Forsinkelsen øker for hver bakterie så de ikke skyter helt likt (maskingevær-effekt)
        const delay = 300 + (index * 400); 

        setTimeout(() => {
            // "requestAnimationFrame" sikrer at nettleseren har tegnet startposisjonen
            // før vi endrer den. Dette fikser problemet med at animasjonen "hopper".
            requestAnimationFrame(() => {
                // Roter pilen så den peker mot målet
                // Math.atan2 gir oss vinkelen mellom to punkter
                const angle = Math.atan2(targetY - startY, targetX - startX) * (180 / Math.PI);
                
                // Sett sluttposisjon og rotasjon
                // Vi legger til 90 grader fordi teksten "Y" står oppreist
                projectile.style.transform = `scale(1) rotate(${angle + 90}deg)`;
                projectile.style.left = `${targetX}px`;
                projectile.style.top = `${targetY}px`;
            });
        }, delay);

        // 4. Treffet (må matche CSS transition tiden som nå er 2s = 2000ms)
        setTimeout(() => {
            projectile.remove(); // Fjern pil
            killBacterium(bact); // Drep bakterie
            
            // Fjern siktelinjene også for å rydde opp
            const traces = document.querySelectorAll('.trace-line');
            traces.forEach(t => t.remove());
            
        }, delay + 2000); 
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

// --- LEGG TIL DENNE NYE HJELPEFUNKSJONEN NEDERST I FILEN ---

function createTraceLine(x1, y1, x2, y2) {
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    const line = document.createElement('div');
    line.className = 'trace-line';
    line.style.width = `${length}px`;
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.transform = `rotate(${angle}deg)`;
    
    gameArea.appendChild(line);
}

// ... (behold all koden for simuleringen som vi lagde sist) ...

/* --- NYTT: FAKTA-DATABASE OG POPUP LOGIKK --- */

// Her lagrer vi informasjonen som skal vises i popup-en
const infoData = {
    'moat': {
        title: "Vollgraven",
        subtitle: "Slimhinnene",
        desc: "Slimhinnene i nesen, halsen og lungene er kroppens første felle. Akkurat som en vollgrav fanger fiender i vannet, fanger slimet bakterier og virus før de kommer inn i kroppen."
    },
    'wall': {
        title: "Borgmuren",
        subtitle: "Huden",
        desc: "Huden er en tett, fysisk barriere som dekker hele kroppen. Den er som en tykk steinmur som bakterier ikke kan trenge gjennom så lenge den er hel (uten sår)."
    },
    'macrophage': {
        title: "Vakt-Troll",
        subtitle: "Makrofag (Ete-celle)",
        desc: "Store celler som patruljerer i vevet. De fungerer som vaktposter som spiser alt de ikke kjenner igjen. Navnet betyr faktisk 'storspiser'!"
    },
    'dendritic': {
        title: "Speider",
        subtitle: "Dendrittisk celle",
        desc: "Disse cellene er informasjonsjegere. De tar biter av fienden og løper raskt til lymfeknutene for å vise dem frem til Generalen (T-cellene)."
    },
    't-helper': {
        title: "General",
        subtitle: "T-hjelpecelle",
        desc: "Sjefen for det tilpassede forsvaret. Den dreper ikke selv, men den bestemmer hvilke våpen som skal brukes og aktiverer resten av hæren."
    },
    'b-cell': {
        title: "Smia",
        subtitle: "B-celle",
        desc: "Disse cellene er fabrikker. Når de får ordre fra Generalen, forvandles de til plasmaceller som spruter ut tusenvis av antistoffer (piler) i sekundet."
    }
};

// Hent modal-elementene
const modal = document.getElementById('info-modal');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalDesc = document.getElementById('modal-desc');

// Funksjon for å åpne modalen
function openModal(elementId) {
    const data = infoData[elementId];
    if (data) {
        modalTitle.innerText = data.title;
        modalSubtitle.innerText = data.subtitle;
        modalDesc.innerText = data.desc;
        
        // Vis modalen
        modal.classList.remove('hidden');
    }
}

// Funksjon for å lukke modalen
function closeModal() {
    modal.classList.add('hidden');
}

// Koble klikk på figurene til åpning av modal
// Vi bruker defenseElements-listen vi allerede har laget øverst i scriptet!
for (const key in defenseElements) {
    defenseElements[key].addEventListener('click', () => {
        openModal(key);
    });
}

// Lukk modalen hvis man klikker på den mørke bakgrunnen (utenfor boksen)
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});
