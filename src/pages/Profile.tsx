import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg">
          <div className="border-b border-gray-700 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white">Profile</h2>
                <p className="text-gray-400 text-sm">
                  Manage your account settings
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-gray-400 hover:bg-gray-700 hover:text-white"
                title="Log out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm font-medium text-gray-400">Name</p>
              <p className="text-gray-100 text-lg">{user.name}</p>
            </div>
            <div className="space-y-2 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm font-medium text-gray-400">Email</p>
              <p className="text-gray-100 text-lg">{user.email}</p>
            </div>
            <div className="space-y-2 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm font-medium text-gray-400">Account Created</p>
              <p className="text-gray-100">
                {new Date().toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
