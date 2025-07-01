// scripts/lobbyHost.js

import { generateGameCode } from '../backend/logic/lobbyHandling.js';


export async function initLobbyHost() {
    console.log("Lobby als Host gestartet");

    document.getElementById("refresh-code-button")?.addEventListener("click", () => {
        const newCode = generateGameCode();
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


    // Spielerplätze rendern
    for (let i = 0; i < gameData.players; i++) {
        const playerDiv = document.createElement("div");
        playerDiv.className = "player-lobby-fields";

        if (i === 0) {
            // Host selbst
            playerDiv.innerHTML = `
                <p id="hostTag">host:</p>
                <p class="takenSlot">${gameData.name} (you)</p>
            `;
        } else {
            // Offene Plätze
            playerDiv.innerHTML = `
                <p class="openSlot">Player${i + 1}...</p>
                <button class="removePlayerButton">Remove</button>
            `;
        }

        container.appendChild(playerDiv);
    }

    // Start-Button etc. bleibt wie gehabt
}
