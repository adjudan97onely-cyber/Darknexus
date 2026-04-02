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
  const [deviceMode, setDeviceMode] = useState('desktop'); // desktop, tablet, mobile
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

  const generatePreview = () => {
    try {
      setIsLoading(true);
      setError(null);

      // Trouver le fichier HTML principal
      const htmlFile = files.find(f => 
        f.filename === 'index.html' || 
        f.filename.endsWith('.html')
      );

      if (!htmlFile) {
        setError('Aucun fichier HTML trouvé pour l\'aperçu');
        setIsLoading(false);
        return;
      }

      // Trouver les fichiers CSS et JS
      const cssFiles = files.filter(f => f.language === 'css');
      const jsFiles = files.filter(f => f.language === 'javascript' || f.language === 'js');

      // Construire le HTML complet avec CSS et JS injectés
      let fullHtml = htmlFile.content;

      // Injecter le CSS
      if (cssFiles.length > 0) {
        const cssContent = cssFiles.map(f => f.content).join('\n');
        const styleTag = `<style>${cssContent}</style>`;
        
        if (fullHtml.includes('</head>')) {
          fullHtml = fullHtml.replace('</head>', `${styleTag}\n</head>`);
        } else {
          fullHtml = `<head>${styleTag}</head>${fullHtml}`;
        }
      }

      // Injecter le JavaScript
      if (jsFiles.length > 0) {
        const jsContent = jsFiles.map(f => f.content).join('\n');
        const scriptTag = `<script>${jsContent}</script>`;
        
        if (fullHtml.includes('</body>')) {
          fullHtml = fullHtml.replace('</body>', `${scriptTag}\n</body>`);
        } else {
          fullHtml = `${fullHtml}\n${scriptTag}`;
        }
      }

      // Créer un blob URL
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      setIsLoading(false);

      toast({
        title: "Aperçu généré !",
        description: "Votre application est maintenant visible"
      });

    } catch (err) {
      console.error('Error generating preview:', err);
      setError('Erreur lors de la génération de l\'aperçu');
      setIsLoading(false);
    }
  };

  const refreshPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
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
              sandbox="allow-scripts allow-same-origin allow-forms"
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
