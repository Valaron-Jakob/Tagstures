let tags = {};
let selected = '';
let allTags = [];

const selectedRows = new Set();
const activeFilters = new Set();

async function load() {
    const res = await fetch('/api/tags');
    tags = await res.json();
    allTags = [...new Set(Object.values(tags).flat())].sort((a, b) => a.localeCompare(b));
    render();
}

function render() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    // Build entries, sorted by filename
    const entries = Object.entries(tags)
        .sort(([a], [b]) => a.localeCompare(b))
        .filter(([_, tagList]) => {
            // Multi-tag filter logic: show if all activeFilters are present in tagList
            if (activeFilters.size > 0) {
                return [...activeFilters].every((f) => tagList.includes(f));
            }
            // Show all files if no filter, including files with no tags
            return true;
        });

    for (const [filename, tagList] of entries) {
        // Sort tags by name
        const sortedTags = [...tagList].sort((a, b) => a.localeCompare(b));
        const checked = selectedRows.has(filename) ? 'checked' : '';
        const row = document.createElement('tr');
        row.className = selectedRows.has(filename) ? 'table-primary' : '';
        row.innerHTML = `
      <td>
        <input type="checkbox" class="row-select" data-filename="${filename}" ${checked} onclick="toggleRowSelect('${filename}', this)">
      </td>
      <td><img src="/assets/${filename}" alt="${filename}"></td>
      <td class="text-light">${filename}</td>
      <td>
        <div class="d-inline-flex flex-wrap align-items-center" id="tags-${filename}">
          ${
            sortedTags.map((t) => `
            <span class="badge rounded-pill bg-info text-dark me-1 mb-1">
              ${t}
              <button class="btn-close btn-close-white btn-sm ms-1" style="font-size:0.7em;vertical-align:middle;" onclick="removeTag('${filename}','${t}')"></button>
            </span>
          `).join('')
        }
        </div>
      </td>
    `;
        gallery.appendChild(row);
    }

    // render filter tags (multi-tag toggle filter)
    allTags = [...new Set(Object.values(tags).flat())].sort((a, b) => a.localeCompare(b));
    document.getElementById('filter').innerHTML = allTags.map((tag) =>
        `<button class="btn btn-sm ${
            activeFilters.has(tag) ? 'btn-info text-dark' : 'btn-outline-secondary'
        } me-1 mb-1" onclick="toggleFilter('${tag}')">${tag}</button>`
    ).join(' ');
}

// Checkbox row selection logic
window.toggleRowSelect = function (filename, checkbox) {
    if (checkbox.checked) {
        selectedRows.add(filename);
    } else {
        selectedRows.delete(filename);
    }
    render(); // To update row highlight
};

window.toggleSelectAll = function (master) {
    const gallery = document.getElementById('gallery');
    const checkboxes = gallery.querySelectorAll('.row-select');
    if (master.checked) {
        checkboxes.forEach((cb) => {
            cb.checked = true;
            selectedRows.add(cb.getAttribute('data-filename'));
        });
    } else {
        checkboxes.forEach((cb) => {
            cb.checked = false;
            selectedRows.delete(cb.getAttribute('data-filename'));
        });
    }
    render();
};

// Mass tag add logic
window.addMassTag = function () {
    const input = document.getElementById('mass-tag-input');
    const tag = input.value.trim();
    if (!tag) return;
    for (const filename of selectedRows) {
        if (!tags[filename]) tags[filename] = [];
        if (!tags[filename].includes(tag)) {
            tags[filename].push(tag);
        }
    }
    input.value = '';
    input.nextElementSibling.nextElementSibling.innerHTML = '';
    render();

    saveTags();
};

