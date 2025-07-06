const state = {
    metadata: {},
    selectedRows: new Set(),
    activeFilters: new Set(),
    allTags: [],
    allCollections: [],

    // Computed properties for tags and collections
    get tags() {
        const result = {};
        for (const [file, meta] of Object.entries(this.metadata)) {
            result[file] = meta.tags || [];
        }
        return result;
    },
    get collections() {
        const result = {};
        for (const [file, meta] of Object.entries(this.metadata)) {
            result[file] = meta.collections || [];
        }
        return result;
    },
};

export default state;
