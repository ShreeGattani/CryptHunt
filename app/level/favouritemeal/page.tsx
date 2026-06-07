import "../backlink.css";

export default function MenuPage() {
  const menuItems = [
    "BURGER",
    "PIZZA",
    "FRIES",
    "TACOS",
    "KIDNEY",
  ];

  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <!-- If Jack still had an eye in 2026,
            he would've watched her dancing in Rio.
            If he still had a life,
            it would've been a little more... -->
          `,
        }}
      />

      <main className="creepy-page">
        <div className="creepy-overlay" />

        <section className="creepy-card">
          <h1 className="creepy-title">MENU</h1>

          <div className="creepy-list">
            {menuItems.map((item) => (
              <div key={item} className="creepy-row">
                {item}
              </div>
            ))}
          </div>

          <p className="creepy-note">
            Today's special is unavailable.
          </p>
        </section>
      </main>
    </>
  );
}