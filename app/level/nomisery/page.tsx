import "../backlink.css";

export default function MissingPage() {
  return (
    <>
    <div
        dangerouslySetInnerHTML={{
          __html: `<!-- pinkie pie got cure from who? -->`,
        }}
      />
    <main className="creepy-page">
      <section className="creepy-card">
        <div className="creepy-list">
          <div className="creepy-row">Please cure my dear Twilight Sparkle</div>
        </div>
      </section>
    </main>
    </>
  );
}