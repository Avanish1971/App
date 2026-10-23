import { isMobileView } from './lib/auth';
import AdminApp from './AdminApp';
import MobileApp from './MobileApp';

// Phone ka app (ya ?view=mobile) => employee wala hissa, baaki sab => admin website
export default function App() {
  return isMobileView() ? <MobileApp /> : <AdminApp />;
}
