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

    // Fakta-database
    const infoData = {
        'moat': { title: "Vollgraven", subtitle: "Slimhinnene", desc: "Slimhinnene fanger fiender i klissete slim, akkurat som en vollgrav." },
        'wall': { title: "Borgmuren", subtitle: "Huden", desc: "Huden er kroppens viktigste barriere mot omverdenen." },
        'macrophage': { title: "Vakt-Troll", subtitle: "Makrofag", desc: "En storspiser som sluker alt ukjent og varsler andre." },
        'dendritic': { title: "Speider", subtitle: "Dendrittisk celle", desc: "Samler informasjon (antigener) og tar det med til lymfeknutene." },
        't-helper': { title: "General", subtitle: "T-hjelpecelle", desc: "Koordinerer hele forsvaret basert på informasjonen fra speiderne." },
        'b-cell': { title: "Smia", subtitle: "B-celle", desc: "Produserer antistoffer (piler) som er skreddersydd for å treffe fienden." }
    };

    // Simuleringstrinnene
    const simulationSteps = [
        { id: 'spawn', msg: "🦠 <strong>Trinn 1:</strong> Bakterier dukker opp ved horisonten!", action: spawnBacterium, count: 5 },
        { id: 'moat', msg: "🌊 <strong>Trinn 2:</strong> Det ytre forsvaret (Slimhinner/Vollgrav) bremser fienden.", action: highlightElement, elm: 'moat' },
        { id: 'approach', msg: "⚠️ <strong>Trinn 3:</strong> Bakteriene bryter igjennom det første forsvaret!", action: moveBacteriaTo, targetY: 280 },
        { id: 'wall', msg: "🧱 <strong>Trinn 4:</strong> Huden (Borgmuren) brytes. Alarm!", action: highlightElement, elm: 'wall' },
        
        // HER ER DEN NYE HANDLINGEN:
        { id: 'macrophage-eat', msg: "👹 <strong>Trinn 5:</strong> Vakt-trollet (Makrofagen) spiser inntrengere og analyserer dem!", action: trollAction },
        
        { id: 'scout-report', msg: "🏇 <strong>Trinn 6:</strong> Speideren rir til tårnet og leverer rapporten til Generalen.", action: scoutReport },
        { id: 'general-command', msg: "👑 <strong>Trinn 7:</strong> Generalen blåser i hornet og sender tegninger til Smia!", action: generalCommand },
        { id: 'attack', msg: "🏹 <strong>Trinn 8:</strong> Smia (B-celler) skyter antistoffer (piler) mot resten av fienden!", action: fireWeapons },
        { id: 'win', msg: "✅ <strong>Seier:</strong> Infeksjonen er slått ned!", action: victoryEffect }
    ];

    let bacteria = [];
    let currentStepIndex = 0;

    // --- POPUP LOGIKK ---
    function openModal(elementId) {
        const data = infoData[elementId];
        if (data) {
            modalTitle.innerText = data.title;
            modalSubtitle.innerText = data.subtitle;
            modalDesc.innerText = data.desc;
            modal.classList.remove('hidden');
        }
    }
    window.closeModal = function() { modal.classList.add('hidden'); }
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    for (const key in defenseElements) {
        const element = defenseElements[key];
        if(element) {
            element.style.pointerEvents = "bounding-box"; 
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(key);
            });
        }
    }

    // --- SPILL LOGIKK ---

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
        document.querySelectorAll('.info-packet').forEach(i => i.remove());
        bacteria = [];
        
        for (const key in defenseElements) {
            defenseElements[key].classList.remove('highlighted', 'victory-pulse', 'chewing');
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
        } else if (step.action === trollAction) {
            step.action();
        }

        currentStepIndex++;
        if (currentStepIndex >= simulationSteps.length) {
            updateButtonState("finished");
        } else {
            updateButtonState("next");
        }
    }

    // --- BAKTERIE LOGIKK ---
    function spawnBacterium(count) {
        const areaWidth = gameArea.offsetWidth;
        for (let i = 0; i < count; i++) {
            const b = document.createElement('div');
            b.className = 'bacterium';
            const randomX = (areaWidth * 0.1) + (Math.random() * (areaWidth * 0.8));
            b.style.left = `${randomX}px`;
            b.style.top = `-30px`; 
            gameArea.appendChild(b);
            bacteria.push(b);
            setTimeout(() => {
                b.style.opacity = 1;
                b.style.transform = `translateY(${350 + Math.random() * 40}px)`; 
            }, i * 150);
        }
    }

    function moveBacteriaTo(targetY) {
        const areaWidth = gameArea.offsetWidth;
        const centerX = areaWidth / 2;
        bacteria.forEach((b, index) => {
            setTimeout(() => {
                b.style.transition = 'transform 2.5s ease-in-out';
                const startX = parseFloat(b.style.left);
                const targetX = centerX + (Math.random() * 80 - 40);
                const deltaX = targetX - startX;
                b.style.transform = `translate(${deltaX}px, ${targetY + (Math.random() * 20)}px)`; 
                b.dataset.x = startX + deltaX;
                b.dataset.y = targetY; 
            }, index * 100);
        });
    }

    // --- TROLL ACTION (Trinn 5) ---
    function trollAction() {
        highlightElement('macrophage');
        
        const trollGroup = defenseElements['macrophage'];
        if (!trollGroup) { console.error("Fant ikke trollet!"); return; }

        const trollRect = trollGroup.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        
        const trollX = (trollRect.left - gameAreaRect.left) + (trollRect.width / 2);
        const trollY = (trollRect.top - gameAreaRect.top) + (trollRect.height / 2);

        // Hvis vi har bakterier, spis de to første
        if (bacteria.length > 0) {
            const victims = bacteria.slice(0, 2); 

            victims.forEach((bact, index) => {
                const currentTransform = getComputedStyle(bact).transform;
                // Vi må vite hvor bakterien er NÅ for å animere derfra, 
                // men CSS transform kan være vrient. Vi lar transition håndtere det.
                
                // Vi må overstyre transform for å flytte den til trollet
                // Vi bruker 'left' og 'top' som vi satte ved start, men vi må regne offset.
                // Enklere løsning: Vi bruker fixed posisjonering midlertidig for animasjonen
                
                const bactRect = bact.getBoundingClientRect();
                const startLeft = bactRect.left - gameAreaRect.left;
                const startTop = bactRect.top - gameAreaRect.top;

                // Reset styles for å kunne flytte den fritt
                bact.style.transition = "none";
                bact.style.transform = "none";
                bact.style.left = `${startLeft}px`;
                bact.style.top = `${startTop}px`;

                // Tving nettleseren til å oppfatte endringen
                requestAnimationFrame(() => {
                    bact.style.transition = "all 1s ease-in";
                    bact.style.left = `${trollX}px`;
                    bact.style.top = `${trollY}px`;
                    bact.style.opacity = "0";
                    bact.style.transform = "scale(0.1)";
                });

                setTimeout(() => {
                    bact.remove();
                    bacteria = bacteria.filter(b => b !== bact);
                    trollGroup.classList.add('chewing');
                    setTimeout(() => { trollGroup.classList.remove('chewing'); }, 1200);
                }, 1000); 
            });
        }

        // Send skriftrull uansett om bakterier ble spist eller ei
        setTimeout(() => {
            sendInfoToScout(trollX, trollY);
        }, 1500); 
    }

    function sendInfoToScout(startX, startY) {
        const info = document.createElement('div');
        info.className = 'info-packet';
        info.innerText = '📜'; 
        info.style.left = `${startX}px`;
        info.style.top = `${startY}px`;
        gameArea.appendChild(info);

        const scoutRect = defenseElements['dendritic'].getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        const targetX = (scoutRect.left - gameAreaRect.left) + 20;
        const targetY = (scoutRect.top - gameAreaRect.top) + 20;

        setTimeout(() => {
            info.style.left = `${targetX}px`;
            info.style.top = `${targetY}px`;
            info.style.transform = "scale(1.5)";
        }, 100);

        setTimeout(() => {
            info.remove();
            highlightElement('dendritic');
            addLogEntry("ℹ️ Speideren har mottatt etterretning!");
        }, 1600);
    }

