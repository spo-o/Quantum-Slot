import { useState, useRef } from "react";
import "./index.css";
import jackpotSound from "./assets/floraphonic-playful-casino-slot-machine-jackpot-3-183921.mp3";

const symbols = ["🍒","💎","7️⃣","🍀","⭐","🔔","🍉","🍇","💰","🃏"];

export default function App() {
  const [reels, setReels] = useState(["?", "?", "?"]);
  const [spinning, setSpinning] = useState(false);
  const [jackpot, setJackpot] = useState(false);

  const [entropy, setEntropy] = useState("");
  const [source, setSource] = useState("");
  const [hash, setHash] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [mapping, setMapping] = useState(null);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const generateHash = async (input) => {
    const data = new TextEncoder().encode(input);
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const fetchEntropy = async () => {
    const res = await fetch("https://quantum-slot.onrender.com/entropy");
  
    if (!res.ok) {
      throw new Error("Quantum fetch failed");
    }
  
    const data = await res.json();
  
    if (!data.entropy || data.entropy.length < 3) {
      throw new Error("Invalid entropy");
    }
  
    setSource(data.source);
    setTimestamp(data.timestamp);
    return data.entropy;
  };

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const spin = async () => {
    if (spinning) return; // prevent double click

    setSpinning(true);
    setJackpot(false);

    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // start spinning
    intervalRef.current = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
    }, 80);

    let ent;

try {
  ent = await fetchEntropy();
} catch (e) {
  console.error("Quantum failed:", e);

  // stop spinning 
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  setSpinning(false);
  return;
}
setEntropy(ent);

// create visible hash for UI
const h = await generateHash(ent.join("-"));
setHash(h);

// mapping from quantum entropy
const final = [
  symbols[ent[0] % symbols.length],
  symbols[(ent[1] + ent[3]) % symbols.length],
  symbols[(ent[2] + ent[5]) % symbols.length],
];
setMapping({
  inputs: [ent[0], ent[1], ent[2]],
  outputs: final,
});
 // stagger stops
    setTimeout(() => {
      setReels((r) => [final[0], r[1], r[2]]);
    }, 1000);

    setTimeout(() => {
      setReels((r) => [final[0], final[1], r[2]]);
    }, 1500);

    setTimeout(() => {
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setReels(final);
      setSpinning(false);

      if (final[0] === final[1] && final[1] === final[2]) {
        setJackpot(true);
        playSound();
      }
    }, 2000);
  };

  return (
    <div className={`app ${jackpot ? "jackpot-bg shake" : ""}`}>
      <div className="overlay"></div>
  
      <div className="main-card">
        <h1 className="title">Quantum Slot Machine</h1>
  
        <div className="slot">
          {reels.map((r, i) => (
            <div
              key={i}
              className={`reel ${spinning ? "spin" : ""} ${jackpot ? "win" : ""}`}
            >
              {r}
            </div>
          ))}
        </div>
  
        <button className="spin-btn" onClick={spin}>
          🎰 Spin
        </button>
  
        {/* CONFETTI */}
        {jackpot && (
          <div className="confetti">
            {Array.from({ length: 200 }).map((_, i) => (
              <span
                key={i}
                style={{
                  left: `${Math.random() * 100}%`,
                  background: `hsl(${Math.random() * 360},100%,50%)`,
                  animationDelay: `${Math.random()}s`,
                }}
              />
            ))}
          </div>
        )}
  
        <audio ref={audioRef} src={jackpotSound} />
  
        {entropy && (
          <div className="panel">
            <p><b>Entropy:</b> {entropy.slice(0, 10).join(", ")}</p>
            <p><b>Source:</b> {source}</p>
            <p><b>Proof Hash:</b> {hash.slice(0, 16)}...</p>
            <p><b>Quantum Pulse:</b> {timestamp}</p>
            <p><b>Spin Time:</b> {new Date().toLocaleTimeString()}</p>
            {mapping && (<p style={{ fontSize: "13px", opacity: 0.8 }}>
            <b>Mapping:</b>{" "}
                {mapping.inputs.map((val, i) => (
                <span key={i}>
                {val} → {mapping.outputs[i]}{" "}
                </span>))}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}