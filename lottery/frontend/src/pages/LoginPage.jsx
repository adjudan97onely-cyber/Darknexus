import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sparkles, Lock, Mail, Loader2, Shield } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      // Sauvegarder le token et les infos utilisateur
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast({
        title: "✅ Connexion réussie !",
        description: `Bienvenue ${response.data.user.email}`
      });

      // Rediriger vers la page d'accueil
      navigate('/');

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "❌ Erreur de connexion",
        description: error.response?.data?.detail || "Email ou mot de passe incorrect",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Login Card */}
      <Card className="relative z-10 w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Dark Nexus AI
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Connexion à votre espace personnel
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-purple-400" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200 flex items-center">
                <Lock className="w-4 h-4 mr-2 text-pink-400" />
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-purple-900/20 border border-purple-800/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-purple-300 font-semibold mb-1">
                    🔒 Connexion Sécurisée
                  </p>
                  <p className="text-xs text-slate-400">
                    Votre session est cryptée et protégée. Seul vous avez accès à cette application.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Se Connecter
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-slate-500 text-sm">
          © 2042 Dark Nexus AI - Application Privée et Sécurisée
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
