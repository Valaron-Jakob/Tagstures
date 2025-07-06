import { loadMetadata } from './api.js';
import { renderGallery } from './render.js';
import { attachEventListeners } from './events.js';
import state from './state.js';

async function init() {
    state.metadata = await loadMetadata();
    state.allTags = [...new Set(Object.values(state.tags).flat())].sort();
    state.allCollections = [...new Set(Object.values(state.collections).flat())].sort();
    renderGallery();
    attachEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
