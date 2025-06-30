export function initHelpPage() {
    console.log("HelpPage geladen");

    document.getElementById("backBtnHelp")?.addEventListener("click", () => {
        window.location.href = "/start";
    });

}
