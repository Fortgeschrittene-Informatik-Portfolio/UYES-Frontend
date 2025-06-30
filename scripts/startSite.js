export function initStartSite() {
    console.log("StartSite geladen");



    document.getElementById("about")?.addEventListener("click", () => {
        window.location.href = "/about";
    });

    document.getElementById("help")?.addEventListener("click", () => {
        window.location.href = "/help";
    });

    document.getElementById("start")?.addEventListener("click", () => {
        window.location.href = "/start/game";
    });

    if (localStorage.getItem("introSeen") === "true") {
        document.querySelectorAll(".intro").forEach(el => el.remove());
        document.getElementById("milch-glas-layer").style.display = "none";
        return;
    }

    document.querySelector("#intro6wrap button")?.addEventListener("click", () => {
        localStorage.setItem("introSeen", "true");
    });

    document.getElementById("NO")?.addEventListener("click", () => {
        localStorage.setItem("introSeen", "true");
        window.location.reload();
    });
}
