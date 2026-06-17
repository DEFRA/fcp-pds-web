# FCP Payments and Documents Services (PDS) Web

Frontend service for the Payments and Documents Services (PDS) platform. Provides a secure, GOV.UK Design System-compliant home page with authenticated access to payment management and document request services.

## What This Service Does

The FCP PDS Web service acts as a gateway to FCP microservices, providing:

- **Authenticated Home Page**: Displays cards linking to available services (pay-web, request-editor)
- **Security**: Cookie-based session management with Azure AD integration for production
- **GOV.UK Compliance**: Full GOV.UK Frontend component library and design system styling
- **Development Mode**: Built-in dev authentication for local testing without Azure AD
- **Responsive Design**: Mobile-first responsive layout with proper accessibility

## Technology Stack

- **Runtime**: Node.js 24.15.0
- **Framework**: Hapi.js v21 (HTTP server)
- **Templates**: Nunjucks v3 (with GOV.UK Frontend components)
- **Styling**: SCSS compiled with webpack v5
- **Authentication**: @hapi/cookie with optional Azure AD (@azure/msal-node)
- **Build Tool**: Webpack v5 with CSS/image asset handling
- **Containerization**: Docker with multi-stage build

## Prerequisites

- **Docker & Docker Compose** (for running the service)
- **Node.js 24+** (for local development)
- **npm** (for dependency management)

Optional:
- Kubernetes + Helm (for production deployment)
- Azure subscription (for Azure AD authentication in production)

## Quick Start

### 1. Build and Run with Docker Compose

```bash
# Build the Docker image
docker compose build

# Start the service
docker compose up
```

The service will be available at `http://localhost:3023`

### 2. Authenticate

The service requires authentication. In development mode:

```bash
# Visit the dev auth endpoint to create a session
curl http://localhost:3023/dev-auth
```

This creates a dev user with `applicationAdmin` scope and redirects to the home page.

### 3. Access the Home Page

Visit `http://localhost:3023/` to see the home page with service cards:
- **Payment Management**: Links to pay-web (port 3007)
- **Request Editor**: Links to request-editor (port 3008)

## Local Development

### Prerequisites for Local Dev

- Node.js 24+
- npm

### Setup

```bash
# Install dependencies
npm install

# Build frontend assets (webpack)
npm run build
```

### Running Locally

```bash
# Start with auto-rebuild and hot reload
npm run start:watch
```

This will:
- Run webpack in watch mode (rebuilds CSS/images on change)
- Run nodemon (restarts app on file changes)
- Serve on `http://localhost:3023`

### Development Scripts

```bash
# Build assets once
npm run build

# Watch mode (rebuild on file changes)
npm run build:watch

# Start server with debug port
npm run start:debug

# Run tests
npm test

# Run tests with watch
npm run test:watch

# Lint code
npm run test:lint

# Fix linting issues
npm run test:lint:fix
```

## Project Structure

```
app/
├── auth/                  # Authentication modules
│   ├── azure-auth.js     # Azure AD authentication
│   ├── dev-auth.js       # Development authentication
│   ├── permissions.js    # Role/scope definitions
│   └── ...
├── config/               # Configuration validation
│   └── auth.js          # Auth config schema
├── constants/            # Application constants
│   ├── environments.js
│   ├── section-links.js  # Navigation links
│   └── sitemap.js        # Site structure
├── frontend/             # Frontend source files
│   ├── css/             # SCSS stylesheets
│   ├── images/          # Images, icons, logos
│   └── js/              # Frontend JavaScript
├── plugins/              # Hapi plugins
│   ├── auth.js          # Authentication strategy
│   ├── vision.js        # Template rendering
│   ├── inert.js         # Static file serving
│   └── router.js        # Route registration
├── routes/               # HTTP route handlers
│   ├── home.js          # Home page
│   ├── payment-management.js  # Payment service redirect
│   ├── request-editor.js      # Request editor redirect
│   ├── dev-auth.js           # Dev auth endpoint
│   └── ...
├── views/                # Nunjucks templates
│   ├── _layout.njk      # Master template (generated)
│   ├── home.njk         # Home page template
│   └── ...
├── dist/                 # Webpack compiled assets
│   ├── css/             # Compiled & hashed CSS
│   ├── js/              # Compiled JavaScript
│   ├── fonts/           # GOV.UK fonts
│   └── images/          # Optimized images
├── config.js            # Configuration management
├── server.js            # Hapi server setup
├── index.js             # Application entry point
└── insights.js          # Application Insights setup

webpack.config.js        # Webpack configuration
package.json             # Dependencies and scripts
Dockerfile               # Multi-stage Docker build
docker-compose.yaml      # Local development setup
```

## Configuration

Configuration is managed via environment variables and loaded from `app/config.js`:

### Key Environment Variables

```bash
# Server
HOST=0.0.0.0              # Server host
PORT=3023                 # Server port
NODE_ENV=development      # development|test|production

# Authentication
AUTHENTICATION_ENABLED=false    # Enable Azure AD (production)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-secret

# Session
COOKIE_PASSWORD=your-secret-key  # Session encryption key (generate with UUID)
```

