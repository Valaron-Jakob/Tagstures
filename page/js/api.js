export async function loadMetadata() {
    const res = await fetch('/api/metadata');
    if (!res.ok) throw new Error('Failed to load metadata');
    return await res.json();
}

export async function saveTags(metadata) {
    const res = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata, null, 2),
    });

    if (!res.ok) {
        alert('❌ Save failed.');
    }
}
