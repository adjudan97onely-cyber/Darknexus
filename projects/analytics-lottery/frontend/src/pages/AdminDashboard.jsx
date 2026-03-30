import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stats');

  // Vérifier si on a un token stocké
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      loadStats(storedToken);
    }
  }, []);

  const handleLoginAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/admin/login', {
        password: password,
        email: 'admin@analytics-lottery.com'
      });

      if (response.data.access_token) {
        localStorage.setItem('admin_token', response.data.access_token);
        setToken(response.data.access_token);
        setIsLoggedIn(true);
        setPassword('');
        await loadStats(response.data.access_token);
      }
    } catch (err) {
      setError('Mot de passe admin incorrect');
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (adminToken) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };

      // Charger les stats
      const statsRes = await api.get('/api/admin/stats', { headers });
      setStats(statsRes.data?.stats || null);

      // Charger les prédictions
      const predsRes = await api.get('/api/admin/predictions?limit=20', { headers });
      setPredictions(Array.isArray(predsRes.data?.predictions) ? predsRes.data.predictions : []);

      // Charger la performance
      const perfRes = await api.get('/api/admin/performance?days=7', { headers });
      setPerformance(perfRes.data?.performance || null);

      // Charger info DB
      const dbRes = await api.get('/api/admin/database-info', { headers });
      setDbInfo(dbRes.data?.database || null);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    setIsLoggedIn(false);
    setPassword('');
    setStats(null);
    setPredictions([]);
    setPerformance(null);
    setDbInfo(null);
  };

  const handleResetModels = async () => {
    if (!window.confirm('⚠️ Êtes-vous sûr? Cette action est irréversible!')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/admin/reset-models', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ ' + response.data.message);
      await loadStats(token);
    } catch (err) {
      setError('Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/admin/export-data', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Télécharger le fichier JSON
      const dataStr = JSON.stringify(response.data.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export-${new Date().toISOString()}.json`;
      link.click();

      alert('✅ Données exportées');
    } catch (err) {
      setError('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h1>🔐 ADMIN DASHBOARD</h1>
          <form onSubmit={handleLoginAdmin}>
            <div className="form-group">
              <label>Mot de passe Admin:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe"
                disabled={loading}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Connexion...' : '✅ Se connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>🔐 ADMIN DASHBOARD</h1>
        <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
      </header>

      <nav className="admin-tabs">
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Stats
        </button>
        <button
          className={activeTab === 'predictions' ? 'active' : ''}
          onClick={() => setActiveTab('predictions')}
        >
          🎯 Prédictions
        </button>
        <button
          className={activeTab === 'database' ? 'active' : ''}
          onClick={() => setActiveTab('database')}
        >
          🗄️ Base de données
        </button>
        <button
          className={activeTab === 'tools' ? 'active' : ''}
          onClick={() => setActiveTab('tools')}
        >
          ⚙️ Outils
        </button>
      </nav>

      <main className="admin-content">
        {error && <div className="error-message">{error}</div>}

        {activeTab === 'stats' && stats && (
          <section className="stats-section">
            <h2>📊 Statistiques Globales</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <label>Total Prédictions</label>
                <value>{stats.total_predictions}</value>
              </div>
              <div className="stat-card">
                <label>Prédictions Gagnantes</label>
                <value>{stats.winning_predictions}</value>
              </div>
              <div className="stat-card">
                <label>Taux de Précision</label>
                <value>{stats.accuracy_rate}%</value>
              </div>
              <div className="stat-card">
                <label>Modèles Entraînés</label>
                <value>{stats.models_trained}</value>
              </div>
            </div>

            {performance && (
              <div className="performance-section">
                <h3>📈 Performance (7 derniers jours)</h3>
                <div className="perf-grid">
                  <div className="perf-item">
                    <span>Total:</span>
                    <strong>{performance.total_predictions}</strong>
                  </div>
                  <div className="perf-item">
                    <span>Gagnantes:</span>
                    <strong className="success">{performance.winning}</strong>
                  </div>
                  <div className="perf-item">
                    <span>Perdantes:</span>
                    <strong className="error">{performance.losing}</strong>
                  </div>
                  <div className="perf-item">
                    <span>Accuracy:</span>
                    <strong>{performance.accuracy}%</strong>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'predictions' && (
          <section className="predictions-section">
            <h2>🎯 Dernières Prédictions</h2>
            <table className="predictions-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Valeurs</th>
                  <th>Confiance</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {predictions.slice(0, 20).map((pred, idx) => (
                  <tr key={idx}>
                    <td>{pred.type}</td>
                    <td>{JSON.stringify(pred.values).slice(0, 50)}...</td>
                    <td>{pred.confidence}%</td>
                    <td>
                      <span className={`status-${pred.status}`}>
                        {pred.status || 'pending'}
                      </span>
                    </td>
                    <td>{new Date(pred.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'database' && dbInfo && (
          <section className="database-section">
            <h2>🗄️ Informations Base de Données</h2>
            <div className="db-grid">
              <div className="db-item">
                <label>Draws</label>
                <value>{dbInfo.draws}</value>
              </div>
              <div className="db-item">
                <label>Analysis</label>
                <value>{dbInfo.analysis}</value>
              </div>
              <div className="db-item">
                <label>Predictions</label>
                <value>{dbInfo.predictions}</value>
              </div>
              <div className="db-item">
                <label>Models</label>
                <value>{dbInfo.models}</value>
              </div>
              <div className="db-item highlight">
                <label>Total Documents</label>
                <value>{dbInfo.total_documents}</value>
              </div>
            </div>
            <p className="db-status">✅ {dbInfo.status || 'Connectée'}</p>
          </section>
        )}

        {activeTab === 'tools' && (
          <section className="tools-section">
            <h2>⚙️ Outils d'Administration</h2>
            <div className="tools-buttons">
              <button
                onClick={handleExportData}
                disabled={loading}
                className="tool-btn export-btn"
              >
                📥 Exporter les données
              </button>
              <button
                onClick={handleResetModels}
                disabled={loading}
                className="tool-btn danger-btn"
              >
                🔄 Réinitialiser modèles
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="tool-btn"
              >
                ↩️ Retour à l'app
              </button>
            </div>
          </section>
        )}

        {loading && <div className="loading">⏳ Chargement...</div>}
      </main>
    </div>
  );
}
