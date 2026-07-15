    const fallbackContents = {
        'Hello.js': "console.log('Hello World');",
        'fullname.js': 'let fullName = "Rahul Dravid";\nconsole.log("full name is " + fullName);',
        'age.js': 'let age = 21;\nconsole.log("My age is " + age);',
        'alert.js': "alert('See the output in the console');"
    };

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function createFileBlock(fileName, content) {
        const block = document.createElement('div');
        block.className = 'file-block';
        block.innerHTML = '<h4>' + fileName + '</h4><pre class="bg-black p-2 rounded"><code>' + escapeHtml(content) + '</code></pre>';
        return block;
    }

    async function readFileContent(fileName) {
        const candidates = [
            fileName,
            './' + fileName,
            new URL(fileName, window.location.href).toString()
        ];

        for (const url of candidates) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (response.ok) {
                    return await response.text();
                }
            } catch (error) {
                // Try the next path
            }
        }

        return fallbackContents[fileName] || '';
    }

    async function getLocalFiles() {
        const urls = [
            new URL('./', window.location.href).toString(),
            new URL('', window.location.href).toString()
        ];

        for (const url of urls) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) continue;

                const html = await response.text();
                const links = [...html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
                const jsFiles = links
                    .map(link => link.split('/').pop())
                    .filter(name => name && name.endsWith('.js') && !name.startsWith('.') && name !== 'github-auto.js');

                if (jsFiles.length > 0) {
                    return jsFiles.sort();
                }
            } catch (error) {
                // Continue to the next option
            }
        }

        return ['Hello.js', 'fullname.js', 'age.js', 'alert.js'];
    }

    async function loadFiles() {
        const container = document.getElementById('filesContainer');
        container.innerHTML = '';

        let files = ['Hello.js', 'fullname.js', 'age.js', 'alert.js'];

        try {
            const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

            if (isLocalHost) {
                files = await getLocalFiles();
            } else {
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                const repoName = pathParts[pathParts.length - 1] || 'JavaScript';
                const owner = window.location.hostname.split('.')[0];

                const response = await fetch('https://api.github.com/repos/' + owner + '/' + repoName + '/contents/', { cache: 'no-store' });
                const data = await response.json();

                if (Array.isArray(data)) {
                    files = data
                        .filter(item => item.type === 'file' && item.name.endsWith('.js') && item.name !== 'github-auto.js')
                        .map(item => item.name)
                        .sort();
                }
            }
        } catch (error) {
            console.log('Using fallback file list');
        }

        for (const fileName of files) {
            const code = await readFileContent(fileName);
            if (code) {
                container.appendChild(createFileBlock(fileName, code));
            } else {
                container.appendChild(createFileBlock(fileName, 'File not found'));
            }
        }
    }

    loadFiles();
    setInterval(loadFiles, 5000);