// Pages whose full feature set arrives in later phases; each already has its route.
import { Link } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';

export function NotFound() {
  return (
    <>
      <PageHead title="Ez az oldal nincs a térképen" lead="Lehet, hogy elírás van a címben." />
      <Link className="btn primary" to="/">
        Vissza a kezdőlapra
      </Link>
    </>
  );
}
