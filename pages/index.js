import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [doi, setDoi] = useState('');
  const [abstractText, setAbstractText] = useState('');
  const [citation, setCitation] = useState('');
  const [imageURL, setImageURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-abstract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi, abstractText, citation }),
      });

      const data = await response.json();
      if (!data.imageURL) throw new Error('No image generated');
      setImageURL(data.imageURL);
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate visual abstract.');
      setImageURL(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-50 to-blue-50 flex flex-col items-center justify-start p-8">
      <h1 className="text-4xl font-bold text-center text-pink-600 mb-10">
        Visual Abstract Generator
      </h1>

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl space-y-6">
        <Input
          placeholder="Enter DOI or DOI URL"
          value={doi}
          onChange={(e) => setDoi(e.target.value)}
        />

        <textarea
          placeholder="Abstract text will appear here"
          className="w-full p-3 border border-gray-300 rounded-md"
          rows={6}
          value={abstractText}
          onChange={(e) => setAbstractText(e.target.value)}
        />

        <Input
          placeholder="Citation will appear here"
          value={citation}
          onChange={(e) => setCitation(e.target.value)}
        />

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold p-3 rounded-md"
        >
          {loading ? 'Generating...' : 'Generate Visual Abstract'}
        </Button>


{loading && (
  <div className="flex justify-center items-center mt-4">
    <svg className="animate-spin h-8 w-8 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
    </svg>
  </div>
)}

        {error && (
          <p className="text-red-500 text-center">{error}</p>
        )}
      </div>

      {imageURL && (
        <div className="mt-10 w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">Your Visual Abstract</h2>
          <img
            src={imageURL}
            alt="Visual Abstract"
            className="border rounded-lg max-w-full"
          />
        </div>
      )}
    </div>
  );
}