function scoutReport() {
        highlightElement('dendritic');
        
        // Startposisjon (Speideren)
        const scoutRect = defenseElements['dendritic'].getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        const startX = (scoutRect.left - gameAreaRect.left) + 20;
        const startY = (scoutRect.top - gameAreaRect.top);

        // Sluttposisjon (Generalen)
        const generalRect = defenseElements['t-helper'].getBoundingClientRect();
        const targetX = (generalRect.left - gameAreaRect.left) + 20;
        const targetY = (generalRect.top - gameAreaRect.top) + 20;

        // Lag skriftrullen
        const info = document.createElement('div');
        info.className = 'info-packet';
        info.innerText = '📜'; 
        info.style.left = `${startX}px`;
        info.style.top = `${startY}px`;
        gameArea.appendChild(info);

        // Animer flyturen opp til tårnet
        setTimeout(() => {
            info.style.transition = "all 1.5s ease-in-out"; // Litt tregere, det er høyt opp!
            info.style.left = `${targetX}px`;
            info.style.top = `${targetY}px`;
        }, 100);

        // Når den kommer frem
        setTimeout(() => {
            info.remove();
            highlightElement('t-helper'); // Generalen lyser opp
            addLogEntry("👑 Generalen har lest rapporten!");
        }, 1600);
    }

