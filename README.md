# Combo Manager — Django + DRF Backend

## Tech Stack
- Python 3.11+
- Django 5.x
- Django REST Framework
- PostgreSQL
- Simple JWT (Authentication)
- django-cors-headers
- django-filter
- Pillow (image handling)
- psycopg2-binary (PostgreSQL adapter)

---

## Project Structure

```
combo_manager/
├── manage.py
├── requirements.txt
├── .env
├── .env.example
├── combo_manager/          ← Django project config
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/           ← Users, roles, auth
│   ├── categories/         ← Product categories
│   ├── products/           ← Products & variants
│   ├── combos/             ← Combo deals
│   ├── orders/             ← Orders & order items
│   ├── customers/          ← Customer profiles
│   └── reports/            ← Reports & analytics
└── core/
    ├── permissions.py
    ├── pagination.py
    └── utils.py
```

---

## Step-by-Step Setup (Production)

### 1. Create a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Create PostgreSQL database

```bash
sudo -u postgres psql
CREATE DATABASE combo_manager;
CREATE USER combo_user WITH PASSWORD 'your_strong_password';
ALTER ROLE combo_user SET client_encoding TO 'utf8';
ALTER ROLE combo_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE combo_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE combo_manager TO combo_user;
\q
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 5. Run migrations

```bash
python manage.py migrate
```

### 6. Create superuser

```bash
python manage.py createsuperuser
```

### 7. Run development server

```bash
python manage.py runserver
```

### 8. Production with Gunicorn

```bash
gunicorn combo_manager.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

---

## API Base URL

```
http://localhost:8000/api/v1/
```

## Auth Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/v1/auth/login/ | Get JWT tokens |
| POST | /api/v1/auth/refresh/ | Refresh access token |
| POST | /api/v1/auth/logout/ | Blacklist token |

---

## All App Endpoints

### Accounts
| Method | URL | Description |
|--------|-----|-------------|
| GET/POST | /api/v1/accounts/users/ | List / Create users |
| GET/PUT/DELETE | /api/v1/accounts/users/{id}/ | Retrieve / Update / Delete user |
| GET/PUT | /api/v1/accounts/profile/ | My profile |

### Categories
| GET/POST | /api/v1/categories/ | List / Create |
| GET/PUT/DELETE | /api/v1/categories/{id}/ | Detail |

### Products
| GET/POST | /api/v1/products/ | List / Create |
| GET/PUT/DELETE | /api/v1/products/{id}/ | Detail |
| GET/POST | /api/v1/products/{id}/variants/ | Variants |

### Combos
| GET/POST | /api/v1/combos/ | List / Create |
| GET/PUT/DELETE | /api/v1/combos/{id}/ | Detail |
| GET/POST | /api/v1/combos/{id}/items/ | Combo items |

### Customers
| GET/POST | /api/v1/customers/ | List / Create |
| GET/PUT/DELETE | /api/v1/customers/{id}/ | Detail |

### Orders
| GET/POST | /api/v1/orders/ | List / Create |
| GET/PUT/DELETE | /api/v1/orders/{id}/ | Detail |
| POST | /api/v1/orders/{id}/status/ | Update status |

### Reports
| GET | /api/v1/reports/sales/ | Sales report |
| GET | /api/v1/reports/combos/ | Combo performance |
