export function helpFunctionality(socket, getGameCode, playerName) {
    const helpBtn = document.getElementById("helpBtnLobby");
    const helpDiv = document.getElementById("helpButtonClicked");
    const closeHelpBtn = document.getElementById("closeHelpBtn");
    const aboutBtn = document.getElementById("AboutBtn");
    const settingBtn = document.getElementById("SettingsBtn");
    const exitBtn = document.getElementById("ExitGameBtn");

    const exitDiv = document.getElementById("submitLeaving");
    const stopLeaving = document.getElementById("stopLeaving");
    const leave = document.getElementById("leave");

    if (helpBtn) {
        helpBtn.addEventListener("click", () => {
            helpDiv.classList.add("helpOpen");
        });
    }

    if (closeHelpBtn) {
        closeHelpBtn.addEventListener("click", () => {
            helpDiv.classList.remove("helpOpen");
        });
    }

    if(exitBtn){
        exitBtn.addEventListener("click", () => {
            exitDiv.classList.add("exitOpen");
        });
    }
    if(stopLeaving){
        stopLeaving.addEventListener("click", () => {
            exitDiv.classList.remove("exitOpen");
        });
    }
    if (leave) {
        leave.addEventListener("click", () => {
            socket.emit("leave-lobby", getGameCode(), playerName);
            window.location.href = "/start/game";
        });
    }

    if (aboutBtn) {
        aboutBtn.addEventListener("click", () => {
            window.open("/about", "_blank");
        });
    }

    if (settingBtn) {
        settingBtn.addEventListener("click", () => {
            window.open("/start/game/create", "_blank");
        });
    }
}
