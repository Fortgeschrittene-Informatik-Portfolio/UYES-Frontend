export function initHelpPage() {

    document.getElementById("backBtnHelp")?.addEventListener("click", () => {
        window.location.href = "/start";
    });

    document.getElementById("rulesBtnHelp")?.addEventListener("click", () => {
        window.location.href = "/rules";
    });

}
