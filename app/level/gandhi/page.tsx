import "../backlink.css";

export default function GandhiPage() {
  return (
    <main className="creepy-page">
      <section className="creepy-card">
        <iframe
          src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
          title="gandhi"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block" }}
        />
      </section>
    </main>
  );
}