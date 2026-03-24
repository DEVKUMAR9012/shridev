# Real Login API Integration

**Status**: Planning

**Information Gathered**:
- pages/login.html: Fake demo login with setTimeout (generate user from email)
- Backend: backend/server.js ready (MySQL + port 5000)
- Structure: pages/, css/, js/ ready

**Plan**:
1. Edit pages/login.html: Remove setTimeout demo, add fetch('http://localhost:5000/login')
2. Start backend: cd backend && node server.js (expect "MySQL Connected ✅\nServer running on port 5000 🚀")
3. Test: Login → dashboard.html with real token/user from API

**Dependent Files**:
- pages/login.html (main edit)
- backend/server
