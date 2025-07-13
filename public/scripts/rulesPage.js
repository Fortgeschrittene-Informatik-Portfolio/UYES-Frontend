/** Initialise the page displaying game rules. */
export function initRulesPage() {
    document.getElementById("backBtnRules")?.addEventListener("click", () => {
        window.location.href = "/start";
    });
}
