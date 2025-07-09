import { io } from "/socket.io/socket.io.esm.min.js";

export function initChangeSettings() {
    const socket = io();
    let gameCode;
    let playerName;

    document.getElementById("createBackBtn")?.addEventListener("click", () => {
        window.history.back();
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
            slider.dispatchEvent(new Event('input'));
            updateDisplay();
        });

        addBtn?.addEventListener('click', () => {
            slider.stepUp();
            slider.dispatchEvent(new Event('input'));
            updateDisplay();
        });

        slider.addEventListener('input', updateDisplay);
        updateDisplay();
    }

    function setupSelectAllCheckbox(groupSelector, selectAllId) {
        const checkboxes = Array.from(document.querySelectorAll(groupSelector));
        const selectAll = document.getElementById(selectAllId);

        selectAll?.addEventListener('change', () => {
            checkboxes.forEach(cb => {
                if (cb.id !== selectAllId) cb.checked = selectAll.checked;
            });
        });

        checkboxes.forEach(cb => {
            if (cb.id === selectAllId) return;
            cb.addEventListener('change', () => {
                const allChecked = checkboxes
                    .filter(c => c.id !== selectAllId)
                    .every(c => c.checked);
                selectAll.checked = allChecked;
            });
        });
    }

    setupAmountControls('playerSlider', 'playerCount', '.subtract', '.add');
    setupAmountControls('cardSlider', 'cardCount', '.subtract', '.add');
    setupSelectAllCheckbox('#special-cards input[type="checkbox"]', 'check-all');

    fetch('/api/lobbyData').then(r => r.json()).then(data => {
        gameCode = data.code;
        playerName = data.name;
        socket.emit('join-lobby', gameCode, playerName);
        document.getElementById('playerSlider').value = data.players;
        document.getElementById('playerCount').textContent = data.players;
        const s = data.settings || {};
        document.getElementById('cardSlider').value = s.cards || 7;
        document.getElementById('cardCount').textContent = s.cards || 7;
        document.getElementById('draw2').checked = !!s.draw2;
        document.getElementById('reverse').checked = !!s.reverse;
        document.getElementById('skip').checked = !!s.skip;
        document.getElementById('wild').checked = !!s.wild;
        document.getElementById('wild+4').checked = !!s.wild4;
        const all = Array.from(document.querySelectorAll('#special-cards input[type="checkbox"]'))
            .filter(cb => cb.id !== 'check-all')
            .every(cb => cb.checked);
        document.getElementById('check-all').checked = all;
    });

    document.getElementById('start-new-game')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const settings = {
            players: document.getElementById('playerSlider').value,
            cards: document.getElementById('cardSlider').value,
            draw2: document.getElementById('draw2').checked,
            reverse: document.getElementById('reverse').checked,
            skip: document.getElementById('skip').checked,
            wild: document.getElementById('wild').checked,
            wild4: document.getElementById('wild+4').checked
        };
        await fetch('/api/updateSettings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
        });
        socket.emit('start-game', gameCode);
        window.location.href = '/gameplay';
    });
}
