/**
 * Handles the join lobby form where a player enters the
 * lobby code and optional name.
 */
export function initJoinLobby() {

    document.getElementById("joinBackBtn")?.addEventListener("click", () => {
        window.location.href = "/start/game";
    });

    const form = document.querySelector("form[action='/api/joinGame']");
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const codeInput = document.getElementById("gameCodeInput");
        const nameInput = document.getElementById("NameInput");

        const code = codeInput.value.trim();
        const name = nameInput.value.trim();

        if (!/^\d{9}$/.test(code)) {
            alert("❌ Bitte gib einen gültigen 9-stelligen Game-Code ein");
            return;
        }

        const res = await fetch("/api/joinGame", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, playerName: name }),
        });

        if (res.redirected) {
            window.location.href = res.url;
        } else {
            alert("❌ Lobby nicht gefunden");
        }
    });
}