## Styling and Assets

The service uses:
- **GOV.UK Frontend v6.2.0** - Pre-built components and design system
- **Custom SCSS** - Additional application styles in `app/frontend/css/`
- **Webpack** - Bundles and optimizes CSS, images, and JavaScript
- **Hash-based versioning** - CSS/JS files include content hash for cache busting

### Modifying Styles

Edit `app/frontend/css/card.scss` for card styling or `app/frontend/css/core.scss` for global styles.

Webpack will automatically recompile on file changes during development.

## Authentication Flow

### Development Mode

1. User visits `/dev-auth`
2. Dev auth creates a session with `applicationAdmin` scope
3. User is redirected to `/` (home page)
4. Protected routes validate the `applicationAdmin` scope

### Production Mode (Azure AD)

1. User visits `/` (protected)
2. Redirected to `/authenticate` (Azure AD login)
3. Returns to `/` with authenticated session
4. Scope validated against Azure AD roles

## Deployment

### Docker Build

Multi-stage build creates production-optimized images:

```bash
# Development image - includes dev tools and source
docker build --target development .

# Production image - lightweight runtime only
docker build --target production .
```

### Kubernetes / Helm

Helm chart provided in `helm/fcp-pds-web/`:

```bash
# Deploy to Kubernetes
helm install fcp-pds-web helm/fcp-pds-web/ -f helm/fcp-pds-web/values.yaml
```

## Testing

### Running Tests

Tests are structured in `test/` subdirectories following FFC conventions:

```bash
# Run all tests
scripts/test

# Run tests with file watch
scripts/test -w

# Run specific test file
npm test -- app.test.js

# Run with coverage
npm test -- --coverage
```

### Test Structure

```
test/
├── integration/    # Integration tests
│   ├── narrow/    # Narrow integration tests (unit + integration)
│   └── ...
└── ...
```

## Troubleshooting

### Issue: "Insufficient scope" error

**Cause**: User doesn't have required authentication scope.

**Solution**: Visit `/dev-auth` in development mode to create a dev session, or check Azure AD roles in production.

### Issue: Styles not loading

**Cause**: Webpack build failed or CSS not compiled.

**Solution**:
```bash
# Rebuild assets
npm run build

# Check for webpack errors
npm run build 2>&1 | grep -i error

# Restart the service
docker compose restart
```

### Issue: Port 3023 already in use

**Solution**: 
```bash
# Use different port
PORT=3024 docker compose up

# Or kill existing process
lsof -ti:3023 | xargs kill -9
```

### Issue: Docker build fails

**Cause**: Node version mismatch or missing dependencies.

**Solution**:
```bash
# Clean rebuild
docker compose down
docker system prune -a
docker compose build --no-cache
docker compose up
```

## Key Features

- ✅ **GOV.UK Design System**: Full compliance with UK government design patterns
- ✅ **Responsive Design**: Mobile-first responsive layout
- ✅ **Authentication**: Secure session management with Azure AD support
- ✅ **Service Gateway**: Card-based navigation to microservices
- ✅ **Development Mode**: Built-in dev authentication for testing
- ✅ **Asset Optimization**: Webpack bundling with hash-based cache busting
- ✅ **Docker-Ready**: Multi-stage build for development and production
- ✅ **Kubernetes Compatible**: Helm chart for cloud deployment

## Adding New Pages

To add a new page:

1. **Create a route** in `app/routes/my-page.js`:
```javascript
const { applicationAdmin } = require('../auth/permissions')

module.exports = {
  method: 'GET',
  path: '/my-page',
  options: {
    auth: {
      scope: [applicationAdmin]
    }
  },
  handler: (request, h) => {
    return h.view('my-page', { title: 'My Page' })
  }
}
```

2. **Create a template** in `app/views/my-page.njk`:
```nunjucks
{% extends '_layout.njk' %}

{% block content %}
  <h1>{{ title }}</h1>
{% endblock %}
```

3. **Register the route** in `app/plugins/router.js`:
```javascript
routes: [
  ...require('../routes/my-page')
]
```

## Integrating External Services

To link to external microservices:

1. **Create a redirect route** in `app/routes/`:
```javascript
handler: (request, h) => {
  return h.redirect('http://localhost:3007')  // pay-web
}
```

2. **Add to sitemap** in `app/constants/sitemap.js` to show on home page

3. **Protect with scopes** as needed in route options

## CI/CD Pipeline

This service uses the FFC CI pipeline. Pipeline configuration:
- Automated tests on every commit
- Docker image building and registry push
- Kubernetes deployment via Helm
- SonarQube code quality scanning

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit with signed commits: `git commit -S`
3. Push and create a Pull Request
4. Ensure all tests pass and code is reviewed before merging

## Support and Documentation

- [GOV.UK Frontend Documentation](https://design-system.service.gov.uk/)
- [Hapi.js Documentation](https://hapi.dev/)
- [FFC Platform Documentation](https://eaflood.atlassian.net/)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
