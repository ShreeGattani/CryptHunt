import "../backlink.css";

export default function WardingPage() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `<!-- A1Z26 -->`,
        }}
      />
      <main className="creepy-page">
        <section className="creepy-card">
          <h1 className="creepy-title">WARD AUDIO LOG</h1>
          <div className="creepy-list">
            <div className="creepy-row">
              <audio controls style={{ width: "100%" }}>
                <source src="/images/material/ash.wav" type="audio/wav" />
                Your browser does not support audio playback.
              </audio>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
