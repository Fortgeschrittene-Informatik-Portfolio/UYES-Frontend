const funnyNames = ["Cardy B", "Drawzilla", "Reverso", "Captain Uno", "Skipz"];

function getRandomName() {
    return funnyNames[Math.floor(Math.random() * funnyNames.length)];
}

function generateGameCode() {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
}

export function createLobby({ name, settings }) {
    const gameId = generateGameCode();
    const playerName = name?.trim() || getRandomName();


    return {
        gameId,
        playerName,
        role: "host",
        settings
    };
}