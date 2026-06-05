import "../backlink.css";

export default function GermanyPage() {
  return (
    <main className="creepy-page">
      <section className="creepy-card">
        <h1 className="creepy-title">CLASSIFIED TRANSMISSION</h1>

        <div className="creepy-list">
          <div className="creepy-row">Legenden sterben nicht,</div>
          <div className="creepy-row">wenn sie wahr sind.</div>

          <div className="creepy-row" style={{ opacity: 0.4 }}>—</div>

          <div className="creepy-row">Sie sterben,</div>
          <div className="creepy-row">wenn niemand mehr an sie glaubt.</div>

          <div className="creepy-row" style={{ opacity: 0.4 }}>...</div>

          <div className="creepy-row">Eine S&#228;ngerin hat Beliebers.</div>

          <div className="creepy-row" style={{ opacity: 0.4 }}>—</div>

          <div className="creepy-row">
            Eine Legende hat{" "}
            <span className="redacted">&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;</span>
          </div>
        </div>
      </section>
    </main>
  );
}
