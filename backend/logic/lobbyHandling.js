const funnyNames = ["Cardy B", "Drawzilla", "Reverso", "Captain Uno", "Skipz"];

function getRandomName() {
    return funnyNames[Math.floor(Math.random() * funnyNames.length)];
}

function generateGameCode() {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
}

export function createLobby({ name, settings }) {
    const gameId = generateGameCode();
    const playerName = name?.trim() || getRandomName();


    return {
        gameId,
        playerName,
        role: "host",
        settings
    };
}

export async function initLobbyHost() {
    console.log("Lobby als Host gestartet");

    const res = await fetch("/api/lobbyData");
    if (!res.ok) {
        alert("Fehler beim Laden der Lobbydaten.");
        return;
    }

    const gameData = await res.json();

    // dann wie gehabt:
    const container = document.getElementById("player-lobby-container");

    // 🧠 Game-Code nur an vorgesehener Stelle anzeigen (du hast ja schon einen Platz im HTML!)
    const gameCodeElem = document.querySelector(".gameCode h2");
    gameCodeElem.textContent = `Game-Code: #${gameData.code}`;

    // 🧠 Spielerplätze rendern wie gehabt
    for (let i = 0; i < gameData.players; i++) {
        const playerDiv = document.createElement("div");
        playerDiv.className = "player-lobby-fields";

        if (i === 0) {
            playerDiv.innerHTML = `
                <p id="hostTag">host:</p>
                <p class="takenSlot">${gameData.name} (you)</p>
            `;
        } else {
            playerDiv.innerHTML = `<p class="openSlot">Player${i + 1}...</p>`;
        }

        container.appendChild(playerDiv);
    }
}
