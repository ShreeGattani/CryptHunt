import "../backlink.css";

export default function GrapesPage() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <!-- The beginning of every memory matters. -->
            <!-- some collections were never archived -->
            <!-- look out for unverified docs -->
            <!-- everyone remembers the cartoons -->
            <!-- who remembers the audience? -->
          `,
        }}
      />
      <main className="creepy-page">
        <section className="creepy-card">
          <h1 className="creepy-title">THE VINEYARD</h1>

          <div className="creepy-list">
            <div className="creepy-row">The vineyard remembers.</div>
            <div className="creepy-row">
              Pictures survive longer than memories.
            </div>
          </div>

          <p className="creepy-note">
            <a
              href="https://postimg.cc/gallery/bSkPwmD"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              https://postimg.cc/gallery/bSkPwmD
            </a>
          </p>
        </section>
      </main>
    </>
  );
}
