import "../backlink.css";

export default function EndPage() {
  return (
    <main className="creepy-page">
      <section
        className="creepy-card"
        style={{
          width: "95vw",
          maxWidth: "1400px",
          padding: 0,
        }}
      >
        <img
          src="/images/material/end.png"
          alt="Cricket ground"
          style={{
            width: "100%",
            height: "85vh",
            objectFit: "cover",
            display: "block",
          }}
        />
      </section>
    </main>
  );
}