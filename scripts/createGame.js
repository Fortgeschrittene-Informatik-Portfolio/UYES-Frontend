import { handleIntro } from './utils/intros.js';

export function initCreateGame() {
    console.log("createGame geladen");


    handleIntro({
        flagName: "introSeenCreateGame",
        lastStepId: "intro9wrap",
        resetBtnId: "eichberg2"
    });

    document.getElementById("createBackBtn")?.addEventListener("click", () => {
        window.location.href = "/start/game";
    });



}
