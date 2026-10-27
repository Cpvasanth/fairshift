"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

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

export default function SpeakButton({ text, children }: { text: string; children: ReactNode }) {
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
      className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800"
    >
      <Volume2 aria-hidden="true" className="size-5" />
      <span>{children}</span>
    </button>
  );
}
