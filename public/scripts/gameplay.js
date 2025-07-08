import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
const socket = io();
let gameCode;
let playerName;

let playerAvatars = {};
let playerList = [];

let maxPlayers;
let avatarSlots = [];

// Track the current top card on the discard pile
let topDiscard = null;
// Store current hand to re-render when turn state changes
let myHand = [];

// Whether it's currently this client's turn
let myTurn = false;


export async function initGameplay() {
    let data;
    try {
        const res = await fetch('/api/lobbyData');
        if (!res.ok) throw new Error('Request failed');
        data = await res.json();
    } catch (err) {
        alert('❌ Fehler beim Laden der Lobby-Daten');
        console.error(err);
        window.location.href = '/start/game';
        return;
    }

    gameCode = data.code;
    playerName = data.name;
    playerAvatars = data.avatars || {};
    playerList = data.playerList || [];

    const role = data.role;
    if (role !== 'host') {
        document.body.classList.add('Joiner');
    } else {
        document.body.classList.remove('Joiner');
    }

    // Hide the end-of-game buttons until a winner is announced
    const buttons = document.getElementById('ending-buttons');
    if (buttons) {
        buttons.style.display = 'none';
    }

    maxPlayers = data.players;

    setupAvatarSlots(maxPlayers);
    setAvatarImages();

    socket.on('deal-cards', renderHand);
    socket.on('player-turn', highlightTurn);
    socket.on('card-played', updateDiscard);
    socket.on('game-end', showWinner);
    socket.on('update-hand-counts', updateHandCounts);
    socket.on('player-uyes', toggleUyesBubble);

    socket.emit('join-lobby', gameCode, playerName);

    if (role === 'host') {
        socket.emit('start-game', gameCode);
    }

    const drawPile = document.getElementById('draw-pile');
    drawPile?.addEventListener('click', () => {
        if (myTurn) {
            socket.emit('draw-card', gameCode);
        }
    });
    drawPile?.addEventListener('dragstart', (e) => {
        if (!myTurn) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', 'draw');
    });

    const handContainer = document.getElementById('player-hand-container');
    handContainer?.addEventListener('dragover', (e) => {
        if (myTurn && e.dataTransfer.getData('text/plain') === 'draw') {
            e.preventDefault();
        }
    });
    handContainer?.addEventListener('drop', (e) => {
        if (myTurn && e.dataTransfer.getData('text/plain') === 'draw') {
            e.preventDefault();
            socket.emit('draw-card', gameCode);
        }
    });

    const discard = document.getElementById('discard-pile');
    discard?.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    discard?.addEventListener('drop', (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (data) {
            try {
                const card = JSON.parse(data);
                socket.emit('play-card', gameCode, card);
            } catch { /* ignore invalid data */ }
        }
    });

    const uyesBtn = document.getElementById('UYES');
    uyesBtn?.addEventListener('click', () => {
        if (myTurn) {
            socket.emit('uyes', gameCode);
        }
    });
}

function displayValue(value) {
    switch (value) {
        case 'draw2':
            return '2+';
        case 'wild4':
            return '4+';
        case 'reverse':
            return '⤾';
        case 'skip':
            return 'Ø';
        case 'wild':
            return 'W';
        default:
            return value;
    }
}

function renderHand(cards) {
    myHand = cards.slice();
    const container = document.getElementById('player-hand-container');
    container.innerHTML = '';
    for (const card of cards) {
        const span = document.createElement('span');
        span.className = `card normal ${card.color}`;
        span.dataset.color = card.color;
        span.dataset.value = card.value;
        span.innerHTML = `<span><span>${displayValue(card.value)}</span></span>`;
        const playable = myTurn && isCardPlayable(card);
        span.draggable = playable;
        if (playable) {
            span.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(card));
            });
            span.addEventListener('click', () => {
                socket.emit('play-card', gameCode, { color: card.color, value: card.value });
            });
        } else {
            span.classList.add('unplayable');
        }

        span.addEventListener('mouseenter', () => {
            span.classList.add('hovered');
            const prev = span.previousElementSibling;
            if (prev && prev.classList.contains('card')) {
                prev.classList.add('prev-hovered');
            }
        });

        span.addEventListener('mouseleave', () => {
            span.classList.remove('hovered');
            const prev = span.previousElementSibling;
            if (prev && prev.classList.contains('card')) {
                prev.classList.remove('prev-hovered');
            }
        });
        container.appendChild(span);
    }
}

function highlightTurn(name) {
    // remember whether it is our turn
    myTurn = name === playerName;

    // Spielerreihenfolge rotieren, sodass der übergebene Spieler an erster
    // Stelle steht. Damit lässt sich leicht berechnen, wie viele Züge es bis zu
    // unserem eigenen Zug sind.
    while (playerList.length && playerList[0] !== name) {
        playerList.push(playerList.shift());
    }

    const turnsUntil = Math.max(0, playerList.indexOf(playerName));
    const counter = document.getElementById('roundCountTurn');
    if (counter) counter.textContent = String(turnsUntil);

    const avatars = document.querySelectorAll('.avatar, #own-avatar');
    avatars.forEach(a => {
        const match = a.dataset.player === name || a.dataset.playerName === name;
        a.classList.toggle('active', !!match);
    });
    document.body.classList.toggle('my-turn', name === playerName);
    // re-render hand so playable state updates
    renderHand(myHand);
}

