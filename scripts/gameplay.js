import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
const socket = io();
let gameCode;
let playerName;
let playerAvatars = {};
let playerList = [];

export async function initGameplay() {
    const res = await fetch('/api/lobbyData');
    const data = await res.json();
    gameCode = data.code;
    playerName = data.name;
    playerAvatars = data.avatars || {};
    playerList = data.playerList || [];

    setAvatarImages();

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
    const avatars = document.querySelectorAll('.avatar, #own-avatar');
    avatars.forEach(a => a.classList.remove('active'));
    const el = document.querySelector(`.avatar[data-player="${name}"]`) ||
              document.querySelector(`#own-avatar[data-player="${name}"]`);
    el?.classList.add('active');
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
                el.style.backgroundImage = `url('/images/${file}')`;
            }
        }
        index++;
    }
    const own = document.getElementById('own-avatar');
    if (own) {
        own.dataset.player = playerName;
        const file = playerAvatars[playerName];
        if (file) {
            own.style.backgroundImage = `url('/images/${file}')`;
        }
    }
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
