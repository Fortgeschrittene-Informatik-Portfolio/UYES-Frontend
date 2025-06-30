export function registerIntroResetButton() {
    const resetBtn = document.getElementById("eichberg2");
    if (!resetBtn) return;

    resetBtn.addEventListener("click", () => {
        localStorage.removeItem("introSeen");
        window.location.reload();
    });
}

