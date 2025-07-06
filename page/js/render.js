import state from './state.js';

export function renderGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    // --- Get search value from thead input ---
    const searchInput = document.getElementById('filename-search');
    let searchValue = '';
    if (searchInput) {
        searchValue = searchInput.value.toLowerCase();
        // Only add event listener once
        if (!searchInput._searchListenerAdded) {
            searchInput.addEventListener('input', renderGallery);
            searchInput._searchListenerAdded = true;
        }
    }

    const entries = Object.entries(state.metadata)
        .sort(([a], [b]) => a.localeCompare(b))
        .filter(([filename, meta]) =>
            // Filter by search
            filename.toLowerCase().includes(searchValue) &&
            (
                state.activeFilters.size > 0
                    ? [...state.activeFilters].every((f) =>
                        (meta.tags || []).includes(f) || (meta.collections || []).includes(f)
                    )
                    : true
            )
        );

    // Row counter
    document.getElementById('row-counter').textContent = `${entries.length} row${
        entries.length === 1 ? '' : 's'
    } shown`;

    // --- Shift selection support ---
    // Store filenames for index lookup
    const filenames = entries.map(([filename]) => filename);

    // Track last selected index for shift selection
    if (typeof state.lastSelectedIndex !== 'number') state.lastSelectedIndex = null;

    for (let i = 0; i < entries.length; i++) {
        const [filename, meta] = entries[i];
        const sortedTags = [...(meta.tags || [])].sort();
        const sortedCollections = [...(meta.collections || [])].sort();
        const checked = state.selectedRows.has(filename) ? 'checked' : '';

        const row = document.createElement('tr');
        row.className = state.selectedRows.has(filename) ? 'table-primary' : '';
        row.setAttribute('data-row-index', i);
        row.setAttribute('data-filename', filename);
        row.style.cursor = 'pointer';
        row.innerHTML = `
      <td>
        <div class="form-check">
          <input type="checkbox" class="row-select form-check-input" data-filename="${filename}" ${checked}>
        </div>
      </td>
      <td>
        <span class="img-hover-outer">
          <img src="/assets/${filename}" alt="${filename}">
          <img class="img-hover-large" src="/assets/${filename}" alt="${filename}">
        </span>
      </td>
      <td>${filename}</td>
      <td>
        <div class="d-inline-flex flex-wrap align-items-center">
          ${
            sortedTags.map((t) => `
            <span class="badge rounded-pill bg-info text-dark me-1 mb-1">
              ${t}
              <button class="btn-close btn-close-white btn-sm ms-1 tag-remove" data-type="tag" data-tag="${t}" data-filename="${filename}" style="font-size:0.7em;"></button>
            </span>`).join('')
        }
        </div>
      </td>
      <td>
        <div class="d-inline-flex flex-wrap align-items-center">
          ${
            sortedCollections.map((c) => `
            <span class="badge rounded-pill bg-warning text-dark me-1 mb-1">
              ${c}
              <button class="btn-close btn-close-white btn-sm ms-1 collection-remove" data-type="collection" data-collection="${c}" data-filename="${filename}" style="font-size:0.7em;"></button>
            </span>`).join('')
        }
        </div>
      </td>
    `;

        // --- Row click for selection (including shift) ---
        row.addEventListener('click', function (e) {
            // Ignore clicks on checkbox or tag/collection remove buttons
            if (
                e.target.classList.contains('row-select') ||
                e.target.classList.contains('btn-close')
            ) return;

            handleRowClick(i, filename, e, filenames);
        });

        // --- Checkbox click for selection (including shift) ---
        row.querySelector('.row-select').addEventListener('click', function (e) {
            e.stopPropagation();
            handleRowClick(i, filename, e, filenames);
        });

        gallery.appendChild(row);
    }

    renderFilterButtons();
}

// --- Shift selection logic ---
function handleRowClick(idx, filename, event, filenames) {
    if (event.shiftKey && state.lastSelectedIndex !== null) {
        const start = Math.min(state.lastSelectedIndex, idx);
        const end = Math.max(state.lastSelectedIndex, idx);
        for (let i = start; i <= end; i++) {
            state.selectedRows.add(filenames[i]);
        }
    } else {
        if (state.selectedRows.has(filename)) {
            state.selectedRows.delete(filename);
        } else {
            state.selectedRows.add(filename);
        }
        state.lastSelectedIndex = idx;
    }
    renderGallery();
}

function renderFilterButtons() {
    state.allTags = [...new Set(Object.values(state.tags).flat())].sort();
    state.allCollections = [...new Set(Object.values(state.collections).flat())].sort();
    const tagFilter = document.getElementById('tag-filter');
    const collectionFilter = document.getElementById('collection-filter');
    tagFilter.innerHTML = state.allTags.map((tag) =>
        `<button class="btn btn-sm ${
            state.activeFilters.has(tag) ? 'btn-info text-dark' : 'btn-outline-secondary'
        } me-1 mb-1" data-filter="${tag}" data-type="tag">${tag}</button>`
    ).join('');
    collectionFilter.innerHTML = state.allCollections.map((col) =>
        `<button class="btn btn-sm ${
            state.activeFilters.has(col) ? 'btn-warning text-dark' : 'btn-outline-secondary'
        } me-1 mb-1" data-filter="${col}" data-type="collection">${col}</button>`
    ).join('');
}
