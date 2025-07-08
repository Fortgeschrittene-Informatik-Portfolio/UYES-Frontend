import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
const socket = io();
let gameCode;
let playerName;

export async function initGameplay() {
    const res = await fetch('/api/lobbyData');
    const data = await res.json();
    gameCode = data.code;
    playerName = data.name;

    socket.emit('join-lobby', gameCode, playerName);

    socket.on('deal-cards', renderHand);
    socket.on('player-turn', highlightTurn);
    socket.on('card-played', updateDiscard);
    socket.on('game-end', showWinner);

    document.getElementById('draw-pile')?.addEventListener('click', () => {
        socket.emit('draw-card', gameCode);
    });
}

function renderHand(cards) {
    const container = document.getElementById('player-hand-container');
    container.innerHTML = '';
    for (const card of cards) {
        const span = document.createElement('span');
        span.className = `card normal ${card.color}`;
        span.dataset.color = card.color;
        span.dataset.value = card.value;
        span.innerHTML = `<span><span>${card.value}</span></span>`;
        span.addEventListener('click', () => {
            socket.emit('play-card', gameCode, { color: card.color, value: card.value });
        });
        container.appendChild(span);
    }
}

function highlightTurn(name) {
    const avatars = document.querySelectorAll('.avatar');
    avatars.forEach(a => a.classList.remove('active'));
    const el = Array.from(avatars).find(a => a.textContent.includes(name));
    el?.classList.add('active');
}

function updateDiscard({ player, card }) {
    const pile = document.querySelector('#discard-pile span.card');
    if (pile) {
        pile.className = `card big ${card.color}`;
        pile.innerHTML = `<span><span>${card.value}</span></span>`;
    }
}

function showWinner(winner) {
    const win = document.getElementById('winner');
    if (win) {
        win.textContent = `${winner} won!`;
        win.classList.remove('hidden');
    }
    document.getElementById('milchglas2')?.classList.remove('hidden');
    document.getElementById('ending-buttons')?.classList.remove('hidden');
}
