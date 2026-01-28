// Vi venter til hele nettsiden er lastet før vi kjører koden
document.addEventListener('DOMContentLoaded', () => {

    const actionButton = document.getElementById('actionButton');
    const gameArea = document.getElementById('game-area');
    const logContainer = document.getElementById('log-container');

    // Hent modal-elementene (Popup)
    const modal = document.getElementById('info-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const modalDesc = document.getElementById('modal-desc');

    // Mapping av ID-er
    const defenseElements = {
        'moat': document.getElementById('moat'),
        'wall': document.getElementById('wall'),
        'macrophage': document.getElementById('macrophage'),
        'dendritic': document.getElementById('dendritic'),
        't-helper': document.getElementById('t-helper'),
        'b-cell': document.getElementById('b-cell')
    };

    // Fakta-database for Popup
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

    // Simuleringstrinnene
    const simulationSteps = [
        { id: 'spawn', msg: "🦠 <strong>Trinn 1:</strong> Bakterier dukker opp ved horisonten!", action: spawnBacterium, count: 5 },
        { id: 'moat', msg: "🌊 <strong>Trinn 2:</strong> Det ytre forsvaret (Slimhinner/Vollgrav) bremser fienden.", action: highlightElement, elm: 'moat' },
        { id: 'approach', msg: "⚠️ <strong>Trinn 3:</strong> Bakteriene bryter igjennom det første forsvaret!", action: moveBacteriaTo, targetY: 280 },
        { id: 'wall', msg: "🧱 <strong>Trinn 4:</strong> Huden (Borgmuren) brytes. Alarm!", action: highlightElement, elm: 'wall' },
        { id: 'macrophage', msg: "👹 <strong>Trinn 5:</strong> Det medfødte forsvaret (Vakt-troll) prøver å holde stand!", action: highlightElement, elm: 'macrophage' },
        { id: 'dendritic', msg: "🏇 <strong>Trinn 6:</strong> Speidere (Dendrittiske celler) henter informasjon.", action: highlightElement, elm: 'dendritic' },
        { id: 't-helper', msg: "👑 <strong>Trinn 7:</strong> Generalen (T-hjelpeceller) mottar info og beordrer angrep.", action: highlightElement, elm: 't-helper' },
        { id: 'attack', msg: "🏹 <strong>Trinn 8:</strong> Smia (B-celler) skyter antistoffer (piler) mot fienden!", action: fireWeapons },
        { id: 'win', msg: "✅ <strong>Seier:</strong> Infeksjonen er slått ned!", action: victoryEffect }
    ];

    let bacteria = [];
    let currentStepIndex = 0;

    // --- FUNKSJONER FOR POPUP (MODAL) ---

    function openModal(elementId) {
        console.log("Forsøker å åpne popup for:", elementId); // Debugging
        const data = infoData[elementId];
        if (data) {
            modalTitle.innerText = data.title;
            modalSubtitle.innerText = data.subtitle;
            modalDesc.innerText = data.desc;
            modal.classList.remove('hidden');
        }
    }

    // Koble lukk-knappen og bakgrunns-klikk til lukking
    window.closeModal = function() { // Må være global for å virke med onclick i HTML
        modal.classList.add('hidden');
    }
    
    // Alternativ lukkemetode som ikke trenger "onclick" i HTML
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Koble klikk på figurene til åpning av modal
    for (const key in defenseElements) {
        const element = defenseElements[key];
        if(element) {
            // Vi legger til "pointer-events: all" via JS for sikkerhets skyld
            element.style.pointerEvents = "all"; 
            
            element.addEventListener('click', (e) => {
                e.stopPropagation(); // Hindrer at klikket bobler opp
                openModal(key);
            });
            console.log("Klikk-lytter lagt til for:", key); // Sjekk i konsollen (F12)
        } else {
            console.error("Fant ikke element med ID:", key);
        }
    }

    // --- RESTEN AV SPILL-LOGIKKEN ---

    function addLogEntry(message) {
        const entry = document.createElement('p');
        entry.className = 'log-entry';
        entry.innerHTML = message;
        logContainer.prepend(entry);
    }

    function resetGame() {
        logContainer.innerHTML = '<p class="log-entry">Klar til innsats. Trykk "START ANGREP!"</p>';
        bacteria.forEach(b => b.remove());
        document.querySelectorAll('.projectile').forEach(p => p.remove());
        document.querySelectorAll('.trace-line').forEach(t => t.remove());
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

        if (step.action === spawnBacterium) {
            step.action(step.count);
        } else if (step.action === highlightElement) {
            step.action(step.elm);
        } else if (step.action === moveBacteriaTo) {
            step.action(step.targetY);
        } else if (step.action === fireWeapons) {
            highlightElement('b-cell');
            step.action();
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

    // Handlinger
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
                const randomX = 350 + (Math.random() * 100) - 50;
                const randomY = targetY + (Math.random() * 40) - 20;
                b.style.transform = `translate(${randomX}px, ${randomY}px)`; 
                b.dataset.x = randomX;
                b.dataset.y = randomY;
            }, index * 100);
        });
    }

    function highlightElement(elementId) {
        for (const key in defenseElements) {
            defenseElements[key].classList.remove('highlighted');
        }
        defenseElements[elementId].classList.add('highlighted');
    }

    function fireWeapons() {
        const bCell = defenseElements['b-cell'].getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        
        const startX = bCell.left - gameAreaRect.left + bCell.width / 2;
        const startY = bCell.top - gameAreaRect.top + bCell.height / 2;

        bacteria.forEach((bact, index) => {
            const bactRect = bact.getBoundingClientRect();
            const targetX = (bactRect.left - gameAreaRect.left) + 10; 
            const targetY = (bactRect.top - gameAreaRect.top) + 10;

            createTraceLine(startX, startY, targetX, targetY);

            const projectile = document.createElement('div');
            projectile.className = 'projectile';
            projectile.innerText = 'Y';
            projectile.style.left = `${startX}px`;
            projectile.style.top = `${startY}px`;
            gameArea.appendChild(projectile);

            const delay = 300 + (index * 400); 

            setTimeout(() => {
                requestAnimationFrame(() => {
                    const angle = Math.atan2(targetY - startY, targetX - startX) * (180 / Math.PI);
                    projectile.style.transform = `scale(1) rotate(${angle + 90}deg)`;
                    projectile.style.left = `${targetX}px`;
                    projectile.style.top = `${targetY}px`;
                });
            }, delay);

            setTimeout(() => {
                projectile.remove();
                killBacterium(bact);
                document.querySelectorAll('.trace-line').forEach(t => t.remove());
            }, delay + 2000); 
        });
    }

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

    function killBacterium(bact) {
        bact.classList.add('dying');
        setTimeout(() => {
            bact.remove();
            bacteria = bacteria.filter(b => b !== bact);
        }, 500);
    }

    function victoryEffect() {
        for (const key in defenseElements) {
            defenseElements[key].classList.remove('highlighted');
        }
        document.getElementById('fortress-svg').classList.add('victory-pulse');
    }

    actionButton.addEventListener('click', nextStep);

}); // Slutt på DOMContentLoaded
