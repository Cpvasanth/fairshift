"use client";

import { useEffect, useState } from "react";

const tamilVoice = () => speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("ta"));

// Never read Tamil with an English voice: no Tamil voice -> stay silent (and SpeakButton hides).
export function speak(text: string) {
  if (typeof speechSynthesis === "undefined") return;
  const voice = tamilVoice();
  if (!voice) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ta-IN";
  u.voice = voice;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

export default function SpeakButton({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const check = () => setOk(!!tamilVoice());
    const t = setTimeout(check, 0);
    speechSynthesis.addEventListener("voiceschanged", check);
    return () => {
      clearTimeout(t);
      speechSynthesis.removeEventListener("voiceschanged", check);
    };
  }, []);
  if (!ok) return null;
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      className="min-h-12 rounded-lg bg-green-800 px-4 py-3 font-semibold text-white"
    >
      <span aria-hidden="true">🔊 </span>
      {label}
    </button>
  );
}
