import { handleIntro } from './utils/intros.js';

export function initChooseLobby() {
    console.log("chooseLobby geladen");


    handleIntro({
        flagName: "introSeenStart",
        lastStepId: "intro6wrap",
        resetBtnId: "eichberg2"
    });

    document.getElementById("backBtnChooseLobby")?.addEventListener("click", () => {
        window.location.href = "/start";
    });

    document.getElementById("create")?.addEventListener("click", () => {
        window.location.href = "/start/game/create";
    });
    document.getElementById("join")?.addEventListener("click", () => {
        window.location.href = "/start/game/join";
    });



}