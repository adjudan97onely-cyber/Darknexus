import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Sparkles, Zap, Code2, Rocket, ChevronRight, Globe, Database, Cpu, Mic, LogOut } from 'lucide-react';
import { projectTypes, templates } from '../mock/mockData';
import { useToast } from '../hooks/use-toast';

const HomePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({
      title: "✅ Déconnexion réussie",
      description: "À bientôt !"
    });
    navigate('/login');
  };

  const features = [
  {
    icon: Sparkles,
    title: 'Multi-IA Expert',
    description: '6 modèles IA de pointe : GPT-5, Claude 4, Gemini 3 avec fallback automatique'
  },
  {
    icon: Zap,
    title: 'Génération Ultra-Rapide',
    description: 'Code généré en quelques secondes par IA avancée'
  },
  {
    icon: Code2,
    title: 'Multi-Langages',
    description: 'Python, JavaScript, React, APIs, Scripts et plus encore'
  },
  {
    icon: Rocket,
    title: 'Templates Prêts',
    description: 'Bibliothèque de templates pour démarrer instantanément'
  }];


  const stats = [
  { icon: Globe, label: 'Types de Projets', value: '6+' },
  { icon: Code2, label: 'Langages Supportés', value: '10+' },
  { icon: Database, label: 'Templates', value: '50+' },
  { icon: Cpu, label: 'Modèles IA Experts', value: '6' }];


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header/Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                CodeForge AI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/voice-assistant')} 
                className="text-slate-300 hover:text-white transition-colors"
              >
                <Mic className="w-4 h-4 mr-2" />
                Assistant Vocal
              </Button>
              <Button variant="ghost" onClick={() => navigate('/projects')} className="text-slate-300 hover:text-white transition-colors">
                Mes Projets
              </Button>
              <Button onClick={() => navigate('/create')} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 shadow-lg shadow-purple-500/25">
                <Sparkles className="w-4 h-4 mr-2" />
                Créer un Projet
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout} 
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20 transition-colors">
            ✨ Nouveau : Multi-IA Expert (GPT-5, Claude 4, Gemini 3)
          </Badge>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent leading-tight">ADJ KILLAGAIN IA 2.0

          </h1>
          <p className="text-xl text-slate-400 mb-8 leading-relaxed">
            Génération illimitée de code par IA. Web apps, scripts Python, automatisation Excel, 
            applications IA et plus encore. Aucune limite de crédits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/create')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 transition-all duration-300 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105">
              <Rocket className="w-5 h-5 mr-2" />
              Commencer Maintenant
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/projects')}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-lg px-8 py-6 transition-all duration-300">

              Voir les Exemples
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) =>
          <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center hover:bg-slate-900 transition-all duration-300 hover:border-purple-500/30">
              <stat.icon className="w-8 h-8 mx-auto mb-3 text-purple-400" />
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Pourquoi CodeForge AI ?</h2>
          <p className="text-slate-400 text-lg">La plateforme la plus puissante pour générer du code</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) =>
          <Card key={index} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Project Types Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Types de Projets Supportés</h2>
          <p className="text-slate-400 text-lg">De tout, pour tous vos besoins</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {projectTypes.map((type) =>
          <Card key={type.id} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900 transition-all duration-300 hover:border-purple-500/30 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1" onClick={() => navigate('/create', { state: { selectedType: type.id } })}>
              <CardHeader>
                <div className="text-4xl mb-3">{type.icon}</div>
                <CardTitle className="text-white">{type.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 mb-4">{type.description}</CardDescription>
                <div className="flex flex-wrap gap-2">
                  {type.stacks.map((stack, idx) =>
                <Badge key={idx} variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
                      {stack}
                    </Badge>
                )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Popular Templates */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Templates Populaires</h2>
          <p className="text-slate-400 text-lg">Démarrez avec un template pré-configuré</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {templates.map((template) =>
          <Card key={template.id} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900 transition-all duration-300 hover:border-purple-500/30 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1" onClick={() => navigate('/create', { state: { templateId: template.id } })}>
              <CardHeader>
                <CardTitle className="text-white text-lg">{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 mb-4">{template.description}</CardDescription>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                    {template.type}
                  </Badge>
                  <div className="flex items-center text-sm text-slate-500">
                    <Sparkles className="w-4 h-4 mr-1" />
                    {template.popularity}%
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4">Prêt à Créer ?</h2>
          <p className="text-slate-300 text-lg mb-8">
            Rejoignez des milliers de créateurs qui utilisent CodeForge AI pour donner vie à leurs idées
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/create')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-10 py-6 transition-all duration-300 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105">

            <Rocket className="w-5 h-5 mr-2" />
            Créer Mon Premier Projet
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-500">
            <p>© 2025 CodeForge AI. Générez du code sans limites.</p>
          </div>
        </div>
      </footer>
    </div>);

};

export default HomePage;