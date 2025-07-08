import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
const socket = io();
let gameCode;
let playerName;
let maxPlayers;
let avatarSlots = [];

export async function initGameplay() {
    const res = await fetch('/api/lobbyData');
    const data = await res.json();
    gameCode = data.code;
    playerName = data.name;

    const role = data.role;
    if (role !== 'host') {
        document.body.classList.add('Joiner');
    } else {
        document.body.classList.remove('Joiner');
    }

    maxPlayers = data.players;


    socket.emit('join-lobby', gameCode, playerName);

    socket.on('deal-cards', renderHand);
    socket.on('player-turn', highlightTurn);
    socket.on('card-played', updateDiscard);
    socket.on('game-end', showWinner);
    socket.on('update-hand-counts', updateHandCounts);

    setupAvatarSlots(maxPlayers);

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
    const el = document.querySelector(`.avatar[data-player-name="${name}"]`);
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

function setupAvatarSlots(total) {
    const container = document.getElementById('player-avatars');
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
    const others = list.filter(p => p.name !== playerName);
    for (let i = 0; i < avatarSlots.length; i++) {
        const slot = avatarSlots[i];
        const data = others[i];
        if (data) {
            slot.querySelector('.cardsleft').textContent = `${data.count}x`;
            slot.dataset.playerName = data.name;
            slot.classList.remove('inactive');
        } else {
            slot.querySelector('.cardsleft').textContent = '';
            slot.dataset.playerName = '';
            slot.classList.add('inactive');
        }
    }
}
