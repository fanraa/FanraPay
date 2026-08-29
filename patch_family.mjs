import fs from 'fs';
let content = fs.readFileSync('src/components/Family.tsx', 'utf8');

// Add imports
if (!content.includes('../lib/firebase')) {
  content = content.replace(
    "import React, { useState } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { loginWithGoogle, logout, auth } from '../lib/firebase';\nimport { onAuthStateChanged } from 'firebase/auth';"
  );
}

// Add state for user
if (!content.includes('const [user, setUser]')) {
  content = content.replace(
    "const handleGoogleLogin =",
    `const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      if (user) {
        await logout();
      } else {
        await loginWithGoogle();
        alert("Berhasil login! Sinkronisasi otomatis ke cloud aktif.");
      }
    } catch (error) {
      alert("Gagal login. Pastikan popup tidak diblokir.");
    }
  };
  
  // ignore old function definition:
  const handleGoogleLogin_old =`
  );
}

// Update the login button text dynamically
content = content.replace(
  "{/* Akses Keluarga - Owner Only */}",
  `{/* Akses Keluarga - Owner Only */}`
);

// We need to change the button text to 'Logout' if user exists, or 'Login dengan Google'
content = content.replace(
  "Login dengan Google",
  "{user ? `Logout dari ${user.email}` : 'Login dengan Google'}"
);

fs.writeFileSync('src/components/Family.tsx', content);
