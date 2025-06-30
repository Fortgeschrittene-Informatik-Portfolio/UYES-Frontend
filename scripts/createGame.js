import { handleIntro } from './utils/intros.js';

export function initCreateGame() {
    console.log("createGame geladen");


    handleIntro({
        flagName: "introSeenCreateGame",
        lastStepId: "intro9wrap",
        resetBtnId: "eichberg2"
    });

    document.getElementById("createBackBtn")?.addEventListener("click", () => {
        window.location.href = "/start/game";
    });


    function setupAmountControls(sliderId, displayId, subtractSelector, addSelector) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);
        const subtractBtn = slider.closest('div').querySelector(subtractSelector);
        const addBtn = slider.closest('div').querySelector(addSelector);

        const updateDisplay = () => {
            display.textContent = slider.value;
        };

        subtractBtn?.addEventListener('click', () => {
            slider.stepDown();
            slider.dispatchEvent(new Event('input')); // Trigger update
            updateDisplay();
        });

        addBtn?.addEventListener('click', () => {
            slider.stepUp();
            slider.dispatchEvent(new Event('input')); // Trigger update
            updateDisplay();
        });

        slider.addEventListener('input', updateDisplay);
        updateDisplay();
    }

    setupAmountControls('playerSlider', 'playerCount', '.subtract', '.add');
    setupAmountControls('cardSlider', 'cardCount', '.subtract', '.add');

    function setupSelectAllCheckbox(groupSelector, selectAllId) {
        const checkboxes = Array.from(document.querySelectorAll(groupSelector));
        const selectAll = document.getElementById(selectAllId);

        // Event: Select All → (De)select all others
        selectAll?.addEventListener('change', () => {
            checkboxes.forEach(cb => {
                if (cb.id !== selectAllId) cb.checked = selectAll.checked;
            });
        });

        // Event: any other checkbox → update Select All
        checkboxes.forEach(cb => {
            if (cb.id === selectAllId) return;

            cb.addEventListener('change', () => {
                const allChecked = checkboxes
                    .filter(cb => cb.id !== selectAllId)
                    .every(cb => cb.checked);

                selectAll.checked = allChecked;
            });
        });
    }
    setupSelectAllCheckbox('#special-cards input[type="checkbox"]', 'check-all');

    document.getElementById("continue-createGame")?.addEventListener("click", async (e) => {
        e.preventDefault();

        const data = {
            players: document.getElementById("playerSlider").value,
            cards: document.getElementById("cardSlider").value,
            name: document.getElementById("NameInput").value || "RandomPlayer",
            draw2: document.getElementById("draw2").checked,
            reverse: document.getElementById("reverse").checked,
            skip: document.getElementById("skip").checked,
            wild: document.getElementById("wild").checked,
            wild4: document.getElementById("wild+4").checked,
        };

        const response = await fetch("/api/createGame", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (response.redirected) {
            window.location.href = response.url; // Weiterleiten
        }
    });

}
