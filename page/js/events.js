import state from './state.js';
import { renderGallery } from './render.js';
import { saveTags } from './api.js';

export function attachEventListeners() {
    document.getElementById('gallery').addEventListener('click', handleGalleryClick);
    document.getElementById('tag-filter').addEventListener('click', handleTagFilterClick);
    document.getElementById('collection-filter').addEventListener(
        'click',
        handleCollectionFilterClick,
    );
    document.getElementById('select-all').addEventListener('change', handleSelectAll);

    // Mass tagging
    document.getElementById('mass-tag-input').addEventListener('keydown', handleMassTagKey);
    document.getElementById('add-mass-tag-btn').addEventListener('click', addMassTag);

    // Mass collections
    document.getElementById('mass-collections-input').addEventListener(
        'keydown',
        handleMassCollectionKey,
    );
    document.getElementById('add-mass-collection-btn').addEventListener('click', addMassCollection);
}

function handleGalleryClick(e) {
    if (e.target.matches('.row-select')) {
        const filename = e.target.dataset.filename;
        if (e.target.checked) {
            state.selectedRows.add(filename);
        } else {
            state.selectedRows.delete(filename);
        }
        renderGallery();
    }

    if (e.target.matches('.tag-remove')) {
        const { filename, tag } = e.target.dataset;
        if (!state.metadata[filename].tags) state.metadata[filename].tags = [];
        state.metadata[filename].tags = state.metadata[filename].tags.filter((t) => t !== tag);
        renderGallery();
        saveTags(state.metadata);
    }

    if (e.target.matches('.collection-remove')) {
        const { filename, collection } = e.target.dataset;
        if (!state.metadata[filename].collections) state.metadata[filename].collections = [];
        state.metadata[filename].collections = state.metadata[filename].collections.filter((c) =>
            c !== collection
        );
        renderGallery();
        saveTags(state.metadata);
    }
}

// Add separate handlers for tag and collection filter buttons
function handleTagFilterClick(e) {
    if (e.target.dataset.filter && e.target.dataset.type === 'tag') {
        const value = e.target.dataset.filter;
        state.activeFilters.has(value)
            ? state.activeFilters.delete(value)
            : state.activeFilters.add(value);
        renderGallery();
    }
}

function handleCollectionFilterClick(e) {
    if (e.target.dataset.filter && e.target.dataset.type === 'collection') {
        const value = e.target.dataset.filter;
        state.activeFilters.has(value)
            ? state.activeFilters.delete(value)
            : state.activeFilters.add(value);
        renderGallery();
    }
}

function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.row-select');
    checkboxes.forEach((cb) => {
        const filename = cb.dataset.filename;
        cb.checked = e.target.checked;
        e.target.checked ? state.selectedRows.add(filename) : state.selectedRows.delete(filename);
    });
    renderGallery();
}

function handleMassTagKey(e) {
    if (e.key === 'Enter') {
        addMassTag();
    }
}

function handleMassCollectionKey(e) {
    if (e.key === 'Enter') {
        addMassCollection();
    }
}

function addMassTag() {
    const input = document.getElementById('mass-tag-input');
    const tag = input.value.trim();
    if (!tag) return;

    for (const filename of state.selectedRows) {
        if (!state.metadata[filename].tags) state.metadata[filename].tags = [];
        if (!state.metadata[filename].tags.includes(tag)) state.metadata[filename].tags.push(tag);
    }

    input.value = '';
    renderGallery();
    saveTags(state.metadata);
}

function addMassCollection() {
    const input = document.getElementById('mass-collections-input');
    const collection = input.value.trim();
    if (!collection) return;

    for (const filename of state.selectedRows) {
        if (!state.metadata[filename].collections) state.metadata[filename].collections = [];
        if (!state.metadata[filename].collections.includes(collection)) {
            state.metadata[filename].collections.push(collection);
        }
    }

    input.value = '';
    renderGallery();
    saveTags(state.metadata);
}
