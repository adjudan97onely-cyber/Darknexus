Darknexus local structure after reorganization:

- backend/: main Darknexus backend
- frontend/: main Darknexus frontend
- analytics/: Analytics app with backend/, frontend/, START.bat
- warzone/: Warzone app with backend/, frontend/, START.bat
- killagain-food/: Killagain Food app with START.bat and app-specific launchers
- _ARCHIVE/legacy_root_frontend/: old root frontend kept for rollback

Main launchers:

- START_ALL.bat: global menu
- START_ALL_CLEAN.bat: wrapper to START_ALL.bat
- START_DARKNEXUS.bat: main Darknexus launcher
- LANCER_ANALYTICS.bat: launches analytics/START.bat
- LANCER_WARZONE.bat: launches warzone/START.bat
- LANCER_KILLAGAIN_FOOD.bat: launches killagain-food/START.bat

Notes:

- Warzone now uses backend port 5003 to avoid conflict with Killagain Food on 5002.
- Analytics frontend is pinned to backend port 5001 through analytics/frontend/.env.
- Old source folders under apps/ and projects/ are still present as legacy copies until validation is complete.