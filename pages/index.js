import { useState } from 'react';

export default function Home() {
  const [doi, setDoi] = useState('');
  const [abstractText, setAbstractText] = useState('');
  const [citation, setCitation] = useState('');
  const [imageURL, setImageURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetadata = async () => {
    try {
      const response = await fetch('/api/fetch-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAbstractText(data.abstractText);
      setCitation(data.citation);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch metadata.');
    }
  };

  const generateAbstract = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/generate-abstract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi, abstractText, citation }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setImageURL(data.imageURL);
    } catch (err) {
      console.error(err);
      setError('Failed to generate visual abstract.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center">Visual Abstract Generator</h1>
      <input
        className="border p-2 w-full rounded"
        placeholder="Enter DOI URL"
        value={doi}
        onChange={(e) => setDoi(e.target.value)}
      />
      <button className="bg-blue-500 text-white p-2 rounded" onClick={fetchMetadata}>Fetch Metadata</button>
      <textarea
        className="w-full p-2 border rounded"
        placeholder="Abstract text will appear here"
        rows={5}
        value={abstractText}
        onChange={(e) => setAbstractText(e.target.value)}
      />
      <input
        className="border p-2 w-full rounded"
        placeholder="Citation will appear here"
        value={citation}
        onChange={(e) => setCitation(e.target.value)}
      />
      <button className="bg-green-500 text-white p-2 rounded" onClick={generateAbstract} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Visual Abstract'}
      </button>
      {error && <div className="text-red-500 text-center">{error}</div>}
      {imageURL && (
        <div className="mt-8 text-center">
          <img src={imageURL} className="mx-auto" alt="Generated Visual Abstract" />
        </div>
      )}
    </div>
  );
}
