import { serveDir } from 'https://deno.land/std@0.224.0/http/file_server.ts';

Deno.serve(async (req: Request) => {
    const url = new URL(req.url);
    const method = req.method;

    if (url.pathname === '/api/metadata') {
        if (method === 'GET') {
            try {
                let data = await Deno.readTextFile('./metadata.json');
                // Sort metadata by filename
                const metadataObj = JSON.parse(data);

                // Add missing files from /assets directory
                const assets: string[] = [];
                for await (const entry of Deno.readDir('./assets')) {
                    if (entry.isFile) assets.push(entry.name);
                }
                for (const file of assets) {
                    if (!metadataObj[file]) metadataObj[file] = { tags: [], collections: [] };
                    if (!metadataObj[file].tags) metadataObj[file].tags = [];
                    if (!metadataObj[file].collections) metadataObj[file].collections = [];
                }

                const sorted = Object.fromEntries(
                    Object.entries(metadataObj).sort(([a], [b]) => a.localeCompare(b)),
                );
                data = JSON.stringify(sorted, null, 2);

                return new Response(data, {
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (err) {
                console.error('Error reading metadata.json:', err);

                return new Response('{}', {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        if (method === 'POST') {
            try {
                const body = await req.json();
                // Add missing files from /assets directory before saving
                const assets: string[] = [];
                for await (const entry of Deno.readDir('./assets')) {
                    if (entry.isFile) assets.push(entry.name);
                }
                for (const file of assets) {
                    if (!body[file]) body[file] = { tags: [], collections: [] };
                    if (!body[file].tags) body[file].tags = [];
                    if (!body[file].collections) body[file].collections = [];
                }
                // Sort metadata by filename before saving
                const sorted = Object.fromEntries(
                    Object.entries(body).sort(([a], [b]) => a.localeCompare(b)),
                );
                await Deno.writeTextFile('metadata.json', JSON.stringify(sorted, null, 2));

                return new Response('Success', { status: 200 });
            } catch (err) {
                console.error('Error writing metadata.json:', err);

                return new Response('Error', { status: 500 });
            }
        }
    }

    // All other routs: Serve files
    return serveDir(req, {
        fsRoot: '.',
        urlRoot: '',
        showDirListing: false,
    });
});

console.log('Server running on: http://localhost:8000/');
console.log('Open webpage on: http://localhost:8000/page/index.html');
