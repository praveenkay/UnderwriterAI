import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Shield, Users } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(credentials);
      if (!success) {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'standard_user' | 'external_broker') => {
    setIsLoading(true);
    setError('');

    const demoCredentials = {
      admin: { username: 'admin@company.com', password: 'admin123' },
      standard_user: { username: 'user@company.com', password: 'user123' },
      external_broker: { username: 'broker@external.com', password: 'broker123' }
    };

    try {
      const success = await login(demoCredentials[role]);
      if (!success) {
        setError('Demo login failed');
      }
    } catch (err) {
      setError('Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AI Underwriter</h1>
          <p className="text-gray-600 mt-2">Intelligent underwriting decisions powered by AI</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="demo">Demo Access</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username / Email</Label>
                    <Input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      placeholder="Enter your username or email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demo">
            <Card>
              <CardHeader>
                <CardTitle>Demo Access</CardTitle>
                <CardDescription>
                  Try the platform with different user roles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => handleDemoLogin('admin')}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Administrator</div>
                    <div className="text-sm text-gray-500">Full access to all features</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleDemoLogin('standard_user')}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Standard User</div>
                    <div className="text-sm text-gray-500">Standard employee access</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleDemoLogin('external_broker')}
                  disabled={isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">External Broker</div>
                    <div className="text-sm text-gray-500">Limited access to chat and policies</div>
                  </div>
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gray-500">
          <p>© 2025 UnderwriterAI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
