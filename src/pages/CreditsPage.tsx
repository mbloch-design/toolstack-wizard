import { useEffect } from "react";

const CreditsPage = () => {
  useEffect(() => {
    document.title = "Credits & Partners — ToolTrim";
    // Ensure indexability — remove any accidental noindex set by other pages
    const existingRobots = document.querySelector('meta[name="robots"]');
    if (existingRobots) {
      existingRobots.setAttribute("content", "index, follow");
    } else {
      const meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "index, follow";
      document.head.appendChild(meta);
    }
    return () => {
      // Reset title on unmount
      document.title = "ToolTrim";
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8F8F4",
        color: "#222222",
        fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <main style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        {/* Wordmark */}
        <a
          href="https://tooltrim.com"
          style={{
            display: "inline-block",
            marginBottom: "56px",
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#222222",
            textDecoration: "none",
            opacity: 0.5,
          }}
        >
          ToolTrim
        </a>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: "0 0 40px",
            lineHeight: 1.2,
          }}
        >
          Credits &amp; Partners
        </h1>

        {/* Badge list */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <li>
            <a href="https://marketingdb.live" target="_blank" rel="noopener noreferrer">
              <img
                src="https://marketingdb.live/badge.svg"
                alt="Listed on MarketingDB"
                width="190"
                height="44"
                style={{ display: "block" }}
              />
            </a>
          </li>
        </ul>
      </main>
    </div>
  );
};

export default CreditsPage;
