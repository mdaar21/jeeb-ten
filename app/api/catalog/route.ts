import { publicCatalog } from '../../../lib/catalog';
export function GET() { return Response.json(publicCatalog(), { headers: { 'Cache-Control': 'public, max-age=300' } }); }
