export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "live", service: "medstock-web" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
