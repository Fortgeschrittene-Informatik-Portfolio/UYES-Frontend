const funnyNames = ["U-Norris", "Taylor Swift Card", "UNO DiCaprio", "Cardi Bitch", "Elon Shuffle", "Snoop Draw Two", "Oprah Skipfrey", "Keanu Draw-Reeves", "UNO Musk", "Barack Ob-Draw-ma", "Harry Skipper", "Justin Blieber", "Reverse Kardashian", "The Rock’n’Draw", "Skipney Spears", "UNOwen Wilson", "Dwayne 'The Card' Johnson", "Kim Kartdashian", "Lady Skaga", "Ed Skipran", "Will Cardsmith", "Cardashians Unite", "UNO Clarkson", "Shufflon Musk", "UNOzilla", "UNOferatu", "Beyoncé Drawoncé", "UNOli Baba und die 4 Farben", "The Weeknd Reversed", "UNOkeem Phoenix", "Cardashian West", "UNOthanos – I’ll skip half of you", "UNOmar Khaled – Another one", "UNOna Lisa", "Lil Draw-X", "Vin Unocard", "UNO Maccaroni", "UNOndo (der Vergelter)", "UNO'Neill (Shaquille Edition)", "UNO McGregor", "UNO Bieber Fever", "UNO-Tokio Drift", "UNOlectro Deluxe", "UNOzilla vs. Cardzilla", "UNO Reloaded", "UNOmander Reversal"];

function getRandomName() {
    return funnyNames[Math.floor(Math.random() * funnyNames.length)];
}

export function generateGameCode() {
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

