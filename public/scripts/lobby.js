import { io } from "/socket.io/socket.io.esm.min.js";
const socket = io(); // Standardverbindung
let currentGameCode;

export async function initLobbyHost() {
    const res = await fetch("/api/lobbyData");
    const gameData = await res.json();

    currentGameCode = gameData.code;
    const playerName = gameData.name;
    const maxPlayers = gameData.players;
    const role = gameData.role;
    let hostName = gameData.host || (role === "host" ? playerName : null);

    // Spieler in WebSocket-Raum eintragen
    socket.emit("join-lobby", currentGameCode, playerName, maxPlayers);

    // Game-Code anzeigen
    const codeElement = document.getElementById("game-code");
    codeElement.textContent = `Game-Code: #${currentGameCode || "000000"}`;

    // BODY-Klasse setzen (nur Joiner)
    if (role === "joiner") {
        document.body.classList.add("Joiner");
    }

    // Lobby initial rendern
    renderLobby(gameData, [playerName], hostName); // Host kennt nur sich selbst – Joiner sieht später Liste

    // Wenn neue Spieler beitreten oder Server Lobby-Update schickt
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

    socket.on("lobby-not-found", () => {
        alert("❌ Lobby nicht gefunden");
        window.location.href = "/start/game";
    });

    socket.on("lobby-full", () => {
        alert("❌ Lobby ist voll");
        window.location.href = "/start/game";
    });


    // Game-Code neu generieren
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

    const redirectToGame = () => {
        if (window.location.pathname !== "/gameplay") {
            window.location.href = "/gameplay";
        }
    };

    socket.on("game-started", redirectToGame);
    socket.on("player-turn", redirectToGame);


    helpFunctionality(() => currentGameCode, playerName);
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

    // 🔴 Kick-Buttons aktivieren
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

function helpFunctionality(getGameCode, playerName) {
    const helpBtn = document.getElementById("helpBtnLobby");
    const helpDiv = document.getElementById("helpButtonClicked");
    const closeHelpBtn = document.getElementById("closeHelpBtn");
    const aboutBtn = document.getElementById("AboutBtn");
    const settingBtn = document.getElementById("SettingsBtn");
    const exitBtn = document.getElementById("ExitGameBtn");

    const exitDiv = document.getElementById("submitLeaving");
    const stopLeaving = document.getElementById("stopLeaving");
    const leave = document.getElementById("leave");


    if (helpBtn) {
        helpBtn.addEventListener("click", () => {
            helpDiv.classList.add("helpOpen");
        });
    }

    if (closeHelpBtn) {
        closeHelpBtn.addEventListener("click", () => {
            helpDiv.classList.remove("helpOpen");
        });
    }

    if(exitBtn){
        exitBtn.addEventListener("click", () => {
            exitDiv.classList.add("exitOpen");
        });
    }
    if(stopLeaving){
        stopLeaving.addEventListener("click", () => {
            exitDiv.classList.remove("exitOpen");
        });
    }
    if (leave) {
        leave.addEventListener("click", () => {
            console.log("🚪 Spieler klickt auf Exit – leave wird ausgeführt");
            socket.emit("leave-lobby", getGameCode(), playerName);
            window.location.href = "/start/game";
        });
    }

}