function setAvatarImages() {
    let index = 1;
    for (const n of playerList) {
        if (n === playerName) continue;
        const el = document.getElementById(`player${index}`);
        if (el) {
            el.dataset.player = n;
            const file = playerAvatars[n];
            if (file) {
                el.style.backgroundImage = `url('/images/avatars/${file}')`;
            }
        }
        index++;
    }
    const own = document.getElementById('own-avatar');
    if (own) {
        own.dataset.player = playerName;
        const file = playerAvatars[playerName];
        if (file) {
            own.style.backgroundImage = `url('/images/avatars/${file}')`;
        }
    }
}

function updateDiscard({ player, card }) {
    const pile = document.querySelector('#discard-pile span.card');
    if (pile) {
        pile.className = `card big ${card.color}`;
        pile.innerHTML = `<span><span>${displayValue(card.value)}</span></span>`;
    }
    topDiscard = card;
}

function isCardPlayable(card) {
    if (!topDiscard) return true;
    return card.color === 'wild' ||
        card.color === topDiscard.color ||
        card.value === topDiscard.value ||
        topDiscard.color === 'wild';
}

function showWinner(winner) {
    const win = document.getElementById('winner');
    if (win) {
        win.textContent = `${winner} won!`;
        win.classList.remove('hidden');
    }
    document.getElementById('milchglas2')?.classList.remove('hidden');
    const endButtons = document.getElementById('ending-buttons');
    if (endButtons) {
        endButtons.classList.remove('hidden');
        endButtons.style.display = '';
    }
}

function setupAvatarSlots(total) {
    const container = document.getElementById('player-avatars2');
    if (!container) return;
    container.innerHTML = '';
    avatarSlots = [];
    const rows = [document.createElement('div'), document.createElement('div')];
    rows.forEach(r => r.classList.add('row'));
    const count = Math.min(total - 1, 4);
    for (let i = 0; i < count; i++) {
        const avatar = document.createElement('div');
        avatar.className = 'avatar inactive';
        avatar.id = `player${i + 1}`;
        avatar.dataset.playerName = '';
        avatar.innerHTML = `
            <div class="player-name"></div>
            <div class="cardHands">
                <div class="avatar-row">
                    <h2 class="cardsleft"></h2>
                </div>
                <div class="avatar-row">
                    <span class="card small back"><span><span></span></span></span>
                    <span class="card small back"><span><span></span></span></span>
                </div>
            </div>`;
        avatarSlots.push(avatar);
        if (i < 2) rows[0].appendChild(avatar); else rows[1].appendChild(avatar);
    }
    rows.forEach(r => container.appendChild(r));
}

function updateHandCounts(list) {
    if (!avatarSlots.length) setupAvatarSlots(list.length);
    // Dreh die vom Server gesendete Spielreihenfolge so, dass sie aus Sicht
    // des aktuellen Clients beginnt. Dadurch stimmen die Avatar-Slots bei allen
    // Spielern überein.

    const names = list.map(p => p.name);
    const myIndex = names.indexOf(playerName);
    const rotated = list
        .slice(myIndex + 1)
        .concat(list.slice(0, myIndex + 1));

    // komplette Reihenfolge (inkl. eigenem Namen) für Turn-Berechnungen
    playerList = rotated.map(p => p.name);

    // ohne eigenen Spieler, um nur die anderen Avatare zu füllen
    const others = rotated.filter(p => p.name !== playerName);

    for (let i = 0; i < avatarSlots.length; i++) {
        const slot = avatarSlots[i];
        const data = others[i];
        if (data) {
            slot.querySelector('.cardsleft').textContent = `${data.count}x`;
            slot.dataset.playerName = data.name;
            slot.querySelector('.player-name').textContent = data.name;
            slot.classList.remove('inactive');
        } else {
            slot.querySelector('.cardsleft').textContent = '';
            slot.dataset.playerName = '';
            slot.querySelector('.player-name').textContent = '';
            slot.classList.add('inactive');
        }
    }
    setAvatarImages();
}

function getAvatarElement(name) {
    return document.querySelector(`#own-avatar[data-player="${name}"]`) ||
        document.querySelector(`.avatar[data-player-name="${name}"]`);
}

function toggleUyesBubble({ player, active }) {
    const avatar = getAvatarElement(player);
    if (!avatar) return;
    let bubble = avatar.querySelector('.uyes-bubble');
    if (active) {
        if (!bubble) {
            bubble = document.createElement('div');
            bubble.className = 'uyes-bubble';
            bubble.textContent = 'UYES!';
            avatar.appendChild(bubble);
        }
    } else if (bubble) {
        bubble.remove();
    }
}
