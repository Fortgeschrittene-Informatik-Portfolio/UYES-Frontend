// Handle join lobby form submission
console.log("joinLobby script loaded");

document.addEventListener("DOMContentLoaded", () => {
    const nameInput = document.getElementById("NameInput");
    const codeInput = document.getElementById("gameCodeInput");
    const joinForm = document.getElementById("join-form");

    joinForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            name: nameInput?.value.trim() || "",
            code: codeInput?.value.trim() || "",
        };

        try {
            const res = await fetch("/api/joinGame", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.redirected) {
                window.location.href = res.url;
                return;
            }

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Failed to join game.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to join game.");
        }
    });
});

