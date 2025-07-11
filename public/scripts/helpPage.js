import { startMusic, setVolume, getVolume } from './utils/music.js';
import { setLanguage, applyTranslations } from './utils/i18n.js';

export function initHelpPage() {

    startMusic();

    document.getElementById("backBtnHelp")?.addEventListener("click", () => {
        window.history.back();
    });

    document.getElementById("rulesBtnHelp")?.addEventListener("click", () => {
        window.location.href = "/rules";
    });

    const slider = document.getElementById('volume-range');
    const decBtn = document.querySelector('.help-reduce-volume');
    const incBtn = document.querySelector('.help-increase-volume');
    const langSelect = document.getElementById('help-language-dropdown');

    if (slider) {
        slider.value = getVolume();
        const update = () => setVolume(parseFloat(slider.value));
        slider.addEventListener('input', update);
        decBtn?.addEventListener('click', () => { slider.stepDown(); update(); });
        incBtn?.addEventListener('click', () => { slider.stepUp(); update(); });
    }

    if (langSelect) {
        const stored = localStorage.getItem('lang') || 'en';
        langSelect.value = stored;
        langSelect.addEventListener('change', () => {
            setLanguage(langSelect.value);
            applyTranslations(document);
        });
    }

}
