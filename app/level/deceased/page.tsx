import type { Metadata } from "next";
import "../backlink.css";

export const metadata: Metadata = {
  title: "ROSSWOOD PARK",
};

export default function DeceasedPage() {
  return (
    <main className="creepy-page">
      <section className="creepy-card">
        <h1 className="creepy-title">CASE FILE &mdash; OPEN</h1>

        <div className="creepy-list">
          <div className="creepy-row">
            &ldquo;If he wasn&rsquo;t dead, where was he?&rdquo;
          </div>
          <div className="creepy-row" style={{ letterSpacing: "1px", color: "#aaaaaa" }}>
            VGhlIGFuc3dlciBpcyBpbiB0aGUgdGl0bGU=
          </div>
        </div>

        <p className="creepy-note">Coordinates</p>

        <div className="creepy-list">
          <div className="creepy-row">Location Last Seen:</div>
          <div className="creepy-row">33.2746, -87.5757</div>
        </div>
      </section>
    </main>
  );
}
