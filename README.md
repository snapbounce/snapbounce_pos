# SnapBounce POS System

A modern Point of Sale system built with React and Node.js.

## Quick Start with Docker

To deploy the application using Docker, follow these steps:

1. Create a new directory and navigate into it:
```bash
mkdir snapbounce_pos
cd snapbounce_pos
```

2. Create a `.env` file with your database configuration:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=snapbounce_pos
```

3. Create a `docker-compose.yml` file:
```yaml
services:
  frontend:
    image: ayubmamat/snapbouncepos:1.0-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    image: ayubmamat/snapbouncepos:1.0-backend
    environment:
      - NODE_ENV=production
      - TZ=Asia/Singapore
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
      - POSTGRES_DB=${POSTGRES_DB:-snapbounce_pos}
    volumes:
      - backend_data:/usr/src/app/data
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
      - POSTGRES_DB=${POSTGRES_DB:-snapbounce_pos}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
  backend_data:
```

4. Start the application:
```bash
docker-compose up -d
```

5. Access the application:
- If deploying locally: `http://localhost`
- If deploying on a server: `http://your_server_ip`

## Initial Setup

1. Default admin PIN is "1111"
2. Change the admin PIN immediately after first login
3. Configure your products and categories in the admin dashboard

## Monitoring and Maintenance

### Checking Container Status
```bash
# View running containers
docker-compose ps

# View container logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

### Managing the Application
```bash
# Stop the application
docker-compose down

# Stop and remove all data (use with caution!)
docker-compose down -v

# Restart the application
docker-compose restart

# Update to latest version
docker-compose pull
docker-compose up -d
```

## Features

- Modern React frontend with responsive design
- Node.js backend with PostgreSQL database
- Admin dashboard with PIN protection
- Sales tracking and reporting
- Product management
- Transaction history
- Daily reports

## Security

- Admin access is protected by a PIN
- PIN can be changed through the admin interface
- All API endpoints are properly secured
- Data is persisted in Docker volumes

### Production Security Checklist
- [ ] Change default admin PIN
- [ ] Set strong database password
- [ ] Configure SSL/TLS (HTTPS)
- [ ] Set up proper firewall rules
- [ ] Configure regular backups

## Data Management

### Backup
The application uses Docker volumes for data persistence:
- `postgres_data`: Database files
- `backend_data`: Application data (including admin PIN)

To backup the volumes:
```bash
# Create a backup directory
mkdir -p backups

# Backup postgres data
docker run --rm -v snapbounce_pos_postgres_data:/source -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_backup.tar.gz -C /source .

# Backup backend data
docker run --rm -v snapbounce_pos_backend_data:/source -v $(pwd)/backups:/backup alpine tar czf /backup/backend_backup.tar.gz -C /source .
```

### Restore
To restore from backups:
```bash
# Stop the application
docker-compose down

# Restore postgres data
docker run --rm -v snapbounce_pos_postgres_data:/target -v $(pwd)/backups:/backup alpine sh -c "cd /target && tar xzf /backup/postgres_backup.tar.gz"

# Restore backend data
docker run --rm -v snapbounce_pos_backend_data:/target -v $(pwd)/backups:/backup alpine sh -c "cd /target && tar xzf /backup/backend_backup.tar.gz"

# Start the application
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Can't access the application**
   - Check if containers are running: `docker-compose ps`
   - Verify port 80 is not in use: `netstat -an | grep 80`
   - Check container logs: `docker-compose logs`

2. **Database connection issues**
   - Verify environment variables in `.env`
   - Check database logs: `docker-compose logs db`
   - Ensure volumes are properly mounted

3. **Admin PIN issues**
   - Default PIN is "1111"
   - If PIN is lost, you can reset it by accessing the backend container

## Support

For support or feature requests, please open an issue in the GitHub repository.
