import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Shield, ArrowLeft, Key, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast({
        title: "❌ Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "❌ Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast({
        title: "❌ Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const API_URL = 'http://localhost:5000';
      const token = localStorage.getItem('token');

      // Vérifier d'abord l'ancien mot de passe en tentant une connexion
      const user = JSON.parse(localStorage.getItem('user'));
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          password: formData.currentPassword
        })
      });

      if (!loginResponse.ok) {
        toast({
          title: "❌ Erreur",
          description: "Mot de passe actuel incorrect",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Appeler l'API de changement de mot de passe
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du changement de mot de passe');
      }

      toast({
        title: "✅ Succès",
        description: "Mot de passe changé avec succès"
      });

      // Réinitialiser le formulaire
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Rediriger vers la page d'accueil après 2 secondes
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Erreur lors du changement de mot de passe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-red-500" />
              <span className="text-lg font-semibold text-red-400">Admin Only</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                  <Key className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl">Paramètres Admin</CardTitle>
                  <CardDescription className="text-slate-400">
                    Changer votre mot de passe (Zone sécurisée)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Mot de passe actuel */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-slate-300">
                    Mot de passe actuel
                  </Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Entrez votre mot de passe actuel"
                    required
                  />
                </div>

                {/* Nouveau mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-300">
                    Nouveau mot de passe
                  </Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Minimum 8 caractères"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Utilisez un mot de passe fort avec majuscules, minuscules, chiffres et symboles
                  </p>
                </div>

                {/* Confirmation */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">
                    Confirmer le nouveau mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Retapez le nouveau mot de passe"
                    required
                  />
                  {formData.newPassword && formData.confirmPassword && (
                    <div className="flex items-center space-x-2 text-sm">
                      {formData.newPassword === formData.confirmPassword ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">Les mots de passe correspondent</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-500">Les mots de passe ne correspondent pas</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Bouton */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
                >
                  {loading ? 'Changement en cours...' : 'Changer le mot de passe'}
                </Button>
              </form>

              {/* Avertissement */}
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-300">
                    <p className="font-semibold mb-1">Zone Administrateur</p>
                    <p className="text-red-400/80">
                      Cette page est réservée aux administrateurs. Aucun utilisateur normal ne peut y accéder.
                      Ne partagez jamais vos identifiants admin.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
