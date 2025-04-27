export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { doi } = req.body;
  if (!doi) return res.status(400).json({ error: 'Missing DOI' });

  try {
    const doiClean = doi.trim().replace(/^https?:\/\//, '').replace('doi.org/', '');
    const url = `https://api.crossref.org/works/${doiClean}`;
    const response = await fetch(url);
    const data = await response.json();

    const title = data?.message?.title?.[0] || 'Untitled';
    const abstractText = data?.message?.abstract || 'No abstract available.';
    const citation = `${title}. ${data?.message?.containerTitle?.[0] || ''} ${data?.message?.issued?.['date-parts']?.[0]?.[0] || ''}.`;

    res.status(200).json({ abstractText, citation });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve article metadata.' });
  }
}
