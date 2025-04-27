"use client";
import { useState } from "react";
import { CheckCircle, Loader2, FileImage } from "lucide-react"; // Icon library
import { Input } from "@/components/ui/input"; // Optional if you want to customize input nicely
import { Button } from "@/components/ui/button";

export default function VisualAbstractGenerator() {
  const [doi, setDoi] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState({
    summarize: false,
    generateImage: false,
    overlayQR: false,
    done: false,
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!doi) return;
    setLoading(true);
    setError(null);
    setImage(null);
    setSteps({ summarize: false, generateImage: false, overlayQR: false, done: false });

    try {
      const response = await fetch("/api/generate-abstract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doi, abstractText: "", citation: "" }), // (abstract will be fetched server-side based on DOI)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setImage(data.image);
      setSteps({ summarize: true, generateImage: true, overlayQR: true, done: true });
    } catch (err) {
      console.error("Error generating visual abstract:", err);
      setError("Failed to generate visual abstract. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-4">Visual Abstract Generator</h1>

      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Enter DOI"
          value={doi}
          onChange={(e) => setDoi(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : "Generate"}
        </Button>
      </div>

      {error && (
        <p className="text-red-500 text-center">{error}</p>
      )}

      {/* Progress Checkmarks */}
      <div className="space-y-2 pt-6">
        <StepItem label="Summarizing Abstract" active={steps.summarize} />
        <StepItem label="Generating Visual Abstract" active={steps.generateImage} />
        <StepItem label="Overlaying QR Code" active={steps.overlayQR} />
        <StepItem label="Completed" active={steps.done} />
      </div>

      {/* Final Image Display */}
      {image && (
        <div className="mt-8 text-center space-y-4">
          <h2 className="text-xl font-semibold flex items-center justify-center space-x-2">
            <FileImage className="w-6 h-6" />
            <span>Your Visual Abstract</span>
          </h2>
          <img
            src={`data:image/png;base64,${image}`}
            alt="Visual Abstract"
            className="rounded-lg shadow-md mx-auto"
          />
        </div>
      )}
    </div>
  );
}

function StepItem({ label, active }) {
  return (
    <div className="flex items-center space-x-2">
      {active ? (
        <CheckCircle className="text-green-500 w-5 h-5" />
      ) : (
        <Loader2 className="text-gray-400 w-5 h-5 animate-spin" />
      )}
      <p className={active ? "text-green-600" : "text-gray-500"}>{label}</p>
    </div>
  );
}


