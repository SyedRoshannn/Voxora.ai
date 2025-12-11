import { ReactNode } from 'react';
import { AuthProviderContent } from './AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProviderContent>
      {children}
    </AuthProviderContent>
  );
};

export * from './AuthContext';
