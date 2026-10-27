import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthorDashboard from './components/AuthorPortal/AuthorDashboard';
import AdminDashboard from './components/AdminPortal/AdminDashboard';
import LoginModal from './components/Auth/LoginModal';
import KnowledgeBaseModal from './components/KnowledgeBaseModal';

export default function App() {
  const { user, isAdmin, isAuthor } = useAuth();
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);

  // If not logged in, show sleek login screen with 1-click demo logins
  if (!user) {
    return <LoginModal />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenKnowledgeBase={() => setShowKnowledgeBase(true)} />

      <main style={{ flex: 1 }}>
        {isAdmin ? <AdminDashboard /> : <AuthorDashboard />}
      </main>

      {showKnowledgeBase && (
        <KnowledgeBaseModal onClose={() => setShowKnowledgeBase(false)} />
      )}
    </div>
  );
}
