import { io } from "/socket.io/socket.io.esm.min.js";
import { helpFunctionality } from './utils/helpMenu.js';
const socket = io();
let currentGameCode;

export async function initLobbyHost() {
    const res = await fetch("/api/lobbyData");
    const gameData = await res.json();

    currentGameCode = gameData.code;
    const playerName = gameData.name;
    const maxPlayers = gameData.players;
    const role = gameData.role;
    let hostName = gameData.host || (role === "host" ? playerName : null);

    socket.emit("join-lobby", currentGameCode, playerName, maxPlayers);

    const codeElement = document.getElementById("game-code");
    codeElement.textContent = `Game-Code: #${currentGameCode || "000000"}`;

    if (role === "joiner") {
        document.body.classList.add("Joiner");
    }

    renderLobby(gameData, [playerName], hostName);

    socket.on("update-lobby", (players, _maxPlayers, _avatars, newHost) => {
        hostName = newHost;
        renderLobby(gameData, players, hostName);
        checkIfLobbyFull(players, maxPlayers);
        if (playerName === hostName) {
            document.body.classList.remove("Joiner");
        } else {
            document.body.classList.add("Joiner");
        }
    });
    socket.on('host-assigned', () => {
        alert('You are now the host.');
        document.body.classList.remove('Joiner');
    });

    socket.on("lobby-not-found", () => {
        alert("❌ Lobby nicht gefunden");
        window.location.href = "/start/game";
    });

    socket.on("lobby-full", () => {
        alert("❌ Lobby ist voll");
        window.location.href = "/start/game";
    });

    socket.on("game-in-progress", () => {
        alert("Game already in progress");
        window.location.href = "/start/game";
    });


    document.getElementById("refresh-code-button")?.addEventListener("click", async () => {
        const newCode = Math.floor(100000000 + Math.random() * 900000000).toString();
        const oldCode = currentGameCode;

        try {
            const res = await fetch("/api/gameCode", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: newCode })
            });
            if (!res.ok) throw new Error();
            socket.emit("change-code", oldCode, newCode);
            currentGameCode = newCode;
            codeElement.textContent = `Game-Code: #${newCode}`;
        } catch {
            console.error("❌ Fehler beim Aktualisieren des Codes");
        }
    });

    socket.on("kicked", () => {
        alert("Du wurdest aus der Lobby entfernt.");
        window.location.href = "/start/game";
    });

    socket.on("update-code", async (newCode) => {
        currentGameCode = newCode;
        codeElement.textContent = `Game-Code: #${newCode}`;
        await fetch("/api/gameCode", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: newCode })
        });
    });


    const startBtn = document.getElementById("startGameplay");
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            socket.emit("start-game", currentGameCode);
        });
    }

    socket.on("start-game-error", (msg) => {
        alert(msg);
    });

    const redirectToGame = () => {
        if (window.location.pathname !== "/gameplay") {
            window.location.href = "/gameplay";
        }
    };

    socket.on("game-started", redirectToGame);
    socket.on("player-turn", redirectToGame);


    helpFunctionality(socket, () => currentGameCode, playerName);
}








function renderLobby(gameData, playerList, hostName) {
    const container = document.getElementById("player-lobby-container");
    container.innerHTML = "";
    const lobbyTag = document.createElement("h2");
    lobbyTag.innerHTML = "Lobby";
    container.appendChild(lobbyTag);

    for (let i = 0; i < gameData.players; i++) {
        const playerDiv = document.createElement("div");
        playerDiv.className = "player-lobby-fields";

        if (playerList[i]) {
            const isCurrent = playerList[i] === gameData.name;
            const label = playerList[i] === hostName ? "host:" : "";
            playerDiv.innerHTML = `
                ${label ? `<p id="hostTag">${label}</p>` : ""}
                <p class="takenSlot">${playerList[i]}${isCurrent ? " (you)" : ""}</p>
                ${isCurrent ? "" : `<button class="removePlayerButton" data-player="${playerList[i]}">Kick</button>`}
            `;
        } else {
            playerDiv.innerHTML = `
                <p class="openSlot">Player${i + 1}...</p>`;
        }

        container.appendChild(playerDiv);
    }

    document.querySelectorAll(".removePlayerButton[data-player]").forEach(btn => {
        btn.addEventListener("click", () => {
            const playerToKick = btn.getAttribute("data-player");
            socket.emit("kick-player", currentGameCode, playerToKick);
        });
    });
}

function checkIfLobbyFull(currentPlayers, maxPlayers) {
    const startBtn = document.getElementById("startGameplay");
    if (startBtn) {
        if (currentPlayers.length >= maxPlayers) {
            startBtn.classList.remove("notFull");
        } else {
            startBtn.classList.add("notFull");
        }
    }
}