function generalCommand() {
        const generalRect = defenseElements['t-helper'].getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        
        const startX = (generalRect.left - gameAreaRect.left) + 25;
        const startY = (generalRect.top - gameAreaRect.top) + 25;

        // 1. VISUELLE LYDBØLGER (HORN)
        // Vi lager 3 bølger med litt mellomrom
        for(let i=0; i<3; i++) {
            setTimeout(() => {
                const wave = document.createElement('div');
                wave.className = 'sound-wave';
                wave.style.width = '20px';  // Starter smått
                wave.style.height = '20px';
                wave.style.left = `${startX - 10}px`; // Sentrer
                wave.style.top = `${startY - 10}px`;
                gameArea.appendChild(wave);
                
                // Fjern bølgen etter animasjonen
                setTimeout(() => wave.remove(), 1500);
            }, i * 400); // 400ms mellom hver bølge
        }

        // 2. SEND ORDRE TIL SMIA
        // Vi venter litt til hornet har lydt
        setTimeout(() => {
            const bCellRect = defenseElements['b-cell'].getBoundingClientRect();
            const targetX = (bCellRect.left - gameAreaRect.left) + 40;
            const targetY = (bCellRect.top - gameAreaRect.top);

            const order = document.createElement('div');
            order.className = 'info-packet';
            order.innerText = '📝'; // En kontrakt/tegning
            // Gjør den blå for å skille fra skriftrullen
            order.style.filter = "hue-rotate(180deg)"; 
            order.style.left = `${startX}px`;
            order.style.top = `${startY}px`;
            gameArea.appendChild(order);

            // Flyv ned til smia
            setTimeout(() => {
                order.style.transition = "all 1s ease-in"; // Raskere nedover
                order.style.left = `${targetX}px`;
                order.style.top = `${targetY}px`;
            }, 50);

            // Ankomst Smia
            setTimeout(() => {
                order.remove();
                highlightElement('b-cell'); // Smia lyser opp
                addLogEntry("🔨 Smia har mottatt byggetegningene!");
            }, 1100);

        }, 1000); // Starter etter 1 sekund (etter første lydbølge)
    }
    
    // --- ANGREP (Trinn 8) ---
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

    function highlightElement(elementId) {
        for (const key in defenseElements) {
            defenseElements[key].classList.remove('highlighted');
        }
        defenseElements[elementId].classList.add('highlighted');
    }

    function victoryEffect() {
        for (const key in defenseElements) defenseElements[key].classList.remove('highlighted');
        document.getElementById('fortress-svg').classList.add('victory-pulse');
    }

    actionButton.addEventListener('click', nextStep);

}); // SLUTT PÅ DOMContentLoaded (Viktig!)
