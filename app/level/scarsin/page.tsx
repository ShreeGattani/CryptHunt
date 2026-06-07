import "../backlink.css";

export default function MitchPage() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html:
            `<!-- okay sorry but what's the point if u cant dance to gallan goodiyaan DX9UyRrSPJz -->`,
        }}
      />

      <main className="creepy-page">
        <section className="creepy-card">
          <iframe
            src="https://www.instagram.com/p/DWgwqa-kyut/embed"
            title="chacha"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              width: "100%",
              aspectRatio: "16/9",
              border: "none",
              display: "block",
            }}
          />
        </section>
      </main>
    </>
  );
}
