import "../backlink.css";

export default function NestPage() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <!-- focus on the role -->
            <!-- not the person -->
            <!-- the answer obeyed -->
            <!-- the answer served -->
          `,
        }}
      />
      <main
        className="creepy-page"
        style={{ alignItems: "flex-start", paddingTop: "2rem", paddingBottom: "2rem" }}
      >
        <section className="creepy-card">
          <div className="creepy-list">
            <div className="creepy-row">
              * The person connected to the MASK never visited the WATCHTOWER.
            </div>
            <div className="creepy-row">
              * ALEX was seen after the CAMPSITE incident but before the WATCHTOWER incident.
            </div>
            <div className="creepy-row">
              * The JOURNAL was not recovered from ROSSWOOD TUNNEL.
            </div>
            <div className="creepy-row">
              * TIM was not connected to the CAMERA.
            </div>
            <div className="creepy-row">
              * The AUDIO TAPE was recovered exactly one location after the MASK.
            </div>
            <div className="creepy-row">
              * The person connected to the ABANDONED HOUSE was not BRIAN.
            </div>
            <div className="creepy-row">
              * JAY appeared before the person associated with the JOURNAL.
            </div>
            <div className="creepy-row">
              * The WATCHTOWER incident occurred before the CAMPSITE incident.
            </div>
            <div className="creepy-row">
              * Neither TIM nor BRIAN possessed the JOURNAL.
            </div>
            <div className="creepy-row">
              * The CAMERA belonged to the final suspect in the timeline.
            </div>
            <div className="creepy-row">
              * The MASK was not recovered at the ABANDONED HOUSE.
            </div>
            <div className="creepy-row">
              * ALEX was not connected to the AUDIO TAPE.
            </div>
            <div className="creepy-row">
              * The person linked to the WATCHTOWER carried evidence recovered from a different location.
            </div>
            <div className="creepy-row">
              * Only one suspect could realistically have acted on behalf of another.
            </div>
          </div>

          <div style={{ height: "50vh" }} />

          <div className="creepy-list">
            <div className="creepy-row">The detective concluded</div>
            <div className="creepy-row">the figure was never acting alone.</div>
            <div className="creepy-row" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}>
              The suspect was?
            </div>
          </div>

          <img
            src="/images/material/evidence.png"
            alt="Evidence"
            style={{ width: "100%", display: "block", marginTop: "1rem" }}
          />
        </section>
      </main>
    </>
  );
}
