export function handleIntro({ flagName, lastStepId, resetBtnId, skipBtnId }) {

    // Reset-Button → Intro zurücksetzen
    document.getElementById(resetBtnId)?.addEventListener("click", () => {
        localStorage.removeItem(flagName);
        window.location.reload();
    });

    if (localStorage.getItem(flagName) === "true") {
        document.querySelectorAll(".intro").forEach(el => el.remove());
        const layer = document.getElementById("milch-glas-layer");
        if (layer) layer.style.display = "none";
        return;
    }

    // Letzter "Next"-Button → Intro abgeschlossen
    document.querySelector(`#${lastStepId} button`)?.addEventListener("click", () => {
        localStorage.setItem(flagName, "true");
    });

    // NO-Button → Intro überspringen
    if (skipBtnId) {
        document.getElementById(skipBtnId)?.addEventListener("click", () => {
            localStorage.setItem(flagName, "true");
            window.location.reload();
        });
    }


}
