#!/bin/bash
# Flo-scent System Setup Script
# Run from the repo root: ./execution/setup.sh

set -e
echo "🌸 Flo-scent Setup"
echo "=================="

# ── Backend ────────────────────────────────────────────────────────────────────
echo ""
echo "Setting up Django backend…"
cd backend

# Create venv if not exists
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "✓ Created virtual environment"
fi

source venv/bin/activate

pip install -r requirements.txt -q
echo "✓ Installed Python dependencies"

# Copy .env if not present
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✓ Created .env from .env.example — fill in your API keys!"
fi

# Create __init__ files for apps
for app in users clients quotes proposals assets payments ai_services seo dashboard; do
  touch "apps/${app}/__init__.py" 2>/dev/null || true
done

python manage.py migrate
echo "✓ Database migrated"

# Create superuser if no users exist
python manage.py shell -c "
from apps.users.models import User
if not User.objects.exists():
    User.objects.create_superuser('admin@floscent.com', 'admin123', first_name='Admin', last_name='User')
    print('✓ Created superuser: admin@floscent.com / admin123')
else:
    print('✓ Superuser already exists')
"

echo "✓ Backend ready"
echo "  Run: cd backend && source venv/bin/activate && python manage.py runserver"

# ── Frontend ───────────────────────────────────────────────────────────────────
echo ""
echo "Setting up React frontend…"
cd ../frontend

if command -v npm &> /dev/null; then
  npm install --silent
  echo "✓ Installed npm dependencies"
  echo "  Run: cd frontend && npm run dev"
else
  echo "⚠ npm not found — install Node.js to set up the frontend"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Fill in backend/.env with your API keys"
echo "     - ANTHROPIC_API_KEY  (from console.anthropic.com)"
echo "     - STRIPE_SECRET_KEY  (from dashboard.stripe.com)"
echo "     - STRIPE_PUBLISHABLE_KEY"
echo "  2. Start backend:  cd backend && source venv/bin/activate && python manage.py runserver"
echo "  3. Start frontend: cd frontend && npm run dev"
echo "  4. Open: http://localhost:5173"
echo "  5. Login: admin@floscent.com / admin123"
echo ""
echo "Public onboarding form: http://localhost:5173/onboard"
