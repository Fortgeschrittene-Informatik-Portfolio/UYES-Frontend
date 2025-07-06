// scripts/lobbyHost.js

import { generateGameCode } from './utils/gameCode.js';


export async function initLobbyHost() {
    console.log("Lobby als Host gestartet");

    const refreshBtn = document.getElementById("refresh-code-button");
    refreshBtn?.addEventListener("click", async () => {
        const newCode = generateGameCode();

        try {
            const res = await fetch("/api/gameCode", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: newCode })
            });
            if (!res.ok) throw new Error();
        } catch {
            console.error("Fehler beim Aktualisieren des Game-Codes");
            return;
        }

        const codeElement = document.getElementById("game-code");
        codeElement.textContent = `Game-Code: #${newCode}`;
    });

    // Lobby-Daten aus der aktiven Session abrufen
    let gameData;
    try {
        const res = await fetch("/api/lobbyData");
        if (!res.ok) throw new Error();
        gameData = await res.json();
    } catch {
        alert("Fehler: Keine Game-Daten gefunden.");
        return;
    }

    const container = document.getElementById("player-lobby-container");

    // Game-Code anzeigen (bestehendes Element füllen)
    const codeElement = document.getElementById("game-code");
    codeElement.textContent = `Game-Code: #${gameData.code || "000000"}`;

    // Darstellung je nach Rolle
    if (gameData.role === "joiner") {
        refreshBtn?.style.setProperty("display", "none");
        document.getElementById("startGameplay")?.style.setProperty("display", "none");

        const hostDiv = document.createElement("div");
        hostDiv.className = "player-lobby-fields";
        hostDiv.innerHTML = `
            <p id="hostTag">host:</p>
            <p class="takenSlot">${gameData.hostName || "Host"}</p>
        `;
        container.appendChild(hostDiv);

        const joinerDiv = document.createElement("div");
        joinerDiv.className = "player-lobby-fields";
        joinerDiv.innerHTML = `
            <p class="takenSlot">${gameData.name} (you)</p>
        `;
        container.appendChild(joinerDiv);

        for (let i = 2; i < gameData.players; i++) {
            const openDiv = document.createElement("div");
            openDiv.className = "player-lobby-fields";
            openDiv.innerHTML = `
                <p class="openSlot">Player${i + 1}...</p>
            `;
            container.appendChild(openDiv);
        }
    } else {
        // Host selbst und freie Plätze
        for (let i = 0; i < gameData.players; i++) {
            const playerDiv = document.createElement("div");
            playerDiv.className = "player-lobby-fields";

            if (i === 0) {
                playerDiv.innerHTML = `
                    <p id="hostTag">host:</p>
                    <p class="takenSlot">${gameData.name} (you)</p>
                `;
            } else {
                playerDiv.innerHTML = `
                    <p class="openSlot">Player${i + 1}...</p>
                    <button class="removePlayerButton">Remove</button>
                `;
            }
            container.appendChild(playerDiv);
        }
    }

    // Start-Button etc. bleibt wie gehabt
}

