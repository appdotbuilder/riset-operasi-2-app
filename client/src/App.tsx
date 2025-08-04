
import { useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { LoginForm } from '@/components/LoginForm';
import { StudentRegisterForm } from '@/components/StudentRegisterForm';
import { LecturerRegisterForm } from '@/components/LecturerRegisterForm';
import { StudentDashboard } from '@/components/StudentDashboard';
import { LecturerDashboard } from '@/components/LecturerDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Users, BookOpen, LogOut } from 'lucide-react';
import type { User } from '../../server/src/schema';

type AuthMode = 'login' | 'register-student' | 'register-lecturer';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await trpc.login.mutate({ identifier, password });
      setUser(result);
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login gagal. Periksa kembali kredensial Anda.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStudentRegister = useCallback(async (data: {
    name: string;
    nim: string;
    attendance_number: number;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      await trpc.registerStudent.mutate(data);
      alert('Registrasi berhasil! Silakan login.');
      setAuthMode('login');
    } catch (error) {
      console.error('Student registration failed:', error);
      alert('Registrasi gagal. Periksa kembali data Anda.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLecturerRegister = useCallback(async (data: {
    name: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      await trpc.registerLecturer.mutate(data);
      alert('Registrasi dosen berhasil! Silakan login.');
      setAuthMode('login');
    } catch (error) {
      console.error('Lecturer registration failed:', error);
      alert('Registrasi dosen gagal. Periksa kembali data Anda.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setAuthMode('login');
  }, []);

  // If user is logged in, show appropriate dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Riset Operasi 2</h1>
                <p className="text-sm text-gray-600">Final Exam System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {user.role === 'student' ? `Mahasiswa - ${user.nim}` : 'Dosen'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {user.role === 'student' ? (
            <StudentDashboard user={user} />
          ) : (
            <LecturerDashboard user={user} />
          )}
        </main>
      </div>
    );
  }

  // Authentication screens
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Riset Operasi 2</h1>
          <p className="text-gray-600">Final Exam System</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <Tabs value={authMode} onValueChange={(value: string) => setAuthMode(value as AuthMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login" className="text-xs">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register-student" className="text-xs">
                  Daftar Mahasiswa
                </TabsTrigger>
                <TabsTrigger value="register-lecturer" className="text-xs">
                  Daftar Dosen
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <CardTitle className="text-xl text-center">Masuk</CardTitle>
                <CardDescription className="text-center">
                  Masukkan kredensial Anda untuk mengakses sistem
                </CardDescription>
              </TabsContent>

              <TabsContent value="register-student">
                <CardTitle className="text-xl text-center flex items-center justify-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>Registrasi Mahasiswa</span>
                </CardTitle>
                <CardDescription className="text-center">
                  Daftarkan akun mahasiswa baru
                </CardDescription>
              </TabsContent>

              <TabsContent value="register-lecturer">
                <CardTitle className="text-xl text-center flex items-center justify-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Registrasi Dosen</span>
                </CardTitle>
                <CardDescription className="text-center">
                  Daftarkan akun dosen baru
                </CardDescription>
              </TabsContent>
            </Tabs>
          </CardHeader>

          <CardContent>
            <Tabs value={authMode}>
              <TabsContent value="login">
                <LoginForm onLogin={handleLogin} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="register-student">
                <StudentRegisterForm onRegister={handleStudentRegister} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="register-lecturer">
                <LecturerRegisterForm onRegister={handleLecturerRegister} isLoading={isLoading} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>🎓 Sistem Ujian Akhir - Riset Operasi 2</p>
        </div>
      </div>
    </div>
  );
}

export default App;
