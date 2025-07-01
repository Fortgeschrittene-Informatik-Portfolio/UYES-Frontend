// scripts/lobbyHost.js

import { generateGameCode } from '../backend/logic/lobbyHandling.js';


export async function initLobbyHost() {
    console.log("Lobby als Host gestartet");

    document.getElementById("refresh-code-button")?.addEventListener("click", async () => {
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


    // Spielerplätze rendern
    const maxPlayers = gameData.settings?.players || gameData.players.length;
    for (let i = 0; i < maxPlayers; i++) {
        const playerDiv = document.createElement("div");
        playerDiv.className = "player-lobby-fields";

        const player = gameData.players[i];

        if (player) {
            const hostTag = player.role === "host" ? `<p id="hostTag">host:</p>` : "";
            const you = player.name === gameData.name ? " (you)" : "";
            const removeBtn = player.role !== "host" ? `<button class="removePlayerButton">Remove</button>` : "";
            playerDiv.innerHTML = `
                ${hostTag}
                <p class="takenSlot">${player.name}${you}</p>
                ${removeBtn}
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
