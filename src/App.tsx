import { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { MainIDE } from './components/MainIDE';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#11120D',
        color: '#E6E4D9'
      }}>
        Initializing Black-bird...
      </div>
    );
  }

  return (
    <div className="app-container">
      {!session ? (
        <AuthScreen onLogin={() => { }} />
      ) : (
        <MainIDE />
      )}
    </div>
  );
}

export default App;
