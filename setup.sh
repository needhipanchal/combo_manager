#!/bin/bash
# setup.sh — Run once after cloning to get the project running

set -e

echo "=== combo_manager Django Backend Setup ==="

# 1. Create virtualenv
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 3. Copy env file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  .env file created — please edit it with your actual DB credentials before continuing."
    echo "    Open .env and set DB_NAME, DB_USER, DB_PASSWORD, SECRET_KEY, etc."
    read -p "Press Enter after editing .env to continue..."
fi

# 4. Create logs dir
mkdir -p logs

# 5. Run migrations
python manage.py migrate

# 6. Create superuser
echo "Creating superuser..."
python manage.py createsuperuser

# 7. Collect static files
python manage.py collectstatic --noinput

echo ""
echo "=== Setup Complete ==="
echo "Run the dev server: python manage.py runserver"
echo "API base URL: http://localhost:8000/api/v1/"
echo "Admin panel:  http://localhost:8000/admin/"
