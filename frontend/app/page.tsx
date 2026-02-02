// Alpha-1: Read-only API
// No mutations allowed by design

type Case = {
  id: string;
  brand_name: string;
  product_category: string;
  issue_summary: string;
  confidence_level: string;
  status: string;
};
export default async function HomePage() {
  const res = await fetch(
    "https://after-sales-backend.onrender.com/cases",
    {
      cache: "no-store",
    }
  );

  const cases = await res.json();

  return (
    <main style={{ padding: "2rem" }}>
      <h1>ConsuMaarg — Alpha 1</h1>
      <p>Verified consumer after-sales issues (read-only)</p>

      <ul>
        {cases.map((c: Case) => (
          <div key={c.id}>
            <strong>{c.brand_name}</strong> — {c.product_category}
            <br />
            <em>{c.issue_summary}</em>
            <br />
            Status: {c.status} | Confidence: {c.confidence_level}
          </div>
        ))}
      </ul>
    </main>
  );
}
