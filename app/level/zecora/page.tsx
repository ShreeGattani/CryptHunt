import "../backlink.css";

export default function GandhiPage() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <!-- i'm sleepy wish me a :P -->
          `,
        }}
      />

      <main className="creepy-page">
        <section className="creepy-card">
          <iframe
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
            title="rickroll"
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