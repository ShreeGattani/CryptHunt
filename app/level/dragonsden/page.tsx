import "../backlink.css";

export default function DragonsDenPage() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `<!--what series?-->`,
        }}
      />
      <main className="creepy-page">
        <section className="creepy-card">
          <img
            src="/images/material/dragonsden.png"
            alt="Dragons Den"
            style={{ width: "100%", display: "block" }}
          />
        </section>
      </main>
    </>
  );
}