window.showMassTagSuggestions = function (input) {
    const val = input.value.trim().toLowerCase();
    const suggestions = allTags.filter((t) => t.toLowerCase().startsWith(val));
    const container = input.nextElementSibling.nextElementSibling;
    if (!val || suggestions.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = suggestions.slice(0, 5).map((s) =>
        `<div class="bg-info text-dark px-2 py-1 mb-1 rounded" style="cursor:pointer;" onclick="selectMassTagSuggestion('${s}')">${s}</div>`
    ).join('');
};

window.selectMassTagSuggestion = function (tag) {
    const input = document.getElementById('mass-tag-input');
    input.value = tag;
    input.focus();
    input.nextElementSibling.nextElementSibling.innerHTML = '';
};

window.massTagInputKey = function (e, _input) {
    if (e.key === 'Enter') {
        window.addMassTag();
        e.preventDefault();
    }
};

// Remove tag from a file
window.removeTag = function (filename, tag) {
    tags[filename] = tags[filename].filter((t) => t !== tag);
    render();

    saveTags();
};

// Add tag to a file
window.addTag = function (filename, tag) {
    tag = tag.trim();
    if (!tag) return;
    if (!tags[filename].includes(tag)) {
        tags[filename].push(tag);
        render();
    }
};

// Autocomplete suggestions for tags in table
window.showSuggestions = function (input, filename) {
    const val = input.value.trim().toLowerCase();
    const suggestions = allTags.filter((t) =>
        t.toLowerCase().startsWith(val) && !tags[filename].includes(t)
    );
    const container = input.nextElementSibling;
    if (!val || suggestions.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = suggestions.slice(0, 5).map((s) =>
        `<div class="bg-info text-dark px-2 py-1 mb-1 rounded" style="cursor:pointer;" onclick="selectSuggestion('${filename}', '${s}', this)">${s}</div>`
    ).join('');
};

// Handle suggestion click for tags in table
window.selectSuggestion = function (filename, tag, _element) {
    window.addTag(filename, tag);
};

// Handle Enter key for tag input in table
window.tagInputKey = function (e, input, filename) {
    if (e.key === 'Enter') {
        window.addTag(filename, input.value);
        input.value = '';
        input.nextElementSibling.innerHTML = '';
        e.preventDefault();
    }
};

// Multi-tag filter logic
window.toggleFilter = function (tag) {
    if (activeFilters.has(tag)) {
        activeFilters.delete(tag);
    } else {
        activeFilters.add(tag);
    }
    render();
};

async function saveTags() {
    const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tags, null, 2),
    });

    if (!res.ok) {
        alert('❌ Save failed.');
    }
}

window.saveTags = saveTags;
window.select = select;

load();
window.removeCustomFilterTag = function (tag) {
    customFilter = customFilter.filter((t) => t !== tag);
    render();
};

window.clearCustomFilter = function () {
    customFilter = [];
    render();
};

window.showCustomFilterSuggestions = function (input) {
    const val = input.value.trim().toLowerCase();
    const suggestions = allTags.filter((t) =>
        t.toLowerCase().startsWith(val) && !customFilter.includes(t)
    );
    const container = input.nextElementSibling;
    if (!val || suggestions.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = suggestions.slice(0, 5).map((s) =>
        `<div class="bg-primary text-light px-2 py-1 mb-1 rounded" style="cursor:pointer;" onclick="selectCustomFilterSuggestion('${s}', this)">${s}</div>`
    ).join('');
};

window.selectCustomFilterSuggestion = function (tag, _element) {
    if (!customFilter.includes(tag)) {
        customFilter.push(tag);
        render();
    }
};

window.customFilterInputKey = function (e, input) {
    if (e.key === 'Enter') {
        const tag = input.value.trim();
        if (tag && !customFilter.includes(tag)) {
            customFilter.push(tag);
            render();
        }
        input.value = '';
        input.nextElementSibling.innerHTML = '';
        e.preventDefault();
    }
};

function select(tag) {
    selected = selected === tag ? '' : tag;
    customFilter = []; // Clear custom filter when using quick filter
    render();
}

window.saveTags = saveTags;
window.select = select;

load();
