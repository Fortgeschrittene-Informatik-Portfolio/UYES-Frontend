import { initStartSite } from './startSite.js';
import { registerIntroResetButton } from './utils/intros.js';

registerIntroResetButton();

const pageId = document.body.id;

if (pageId === 'startsite') {
    initStartSite();
}