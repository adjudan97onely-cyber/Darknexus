import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Globe, Loader2, CheckCircle2, XCircle, Table, FileText, Link, Image, List } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import api from '../services/axiosConfig';

const WebScraperPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [extractType, setExtractType] = useState('all');
  const [result, setResult] = useState(null);

  const extractTypes = [
    { id: 'all', name: 'Tout', icon: <Globe className="w-4 h-4" />, description: 'Texte, tableaux, liens, images, listes' },
    { id: 'text', name: 'Texte', icon: <FileText className="w-4 h-4" />, description: 'Paragraphes et contenu textuel' },
    { id: 'tables', name: 'Tableaux', icon: <Table className="w-4 h-4" />, description: 'Données tabulaires' },
    { id: 'links', name: 'Liens', icon: <Link className="w-4 h-4" />, description: 'Tous les liens HTTP' },
    { id: 'images', name: 'Images', icon: <Image className="w-4 h-4" />, description: 'Toutes les images' },
    { id: 'lists', name: 'Listes', icon: <List className="w-4 h-4" />, description: 'Listes à puces et numérotées' }
  ];

  const handleScrape = async () => {
    if (!url) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await api.post('/api/scraper/scrape', {
        url: url,
        extract_type: extractType
      });

      setResult(response.data);
      toast({
        title: "✅ Scraping réussi !",
        description: `Données extraites de ${response.data.title}`
      });
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.detail || "Erreur lors du scraping",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <Card className="bg-slate-900/50 border-slate-800 mt-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-green-400" />
            Résultats du Scraping
          </CardTitle>
          <CardDescription className="text-slate-400">
            {result.title} • {result.url}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Texte */}
          {result.text && (
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-400" />
                Texte Extrait ({result.text.length} caractères)
              </h3>
              <p className="text-slate-300 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                {result.text}
              </p>
            </div>
          )}

          {/* Paragraphes */}
          {result.paragraphs && result.paragraphs.length > 0 && (
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">
                Paragraphes ({result.paragraphs.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.paragraphs.slice(0, 5).map((p, i) => (
                  <p key={i} className="text-slate-300 text-sm">{p}</p>
                ))}
              </div>
            </div>
          )}

          {/* Tableaux */}
          {result.tables && result.tables.length > 0 && (
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <Table className="w-4 h-4 mr-2 text-purple-400" />
                Tableaux ({result.tables.length})
              </h3>
              {result.tables.slice(0, 2).map((table, i) => (
                <div key={i} className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border border-slate-700">
                    {table.headers.length > 0 && (
                      <thead className="bg-slate-700">
                        <tr>
                          {table.headers.map((h, j) => (
                            <th key={j} className="p-2 text-left text-white">{h}</th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {table.rows.slice(0, 10).map((row, j) => (
                        <tr key={j} className="border-t border-slate-700">
                          {row.map((cell, k) => (
                            <td key={k} className="p-2 text-slate-300">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Liens */}
          {result.links && result.links.length > 0 && (
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <Link className="w-4 h-4 mr-2 text-green-400" />
                Liens ({result.links.length})
              </h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {result.links.slice(0, 20).map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-blue-400 hover:text-blue-300 text-sm truncate">
                    {link.text} →
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {result.images && result.images.length > 0 && (
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <Image className="w-4 h-4 mr-2 text-pink-400" />
                Images ({result.images.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {result.images.slice(0, 12).map((img, i) => (
                  <div key={i} className="bg-slate-700 p-2 rounded text-xs">
                    <p className="text-slate-300 truncate">{img.alt || 'Image'}</p>
                    <a href={img.src} target="_blank" rel="noopener noreferrer" className="text-blue-400 truncate block">
                      {img.src}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-slate-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center space-x-2">
              <Globe className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold text-white">
                Web Scraper
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Extraire des Données Web</h1>
            <p className="text-slate-400 text-lg">Scrapez n'importe quel site web et extrayez les données structurées</p>
          </div>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Configuration du Scraping</CardTitle>
              <CardDescription className="text-slate-400">
                Entrez l'URL et choisissez le type de données à extraire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-slate-200">URL du Site Web *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Type d'extraction */}
              <div className="space-y-2">
                <Label htmlFor="extractType" className="text-slate-200">Type d'Extraction</Label>
                <Select value={extractType} onValueChange={setExtractType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {extractTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="text-white hover:bg-slate-700">
                        <div className="flex items-center space-x-2">
                          {type.icon}
                          <div>
                            <div className="font-semibold">{type.name}</div>
                            <div className="text-xs text-slate-400">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bouton */}
              <Button
                onClick={handleScrape}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scraping en cours...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Extraire les Données
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Résultats */}
          {renderResult()}
        </div>
      </div>
    </div>
  );
};

export default WebScraperPage;
