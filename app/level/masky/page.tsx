import "../backlink.css";

export default function MaskyPage() {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: `<!-- something is not right here -->`,
        }}
      />
      <main className="creepy-page">
        <section className="creepy-card">
          <h1 className="creepy-title">SUBJECT FILE</h1>

          <div className="creepy-list">
            <div className="creepy-row">
              <strong>Name:</strong>&nbsp;Masky
            </div>
            <div className="creepy-row">
              <strong>Identity:</strong>&nbsp;Tim Wright
            </div>

            <div className="creepy-row">
              <strong>Known Aliases</strong>
            </div>
            <div className="creepy-row">Masky</div>
            <div className="creepy-row">The Masked Figure</div>

            <div className="creepy-row">
              <strong>First Appearance:</strong>&nbsp;Entry 16
            </div>

            <div className="creepy-row">
              <strong>Associated Locations</strong>
            </div>
            <div className="creepy-row">Rosswood Park</div>
            <div className="creepy-row">Abandoned House</div>
            <div className="creepy-row">Tunnel Site</div>

            <div className="creepy-row">
              <strong>Observed Behaviour</strong>
            </div>
            <div className="creepy-row">
              Frequently appears near missing persons reports.
            </div>
            <div className="creepy-row">
              Often follows subjects without direct interaction.
            </div>
            <div className="creepy-row">
              Repeatedly documented carrying a mask and camera equipment.
            </div>

            <div className="creepy-row">
              <strong>Known Associations</strong>
            </div>
            <div className="creepy-row">The Operator</div>
            <div className="creepy-row">Jay Merrick</div>
            <div className="creepy-row">Alex Kralie</div>

            <div className="creepy-row">
              <strong>Physical Description</strong>
            </div>
            <div className="creepy-row">Male.</div>
            <div className="creepy-row">Average height.</div>
            <div className="creepy-row">Typically wears a hooded jacket.</div>
            <div className="creepy-row">
              Face concealed behind a white mask.
            </div>

            <div className="creepy-row">
              <strong>Threat Assessment:</strong>&nbsp;High
            </div>
            <div className="creepy-row">
              <strong>Status:</strong>&nbsp;Deceased
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
