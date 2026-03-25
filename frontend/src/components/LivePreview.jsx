import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, ExternalLink, AlertCircle, Loader2, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

/**
 * LIVE PREVIEW - Aperçu en direct des projets web
 * Affiche un aperçu iframe de l'application générée
 */
const LivePreview = ({ projectId, files }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deviceMode, setDeviceMode] = useState('desktop');
  const iframeRef = useRef(null);
  const { toast } = useToast();

  const deviceSizes = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' }
  };

  useEffect(() => {
    if (files && files.length > 0) {
      generatePreview();
    }
  }, [files]);

  const generatePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Vérifier si c'est un projet React/JSX
      const hasReact = files && files.some(f => 
        f.language === 'jsx' || 
        f.filename.endsWith('.jsx') || 
        f.content?.includes('import React') ||
        f.content?.includes('export default') && f.filename.endsWith('.jsx')
      );

      if (hasReact) {
        setError('⚠️ Preview non disponible pour les projets React/JSX. Les projets React nécessitent une compilation. Utilisez le bouton "Déployer" pour voir votre application en ligne.');
        setIsLoading(false);
        return;
      }

      // Chercher le fichier HTML principal
      const htmlFile = files?.find(f => 
        f.filename.endsWith('.html') && 
        f.language === 'html'
      );

      if (!htmlFile) {
        setError('Aucun fichier HTML trouvé dans les fichiers générés');
        setIsLoading(false);
        return;
      }

      let fullHtml = htmlFile.content;

      // ⭐ FIX 1: Supprimer les références à des fichiers locaux introuvables
      
      // Supprimer les liens CSS externes (locaux seulement, pas les CDN)
      fullHtml = fullHtml.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["'](?!https?:\/\/)([^"']*?)["'][^>]*>/gi, '');
      
      // Supprimer les scripts locaux (garder seulement les CDN)
      fullHtml = fullHtml.replace(/<script[^>]*src=["'](?!https?:\/\/)([^"']*?)["'][^>]*><\/script>/gi, '');
      
      // Supprimer les attributs src vides
      fullHtml = fullHtml.replace(/<script[^>]*src=["']["'][^>]*><\/script>/gi, '');

      // S'assurer que le HTML a une structure minimale
      if (!fullHtml.includes('<!DOCTYPE')) {
        fullHtml = `<!DOCTYPE html>\n${fullHtml}`;
      }
      if (!fullHtml.includes('<html')) {
        fullHtml = `<html>\n${fullHtml}\n</html>`;
      }
      if (!fullHtml.includes('<head>')) {
        fullHtml = fullHtml.replace(/<html[^>]*>/i, (match) => 
          `${match}\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>`
        );
      } else if (!fullHtml.includes('charset')) {
        fullHtml = fullHtml.replace(/<head[^>]*>/i, (match) => 
          `${match}\n<meta charset="UTF-8">`
        );
      }

      // ⭐ FIX 2: Ajouter charset UTF-8 au Blob
      const blob = new Blob([fullHtml], { 
        type: 'text/html;charset=utf-8'
      });
      const blobUrl = URL.createObjectURL(blob);
      
      // ⭐ FIX 3: Attendre que le blob soit accessible
      setTimeout(() => {
        setPreviewUrl(blobUrl);
        setIsLoading(false);
        toast({
          title: "Aperçu généré !",
          description: "Votre application HTML est maintenant visible"
        });
      }, 100);

    } catch (err) {
      console.error('Error:', err);
      setError('Erreur lors de la génération de l\'aperçu: ' + err.message);
      setIsLoading(false);
    }
  };

  const generatePreviewClientSide = () => {
    try {
      setIsLoading(true);
      setError(null);

      const numFiles = files?.length || 0;
      
      // HTML DEMO ultra-simple
      const demoHtml = `<!DOCTYPE html>
<html lang="fr">
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Aperçu</title>
    <style>
        body { 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            font-family: Arial, sans-serif;
            color: white;
            min-height: 100vh;
        }
        .box {
            background: white;
            color: #333;
            padding: 40px;
            border-radius: 12px;
            max-width: 500px;
            margin: 0 auto;
            text-align: center;
        }
        h1 { color: #667eea; margin: 0 0 20px 0; }
        p { margin: 10px 0; }
        .files { 
            font-size: 48px; 
            color: #764ba2;
            font-weight: bold;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
        }
        .btn:hover { opacity: 0.9; }
        ul { text-align: left; margin: 20px auto; display: inline-block; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="box">
        <h1>✨ Projet Généré</h1>
        <div class="files">${numFiles}</div>
        <p><strong>fichiers creés</strong></p>
        
        <h2 style="color: #667eea; margin-top: 30px;">Inclus:</h2>
        <ul>
            <li>✓ React 18</li>
            <li>✓ Vite (ultra-rapide)</li>
            <li>✓ Tailwind CSS</li>
            <li>✓ PWA (mobile)</li>
            <li>✓ SEO optimisé</li>
        </ul>
        
        <button class="btn" onclick="alert('Prêt à déployer sur Vercel/Netlify')">
            Déployer 🚀
        </button>
        
        <p style="margin-top: 30px; font-size: 12px; color: #999;">
            Aperçu généré avec succès
        </p>
    </div>
</body>
</html>`;

      // ⭐ FIX charset: Créer un blob avec le bon encoding
      const blob = new Blob([demoHtml], { 
        type: 'text/html;charset=utf-8'
      });
      const blobUrl = URL.createObjectURL(blob);
      
      // ⭐ FIX timing: Attendre que le blob soit accessible
      setTimeout(() => {
        setPreviewUrl(blobUrl);
      }, 100);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur affichage');
      setIsLoading(false);
    }
  };

  // ⭐ FIX 3: Cleanup effect - nettoyer les blob URLs
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const refreshPreview = () => {
    generatePreview();
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  if (!files || files.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 p-8">
        <div className="text-center text-slate-500">
          <Monitor className="w-16 h-16 mx-auto mb-4 text-slate-700" />
          <p className="text-lg font-semibold mb-2">Aperçu non disponible</p>
          <p className="text-sm">Générez d'abord du code pour voir l'aperçu</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Monitor className="w-5 h-5 text-purple-400" />
          <span className="text-white font-semibold">Live Preview</span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Device Mode Selector */}
          <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeviceMode('desktop')}
              className={`h-8 w-8 ${deviceMode === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeviceMode('tablet')}
              className={`h-8 w-8 ${deviceMode === 'tablet' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeviceMode('mobile')}
              className={`h-8 w-8 ${deviceMode === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={refreshPreview}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={openInNewTab}
            disabled={!previewUrl}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-auto p-4">
        {error ? (
          <div className="text-center text-slate-500">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-semibold mb-2">Erreur d'aperçu</p>
            <p className="text-sm">{error}</p>
            <Button onClick={refreshPreview} className="mt-4">
              Réessayer
            </Button>
          </div>
        ) : isLoading ? (
          <div className="text-center text-slate-500">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-purple-400" />
            <p className="text-lg font-semibold mb-2">Génération de l'aperçu...</p>
          </div>
        ) : previewUrl ? (
          <div 
            className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
            style={{
              width: deviceSizes[deviceMode].width,
              height: deviceSizes[deviceMode].height,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title="Live Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            />
          </div>
        ) : (
          <div className="text-center text-slate-500">
            <Monitor className="w-16 h-16 mx-auto mb-4 text-slate-700" />
            <p className="text-lg font-semibold mb-2">Aperçu en attente</p>
            <Button onClick={generatePreview} className="mt-4">
              Générer l'aperçu
            </Button>
          </div>
        )}
      </div>

      {/* Device info */}
      <div className="p-2 border-t border-slate-800 text-center">
        <span className="text-xs text-slate-500">
          {deviceMode === 'desktop' && '🖥️ Vue Bureau'}
          {deviceMode === 'tablet' && '📱 Vue Tablette (768x1024)'}
          {deviceMode === 'mobile' && '📱 Vue Mobile (375x667)'}
        </span>
      </div>
    </Card>
  );
};

export default LivePreview;
