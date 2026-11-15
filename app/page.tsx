import Home from './home';
import { publicCatalog } from '../lib/catalog';
export default function Page() { return <Home categories={publicCatalog()}/>; }
