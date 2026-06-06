import type { Metadata } from "next";
import "../backlink.css";

export const metadata: Metadata = {
  title: "STATION 87.9",
};

export default function Station879Page() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <!-- it is not what you hear. it is what you see. -->
            <!-- not every story begins in the forest -->
            <!-- find the observer -->
            <!-- some transmissions are visual -->
          `,
        }}
      />
      <main className="creepy-page">
        <section className="creepy-card">
          <h1 className="creepy-title">STATION 87.9</h1>

          <div className="creepy-list">
            <div className="creepy-row" style={{ opacity: 0.35, letterSpacing: "1px" }}>
              &#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;
            </div>
            <div className="creepy-row">
              <strong>STATION 87.9 MHz</strong>
            </div>
            <div className="creepy-row">
              <strong>STATUS:</strong>&nbsp;DEAD
            </div>
            <div className="creepy-row">
              <strong>LAST SIGNAL:</strong>&nbsp;RECORDED
            </div>
            <div className="creepy-row">
              <strong>ORIGIN:</strong>&nbsp;UNKNOWN
            </div>
            <div className="creepy-row" style={{ opacity: 0.35, letterSpacing: "1px" }}>
              &#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;
            </div>
          </div>

          <p className="creepy-note">AVAILABLE FILES</p>

          <a
            href="/images/material/transmission.mp4"
            download
            className="file-card"
          >
            <div className="file-icon">&#127910;</div>
            <div className="file-info">
              <span className="file-name">transmission.mp4</span>
              <span className="file-type">VIDEO FILE</span>
            </div>
          </a>

          <a
            href="/images/material/signal.jpeg"
            download
            className="file-card"
            style={{ marginTop: "0.5rem" }}
          >
            <div className="file-icon">&#128225;</div>
            <div className="file-info">
              <span className="file-name">signal.jpeg</span>
              <span className="file-type">IMAGE FILE</span>
            </div>
          </a>

          <div className="creepy-list" style={{ marginTop: "1rem" }}>
            <div className="creepy-row" style={{ opacity: 0.35, letterSpacing: "1px" }}>
              &#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;
            </div>
            <div className="creepy-row">No further broadcasts detected.</div>
            <div className="creepy-row">Monitoring continues.</div>
            <div className="creepy-row" style={{ opacity: 0.35, letterSpacing: "1px" }}>
              &#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;&#9473;
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
