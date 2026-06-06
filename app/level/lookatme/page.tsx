import "../backlink.css";

export default function CluePage() {
  const attendees = [
    "Sarah",
    "Tom",
    "Emily",
    "Grace",
    "Jacob",
    "Mason",
    "Oliver",
    "Ava",
    "Noah",
    "Lily",
    "Daniel",
  ];

  return (
    <>
      <div
  dangerouslySetInnerHTML={{
    __html: `
      <!-- everyone remembers the cartoons -->
      <!-- who remembers the audience? -->
    `,
  }}
/>

      <main className="creepy-page">
        <div className="creepy-overlay" />

        <section className="creepy-card">
          <h1 className="creepy-title">ATTENDEE LIST</h1>

          <div className="creepy-list">
            {attendees.map((name) => (
              <div key={name} className="creepy-row">
                {name}
              </div>
            ))}

            <div className="creepy-row redacted">
              ██████
            </div>
          </div>

          <p className="creepy-note">
            One name is redacted.
          </p>

          <a
            href="/images/material/attendance.xlsx"
            download
            className="file-card"
          >
            <div className="file-icon">📊</div>

            <div className="file-info">
              <span className="file-name">
                attendance.xlsx
              </span>
              <span className="file-type">
                SPREADSHEET FILE
              </span>
            </div>
          </a>
        </section>
      </main>
    </>
  );
}