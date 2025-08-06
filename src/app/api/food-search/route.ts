export const dynamic = "force-dynamic"; // For hot reload/dev

const CLIENT_ID = process.env.NEXT_PUBLIC_FATSECRET_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_FATSECRET_CLIENT_SECRET;
console.log("FatSecret ID:", process.env.NEXT_PUBLIC_FATSECRET_CLIENT_ID);
console.log("FatSecret SECRET:", process.env.NEXT_PUBLIC_FATSECRET_CLIENT_SECRET);


let cachedToken: { value: string; expires: number } | null = null;

async function getToken() {
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.value;
  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=basic",
  });
  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return Response.json({ error: "Missing query" }, { status: 400 });
  const token = await getToken();
  const params = new URLSearchParams();
params.append("method", "foods.search");
params.append("search_expression", q);
params.append("format", "json");


const searchRes = await fetch(
  "https://platform.fatsecret.com/rest/server.api",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  }
);

  const data = await searchRes.json();
  console.log("FatSecret API data:", data);

  return Response.json(data.foods ? data.foods.food : []);
}
