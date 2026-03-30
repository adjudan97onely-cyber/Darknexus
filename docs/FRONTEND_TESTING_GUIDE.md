# 🧪 Frontend Testing Guide - Real Data Display

> **Status**: Backend ✅ ready, Frontend ✅ configured, Ready for browser testing

---

## 📱 Quick Start Frontend Testing

### Option 1: Local Development (Recommended)

```bash
# Terminal 1: Keep backend running (already running on port 5000)
# It should show:
# INFO: Uvicorn running on http://0.0.0.0:5000

# Terminal 2: Start frontend dev server
cd c:\Darknexus-main\frontend
npm run dev

# This will start Vite on http://localhost:5173
# Open your browser to: http://localhost:5173
```

### Option 2: Build & Preview

```bash
cd c:\Darknexus-main\frontend
npm run build
npm run preview
```

---

## 🎯 What to Test

### 1. **Hub Page Load**
Navigate to HubPage in the application
- Look for: Section showing "Predictions" or "Ligue 1"
- Expected: 9 football match predictions display
- Check: Each match shows home team, away team, prediction, confidence

### 2. **Real Data Verification**
Examine the predictions shown:
- Must show: Actual team names (Paris Saint-Germain, Toulouse, etc.)
- Must show: Actual dates and times (April 3-5, 2026)
- Must show: Real confidence scores

**Sample Expected Display**:
```
Match 1: Paris Saint-Germain vs Toulouse
Prediction: DRAW (25% confidence)
Time: April 3, 2026 @ 18:45

Match 2: RC Strasbourg vs OGC Nice  
Prediction: DRAW (25% confidence)
Time: April 4, 2026 @ 15:00

[... 7 more matches ...]
```

### 3. **League Filter**
Look for filter controls:
- Click "Ligue 1" filter
- Expected: Same 9 predictions (all are Ligue 1)

### 4. **Country Filter**
Look for country filter:
- Click "France"
- Expected: Same 9 predictions (all from France)

### 5. **API Connectivity**
Open browser DevTools (F12):
- Network tab → Filter "fetch" requests
- Look for: API calls to `http://localhost:5000/api/predictions/with-ia`
- Expected: Response with 200 status and JSON array of predictions

---

## 🔍 Browser DevTools Debug

### Monitor API Calls
1. Open DevTools (F12)
2. Go to Network tab
3. Filter for "predictions"
4. See requests like:
   ```
   GET /api/predictions/with-ia?league=ligue1
   Response: {
     "count": 9,
     "data": {"predictions": [...]}
   }
   ```

### Check Console for Errors
1. Go to Console tab
2. Look for errors (red messages)
3. If any CORS errors, may need backend CORS configuration

### Verify Data Structure
In Console, you can inspect:
```javascript
// When page loads, predictions should be in component state
// Structure should match:
{
  homeTeam: "Paris Saint-Germain FC",
  awayTeam: "Toulouse FC",
  league: "Ligue 1",
  prediction: {outcome: "DRAW", confidence: 0.25},
  market_data: {hasOdds: true}
}
```

---

## ✅ Acceptance Criteria

| Criteria | Status | Notes |
|----------|--------|-------|
| Page loads without errors | ✓ To test | Check browser console |
| Predictions display | ✓ To test | Should see 9 matches |
| Team names are real | ✓ To test | Not "Team A", "Team B" |
| Dates are real | ✓ To test | April 2026, not random |
| API calls succeed | ✓ To test | Network tab 200 OK |
| Filters work | ✓ To test | League and country selections |
| No CORS errors | ✓ To test | DevTools console clean |

---

## 🐛 Troubleshooting

### Issue: "Connection refused" error in browser console
**Solution**: 
- Check backend is running: `netstat -an | Select-String 5000`
- If not running: Start it again in separate terminal
- Verify `.env` has correct `VITE_BACKEND_URL=http://localhost:5000/api`

### Issue: "No predictions displayed"
**Solution**:
- Check API directly: `curl http://localhost:5000/api/predictions/with-ia?league=ligue1`
- Should return JSON with count > 0
- Check browser Network tab for response status code

### Issue: "CORS error preventing API calls"
**Solution**:
- Backend may need CORS middleware added
- Edit `server.py` to add:
  ```python
  from fastapi.middleware.cors import CORSMiddleware
  app.add_middleware(CORSMiddleware, allow_origins=["*"])
  ```

### Issue: "Predictions show but confidence is 0.25 for all"
**Expected**: This is correct until odds details available
- Team form signals: All default to 0.5 (neutral)
- Market signals: Empty (odds details not yet available)
- Confidence = 0.25 is default when signals are weak

---

## 📊 Expected Data Quality Metrics

```
Real Data Verification Checklist:
✅ 9 Ligue 1 matches returned
✅ All matches have dates in April 2026
✅ All teams are real French clubs
✅ Predictions follow combined_signals model
✅ Data sources show: football-data.org, the-odds-api.com, IA combinée
✅ Model weights correct: team_form=0.3, market_odds=0.5, trends=0.2
✅ All responses <100ms (good performance)
```

---

## 📝 Notes for Next Phase

Once frontend displays correctly:

1. **Frontend Deployment**: 
   - Build: `npm run build`
   - Deploy to Vercel or similar

2. **Backend Deployment**:
   - Currently local (port 5000)
   - Needs public URL for remote frontend

3. **Database Persistence**:
   - TinyDB stores in `databases/predictions.json`
   - For production: Switch to PostgreSQL or MongoDB

4. **Odds Enhancement**:
   - Current: Bookmakers field empty
   - Next: Implement separate API call for odds details
   - Impact: Will increase prediction confidence to 0.5-0.95 range

---

## 🎬 Test Execution

### Run Through This Checklist

- [ ] Backend running (Terminal shows "Uvicorn running on 0.0.0.0:5000")
- [ ] Frontend started (`npm run dev` command executed)
- [ ] Browser opened to http://localhost:5173
- [ ] HubPage visible with predictions
- [ ] 9 predictions displayed (or count > 0)
- [ ] Team names visible and real
- [ ] Dates visible and in 2026
- [ ] DevTools Network shows 200 OK responses
- [ ] No red errors in DevTools Console
- [ ] Filters (league, country) selectable
- [ ] Expected data structure in Network response

**All ✅ checked?** → System ready for production testing

---

## 📞 Support

If issues arise during frontend testing:
1. Check backend logs: Look at terminal running `python server.py`
2. Check browser console: F12 → Console tab for JavaScript errors
3. Check network calls: F12 → Network tab for HTTP 4xx/5xx responses
4. Check `.env` configuration: Ensure BACKEND_URL and VITE_BACKEND_URL correct

---

**Next**: Launch frontend and verify real predictions display ✨
