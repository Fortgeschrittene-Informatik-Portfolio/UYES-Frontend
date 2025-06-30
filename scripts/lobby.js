// scripts/lobbyHost.js
export function initLobbyHost() {
    console.log("Lobby als Host gestartet");

    // Hole aus sessionStorage alles, was beim Erstellen übergeben wurde:
    const gameData = JSON.parse(sessionStorage.getItem("gameData"));

    if (!gameData) {
        alert("Fehler: Keine Game-Daten gefunden.");
        return;
    }

    const container = document.getElementById("player-lobby-container");

    // Game-Code anzeigen (bestehendes Element füllen)
    const codeElement = document.querySelector(".gameCode h2");
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
