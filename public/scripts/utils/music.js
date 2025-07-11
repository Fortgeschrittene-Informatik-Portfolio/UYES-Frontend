const MUSIC_SRC = '/music/background.mp3';

let audioElem;

export function startMusic() {
    const volume = getVolume();
    if (!audioElem) {
        audioElem = new Audio(MUSIC_SRC);
        audioElem.loop = true;
        audioElem.volume = volume;
        audioElem.play().catch(() => { /* ignore autoplay errors */ });
    } else {
        audioElem.volume = volume;
    }
}

// apply volume changes across tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'bg-music-volume' && audioElem) {
        const vol = parseFloat(e.newValue);
        if (Number.isFinite(vol)) {
            audioElem.volume = vol;
        }
    }
});

export function setVolume(vol) {
    const volume = Math.min(Math.max(vol, 0), 1);
    localStorage.setItem('bg-music-volume', String(volume));
    if (audioElem) {
        audioElem.volume = volume;
    }
}

export function getVolume() {
    const stored = parseFloat(localStorage.getItem('bg-music-volume'));
    return Number.isFinite(stored) ? stored : 0.5;
}
