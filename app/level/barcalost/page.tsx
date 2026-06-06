import "../backlink.css";

export default function BarcaLostPage() {
  return (
    <main className="creepy-page">
      <div className="creepy-overlay" />

      <section className="cipher-card">
        <h1 className="cipher-title">
          movie time?
        </h1>

        <p className="cipher-text">
          2LJ76emG
        </p>
        <audio controls className="audio-player">
          <source src="/images/material/audio.wav" type="audio/wav" />
          Your browser does not support the audio element.
        </audio>

      </section>
    </main>
  );
}