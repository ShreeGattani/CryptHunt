import "../backlink.css";

export default function DragonsDenPage() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `<!-- caribbean  -->`,
        }}
      />
      <main className="creepy-page">
        <section className="creepy-card">
          <img
            src="/images/material/dcode.png"
            alt="decode"
            style={{ width: "100%", display: "block" }}
          />
        </section>
      </main>
    </>
  );
}
