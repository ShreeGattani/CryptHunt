import "../backlink.css";

export default function lupinoPage() {
  return (
    <>
      <div
          dangerouslySetInnerHTML={{
            __html: `<!-- just kidding the answer is lupino -->`,
          }}
        />
      <main className="creepy-page">
        <section className="creepy-card">
          <iframe
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
            title="Mitch"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block" }}
          />
        </section>
      </main>
    </>
  );
}
