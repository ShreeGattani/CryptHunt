import "../backlink.css";

export default function ChikuPage() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `<!-- "The detective hid everything in one place." -->`,
        }}
      />
      <main className="creepy-page">
        <section className="creepy-card">
          <img
            src="/images/chiku.jpeg"
            alt="Cricket ground"
            style={{ width: "100%", display: "block" }}
          />
        </section>
      </main>
    </>
  );
}
