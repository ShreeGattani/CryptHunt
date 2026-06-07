import "../backlink.css";

export default function harryPage() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `<!-- you have been cursed -->`,
        }}
      />
      <main className="creepy-page">
        <section className="creepy-card">
          <img
            src="/images/material/dog.png"
            alt="decode"
            style={{ width: "100%", display: "block" }}
          />
        </section>
      </main>
    </>
  );
}
