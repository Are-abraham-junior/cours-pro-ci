import { Navigate } from 'react-router-dom';

// Redirection vers le dashboard ou la page d'auth
export default function Index() {
  return <Navigate to="/" replace />;
}
