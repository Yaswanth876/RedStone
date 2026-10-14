import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext.jsx';
import { PreferencesProvider } from '../features/settings/PreferencesContext.jsx';
import { router } from './router';

export function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <RouterProvider router={router} />
      </PreferencesProvider>
    </AuthProvider>
  );
}

export default App;
