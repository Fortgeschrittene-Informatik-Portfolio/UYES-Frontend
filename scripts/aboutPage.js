export function initAboutPage() {
    console.log("AboutPage geladen");

    document.getElementById("back-to-main-menu")?.addEventListener("click", () => {
        window.location.href = "/start";
    });

}
