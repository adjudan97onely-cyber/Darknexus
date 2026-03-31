"""
GÉNÉRATEUR DE TEMPLATES STRIPE (NIVEAU E5)
Génère automatiquement des templates d'apps avec Stripe intégré
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class StripeTemplateGenerator:
    """Générateur de templates avec Stripe pré-intégré"""
    
    def __init__(self):
        self.stripe_templates = {
            'saas': {
                'name': 'SaaS avec abonnements Stripe',
                'description': 'Template complet avec authentification et abonnements mensuels',
                'features': ['Auth', 'Abonnements', 'Dashboard', 'Paiements Stripe']
            },
            'ecommerce': {
                'name': 'E-commerce avec paiements Stripe',
                'description': 'Boutique en ligne avec panier et paiements sécurisés',
                'features': ['Panier', 'Checkout Stripe', 'Gestion produits', 'Commandes']
            },
            'donation': {
                'name': 'Plateforme de dons',
                'description': 'Collecte de dons avec Stripe',
                'features': ['Dons one-time', 'Dons récurrents', 'Reçus fiscaux', 'Dashboard']
            }
        }
    
    def get_stripe_integration_code(self, template_type: str = 'saas') -> Dict[str, str]:
        """
        Retourne le code d'intégration Stripe pour un type de template
        
        Returns:
            Dict avec code frontend et backend
        """
        if template_type == 'saas':
            return self._generate_saas_stripe_code()
        elif template_type == 'ecommerce':
            return self._generate_ecommerce_stripe_code()
        elif template_type == 'donation':
            return self._generate_donation_stripe_code()
        else:
            return self._generate_saas_stripe_code()  # Défaut
    
    def _generate_saas_stripe_code(self) -> Dict[str, str]:
        """Génère le code pour un SaaS avec abonnements"""
        
        frontend_code = '''// src/components/SubscriptionPlans.jsx
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const plans = [
  { id: 'basic', name: 'Basic', price: 9.99, features: ['Feature 1', 'Feature 2'] },
  { id: 'pro', name: 'Pro', price: 29.99, features: ['All Basic', 'Feature 3', 'Feature 4'] },
  { id: 'enterprise', name: 'Enterprise', price: 99.99, features: ['All Pro', 'Feature 5', 'Support 24/7'] }
];

export default function SubscriptionPlans() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planId) => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      
      const session = await response.json();
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {plans.map(plan => (
        <div key={plan.id} className="border rounded-lg p-6 shadow-lg">
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          <p className="text-3xl font-bold mt-4">${plan.price}<span className="text-sm">/mois</span></p>
          <ul className="mt-4 space-y-2">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                {feature}
              </li>
            ))}
          </ul>
          <button 
            onClick={() => handleSubscribe(plan.id)}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'S\'abonner'}
          </button>
        </div>
      ))}
    </div>
  );
}
'''
        
        backend_code = '''# backend/stripe_routes.py
from fastapi import APIRouter, HTTPException
import stripe
import os

router = APIRouter()
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

PRICE_IDS = {
    'basic': 'price_xxxxx',  # À remplacer par vos vrais Price IDs
    'pro': 'price_yyyyy',
    'enterprise': 'price_zzzzz'
}

@router.post("/api/create-checkout-session")
async def create_checkout_session(data: dict):
    try:
        plan_id = data.get('planId')
        price_id = PRICE_IDS.get(plan_id)
        
        if not price_id:
            raise HTTPException(status_code=400, detail="Plan invalide")
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url='https://votre-app.com/success',
            cancel_url='https://votre-app.com/cancel',
        )
        
        return {"id": session.id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/webhook")
async def stripe_webhook(request):
    """Webhook pour gérer les événements Stripe"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
        )
        
        # Gérer les événements
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            # Activer l'abonnement utilisateur
            print(f"Paiement réussi: {session['id']}")
        
        return {"status": "success"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
'''
        
        env_template = '''# .env template
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Instructions:
# 1. Créez un compte sur https://stripe.com
# 2. Allez dans Dashboard → Developers → API keys
# 3. Copiez vos clés et remplacez les valeurs ci-dessus
# 4. Créez des produits et prix dans Stripe Dashboard
# 5. Remplacez les price_xxxxx dans le code backend
'''
        
        return {
            'frontend': frontend_code,
            'backend': backend_code,
            'env_template': env_template,
            'instructions': self._generate_stripe_instructions()
        }
    
    def _generate_ecommerce_stripe_code(self) -> Dict[str, str]:
        """Code simplifié pour e-commerce"""
        return {
            'frontend': '// Code e-commerce Stripe (simplifié pour E5)',
            'backend': '# Backend e-commerce avec Stripe Checkout',
            'env_template': '# Clés Stripe pour e-commerce',
            'instructions': 'Instructions e-commerce Stripe'
        }
    
    def _generate_donation_stripe_code(self) -> Dict[str, str]:
        """Code simplifié pour donations"""
        return {
            'frontend': '// Code donations Stripe (simplifié pour E5)',
            'backend': '# Backend donations avec Stripe',
            'env_template': '# Clés Stripe pour donations',
            'instructions': 'Instructions donations Stripe'
        }
    
    def _generate_stripe_instructions(self) -> str:
        """Génère les instructions d'intégration Stripe"""
        return """# 💳 Configuration Stripe

## 1. Créer un compte Stripe
- Allez sur https://stripe.com
- Créez un compte (gratuit)
- Activez le mode Test

## 2. Récupérer vos clés API
- Dashboard → Developers → API keys
- Copiez la **Publishable key** (commence par pk_test_)
- Copiez la **Secret key** (commence par sk_test_)

## 3. Créer vos produits
- Dashboard → Products
- Créez vos plans d'abonnement
- Notez les **Price IDs** (price_xxxxx)

## 4. Configuration locale
Créez un fichier `.env` :
```
VITE_STRIPE_PUBLIC_KEY=pk_test_votre_cle
STRIPE_SECRET_KEY=sk_test_votre_cle
STRIPE_WEBHOOK_SECRET=whsec_votre_secret
```

## 5. Installer les dépendances
```bash
# Frontend
yarn add @stripe/stripe-js

# Backend
pip install stripe
```

## 6. Tester
- Mode Test activé par défaut
- Utilisez la carte de test : 4242 4242 4242 4242
- N'importe quelle date future et CVC

## 7. Production
- Remplacez les clés test par les clés live
- Activez les webhooks en production
- Configurez les URLs de succès/annulation

🎉 C'est tout ! Vos paiements sont configurés.
"""
    
    def list_templates(self) -> List[Dict[str, Any]]:
        """Liste tous les templates Stripe disponibles"""
        return [
            {
                'id': template_id,
                'name': template_data['name'],
                'description': template_data['description'],
                'features': template_data['features']
            }
            for template_id, template_data in self.stripe_templates.items()
        ]


# Instance globale
stripe_template_generator = StripeTemplateGenerator()
