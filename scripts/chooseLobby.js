import { handleIntro } from './utils/intros.js';

export function initChooseLobby() {
    console.log("chooseLobby geladen");


    handleIntro({
        flagName: "introSeenStart",
        lastStepId: "intro6wrap",
        resetBtnId: "eichberg2"
    });



}