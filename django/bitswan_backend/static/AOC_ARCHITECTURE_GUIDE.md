# AOC Architecture Guide

This document describes the complete architecture of the Automation Operations Center (AOC) platform, including the React frontend, Django backend, and deployment strategies.

## Overview

The AOC platform uses a modern, security-first architecture with clear separation of concerns:

- **Frontend**: React SPA with zero secrets and auto-discovery
- **Backend**: Django REST API with comprehensive authentication
- **AOC CLI**: Setup and deployment management tool
- **Services**: Keycloak, InfluxDB, EMQX, PostgreSQL

## Core Architecture Principles

### 1. Zero Secrets in Frontend

The React frontend contains **no environment variables, API keys, or secrets**. This design provides:

- **Enhanced Security**: No sensitive data exposed in client-side code
- **Simplified Deployment**: No environment configuration required
- **Auto-Discovery**: Backend URL determined automatically from hostname

#### Implementation
```javascript
// Frontend auto-discovers backend URL
const currentHost = window.location.hostname;
const backendHost = currentHost.replace(/^aoc\./, 'api.');
const backendUrl = `${protocol}//${backendHost}`;
```

### 2. Domain-Based Service Discovery

All services follow a consistent domain pattern:

```
aoc.<domain>        → React Frontend
api.<domain>        → Django Backend  
keycloak.<domain>   → Authentication
mqtt.<domain>       → Message Broker
influx.<domain>     → Metrics Database
```

This pattern works seamlessly across environments:
- **Development**: `*.bitswan.localhost`
- **Production**: `*.yourdomain.com`

## Frontend Architecture (React SPA)

### Component Structure
```
aoc-frontend/src/
├── components/
│   ├── automation-server/    # Automation server management
│   ├── auth/                 # Authentication components
│   ├── home/                 # Dashboard components
│   ├── layout/               # Layout and navigation
│   ├── pipeline/             # Pipeline visualization
│   ├── settings/             # Configuration management
│   ├── ui/                   # Reusable UI components
│   └── users/                # User management
├── context/
│   ├── AuthContext.tsx       # Authentication state (no secrets)
│   ├── AutomationsProvider.tsx
│   └── SideBarItemsProvider.tsx
├── data/                     # API client utilities
├── hooks/                    # Custom React hooks
├── pages/                    # React Router pages
├── types/                    # TypeScript definitions
└── utils/                    # Utility functions
```

### Authentication Flow
```
1. User enters credentials → React form
2. POST /api/frontend/auth/login/ → Django
3. Django validates via Keycloak → JWT token
4. Token stored in localStorage → Axios headers
5. Subsequent API calls → Authenticated requests
```

### State Management
- **Authentication**: React Context + localStorage
- **API State**: React Query for server state
- **UI State**: React useState/useReducer
- **Routing**: React Router v6

## Backend Architecture (Django REST)

### API Structure
```
/api/frontend/                # Frontend-specific endpoints
├── auth/
│   ├── login/               # Password authentication
│   ├── logout/              # Session invalidation
│   └── users/me/            # Current user info
├── config/                  # Frontend configuration
├── automation-servers/     # Server management
├── workspaces/             # Workspace management
├── user-groups/            # Group management
└── users/                  # User management

/api/automation_server/      # CLI/Server endpoints
├── exchange-otp/           # OTP authentication
├── info/                   # Server information
└── workspaces/             # Server workspace management
```

### Authentication Strategy

#### Multi-Modal Authentication
1. **Keycloak JWT** (Frontend users)
2. **Bearer Tokens** (Automation servers)
3. **Admin Authentication (keycloak)** (Django admin)

#### Security Features
- **JWT Validation**: Keycloak public key verification
- **Token Scoping**: Different permissions for different client types
- **Group-Based Access**: Organization and role-based permissions
- **Admin Controls**: GlobalSuperAdmin group for Django admin access

### Database Design

#### Core Models
```python
# Organizations and Access Control
AutomationServer          # Server instances
Workspace                 # Workspaces within servers
WorkspaceGroupMembership  # Access control for workspaces
AutomationServerGroupMembership  # Access control for servers
GroupNavigation           # Navigation configuration

# Authentication
User                      # Django users (minimal)
```

#### Access Control Pattern
```
Organization (Keycloak Group)
├── Admin Group           # Full access
├── Server Groups         # Server-specific access
└── Workspace Groups      # Workspace-specific access
    ├── {workspace}-viewonly
    └── {workspace}-editor
```

## CLI Architecture (AOC Tool)

## Service Integration Patterns

### MQTT Communication
```
Topic Structure: /orgs/{org_id}/automation-servers/{server_id}/...

Group Management:
  /groups                   # Server access groups
  /c/{workspace_id}/groups  # Workspace access groups

Pipeline Communication:
  /c/{workspace_id}/topology           # Pipeline structure
  /c/{workspace_id}/c/{component_id}/events  # Component events
```

### API Communication Patterns

#### Frontend → Backend
```javascript
// Automatic backend discovery
axios.defaults.baseURL = `${protocol}//api.${hostname}`;

// JWT authentication
headers: { Authorization: `Bearer ${token}` }

// Direct REST calls
GET /api/frontend/automation-servers/
POST /api/frontend/workspaces/
```


### Development Environment
```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  aoc-frontend   │   │ aoc-bitswan-    │   │  External       │
│  :3000          │   │ backend:8000    │   │  Services       │
│                 │   │                 │   │                 │
│ • Live reload   │   │ • Live reload   │   │ • keycloak:8080 │
│ • Source mount  │   │ • Source mount  │   │ • influxdb:8086 │
│ • npm start     │   │ • Django dev    │   │ • emqx:8083     │
└─────────────────┘   └─────────────────┘   └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                   ┌─────────────────┐
                   │ bitswan ingress │
                   │                 │
                   │ aoc.domain → aoc-frontend:3000
                   │ api.domain → aoc-bitswan-backend:8000
                   │ *.domain → services
                   └─────────────────┘
```

### Production Environment
```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  aoc-frontend   │   │ aoc-bitswan-    │   │  External       │
│  :80            │   │ backend:8000    │   │  Services       │
│                 │   │                 │   │                 │
│ • nginx static  │   │ • gunicorn      │   │ • keycloak:8080 │
│ • Built app     │   │ • Production    │   │ • influxdb:8086 │
│ • Optimized     │   │ • All secrets   │   │ • emqx:8083     │
└─────────────────┘   └─────────────────┘   └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                   ┌─────────────────┐
                   │ bitswan ingress │
                   │                 │
                   │ aoc.domain → :80
                   │ api.domain → :8000
                   │ *.domain → services
                   └─────────────────┘
```

## Security Architecture

### Authentication Layers
1. **Frontend Authentication**
   - JWT tokens from Keycloak
   - localStorage token storage
   - Automatic token refresh handling

2. **Backend Authentication**
   - Keycloak JWT validation
   - Group-based authorization
   - Permission scoping per organization

3. **Admin Authentication**
   - Django admin integration
   - GlobalSuperAdmin Keycloak group
   - Email verification requirements

### Authorization Patterns
```python
# Organization-level access
user_org_id = keycloak.get_active_user_org_id()
resources = Model.objects.filter(keycloak_org_id=user_org_id)

# Group-based access
user_groups = keycloak.get_user_groups(user_id)
accessible_resources = get_resources_by_group_membership(user_groups)

# Admin-only operations
if not keycloak.is_admin(request):
    return HTTP_403_FORBIDDEN
```

### Secret Management
```python
# All secrets managed by Django settings
KEYCLOAK_CLIENT_SECRET_KEY = os.environ.get("KEYCLOAK_CLIENT_SECRET_KEY")
AUTH_SECRET_KEY = os.environ.get("AUTH_SECRET_KEY")
EMQX_JWT_SECRET = os.environ.get("EMQX_JWT_SECRET")

# Frontend has zero secrets
# Auto-discovery pattern eliminates configuration needs
```

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: React Router lazy loading
- **Bundle Optimization**: Webpack optimizations in CRA
- **Caching**: Browser caching for static assets
- **CDN Ready**: Static build can be served from CDN

### Backend Optimization
- **Database**: PostgreSQL with proper indexing
- **Caching**: Django cache framework
- **API**: DRF pagination and filtering
- **Connection Pooling**: Database connection management

### Development Performance
- **Live Reload**: File watching with polling for containers
- **Hot Module Replacement**: React development server
- **Source Maps**: Full debugging support
- **Fast Refresh**: React Fast Refresh enabled

## Monitoring and Observability

### Logging Strategy
```python
# Django structured logging
LOGGING = {
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "allauth": {"level": "DEBUG"},
        "python_keycloak": {"level": "DEBUG"},
        "django": {"level": "DEBUG"},
    },
}
```

### Metrics Collection
- **InfluxDB**: Time-series metrics storage
- **MQTT**: Real-time event streaming
- **Django Logging**: Application-level logging
- **Nginx Logs**: Access and error logging

## Scalability Patterns

### Horizontal Scaling
```yaml
# Independent service scaling
services:
  aoc-frontend:
    deploy:
      replicas: 3
  
  aoc-backend:
    deploy:
      replicas: 2
```

### Load Balancing
- **Frontend**: CDN + multiple nginx instances
- **Backend**: Load balancer + Django instances
- **Database**: Read replicas for read-heavy operations

### Caching Strategy
- **Frontend**: Browser caching + CDN
- **Backend**: Django cache + Redis
- **Database**: Query optimization + connection pooling

## Development Best Practices

### Code Organization
```
├── Frontend (React)
│   ├── Pure functional components
│   ├── Custom hooks for state logic
│   ├── Context for global state
│   └── TypeScript for type safety
│
├── Backend (Django)
│   ├── ViewSets for CRUD operations
│   ├── Serializers for data validation
│   ├── Services for business logic
│   └── Models for data persistence
│
└── CLI (Python)
    ├── Commands for user operations
    ├── Services for external integrations
    └── Utils for common functionality
```

### Testing Strategy
- **Frontend**: Jest + React Testing Library
- **Backend**: Django TestCase + pytest
- **Integration**: API contract testing
- **E2E**: Cypress for critical workflows

### Error Handling
```python
# Backend: Structured error responses
{
    "error": "Human-readable message",
    "code": "MACHINE_READABLE_CODE",
    "details": {...}
}

# Frontend: Consistent error handling
try {
    await api.call()
} catch (error) {
    if (error.response?.status === 401) {
        logout(); // Auto-logout on auth errors
    }
    showError(error.response?.data?.error);
}
```

## API Design Patterns

### RESTful Endpoints
```
# Resource-based URLs
GET    /api/frontend/automation-servers/           # List servers
POST   /api/frontend/automation-servers/           # Create server
GET    /api/frontend/automation-servers/{id}/      # Get server
PUT    /api/frontend/automation-servers/{id}/      # Update server
DELETE /api/frontend/automation-servers/{id}/      # Delete server

# Nested resources
GET    /api/frontend/automation-servers/{id}/workspaces/
POST   /api/frontend/workspaces/{id}/add_to_group/
```

### Authentication Patterns
```python
# View-level authentication
class AutomationServerViewSet(viewsets.ModelViewSet):
    authentication_classes = [KeycloakAuthentication]
    permission_classes = [IsAuthenticated]

# Custom permissions
class CanReadWorkspaceEMQXJWT(BasePermission):
    def has_permission(self, request, view):
        # Organization membership validation
        # Group-based access control
        return user_has_access
```

### Data Serialization
```python
# Input validation and output formatting
class WorkspaceSerializer(serializers.ModelSerializer):
    automation_server = serializers.SlugRelatedField(
        slug_field="automation_server_id",
        read_only=True,
    )
    
    class Meta:
        model = Workspace
        fields = ["id", "name", "automation_server", ...]
        read_only_fields = ["created_at", "updated_at"]
```

## Service Integration

### Keycloak Integration
```python
class KeycloakService:
    def validate_token(self, token):
        # JWT validation with public key
        public_key = self.keycloak.public_key()
        return self.keycloak.decode_token(token, key=formatted_public_key)
    
    def get_user_groups(self, user_id):
        # Group membership for authorization
        return self.keycloak_admin.get_user_groups(user_id)
    
    def is_global_superadmin(self, user_id):
        # Admin access determination
        return user_id in global_superadmin_group
```

### MQTT Integration
```python
class MQTTService:
    def publish_automation_server_groups(self, server):
        topic = f"/orgs/{server.keycloak_org_id}/automation-servers/{server.id}/groups"
        self.mqtt_client.publish(topic, group_ids, retain=True)
    
    def publish_workspace_groups(self, workspace):
        topic = f"/orgs/{workspace.keycloak_org_id}/automation-servers/{workspace.automation_server_id}/c/{workspace.id}/groups"
        self.mqtt_client.publish(topic, group_ids, retain=True)
```

### Database Patterns
```python
# Signal-based automation
@receiver([post_save, post_delete], sender=WorkspaceGroupMembership)
def publish_workspace_groups_on_change(sender, instance, **kwargs):
    MQTTService().publish_workspace_groups(instance.workspace)

# Automatic group creation
@receiver([post_save], sender=Workspace)
def create_workspace_groups(sender, instance, created, **kwargs):
    if created:
        keycloak_service.create_group(f"{instance.name}-viewonly")
        keycloak_service.create_group(f"{instance.name}-editor")
```

## Configuration Management

### Environment-Based Configuration
```python
# Django settings pattern
class Environment(Enum):
    DEV = "dev"
    PROD = "prod"

# Service-specific defaults
def default_env(config: InitConfig) -> Dict[str, str]:
    if config.env == Environment.DEV:
        return dev_overrides
    return production_defaults
```

### Secret Generation
```python
# Cryptographically secure secrets
secrets_map = (
    ("KC_DB_PASSWORD",),
    ("BITSWAN_BACKEND_POSTGRES_PASSWORD",),
    ("INFLUXDB_TOKEN",),
    ("AUTH_SECRET_KEY",),
    ("EMQX_AUTHENTICATION__1__SECRET",),
)

for secret_tuple in secrets_map:
    value = generate_secret()  # secrets.token_hex(16)
    for key in secret_tuple:
        vars[key] = value
```

## Deployment Strategies

### Container Orchestration
```yaml
# Docker Compose pattern
services:
  aoc-frontend:
    image: bitswan/automation-operations-centre:${TAG}
    command: ${FRONTEND_COMMAND}  # /start or /dev-command
    volumes: ${FRONTEND_VOLUMES}  # [] or [./aoc-frontend:/app:rwz]
    
  aoc-backend:
    image: bitswan/bitswan-backend:${TAG}
    command: ${BACKEND_COMMAND}   # /start or /dev-command
    volumes: ${BACKEND_VOLUMES}   # [] or [./django:/app:rwz]
```

### Ingress Configuration
```python
# Dynamic service targeting
frontend_port = "3000" if env == DEV else "80"
backend_port = "8000"  # Always 8000

ingress.add_proxy(f"aoc.{domain}", f"aoc-frontend:{frontend_port}")
ingress.add_proxy(f"api.{domain}", f"aoc-backend:{backend_port}")
```

### Health Checks
```python
# Service readiness
def wait_for_service(url, max_retries=30):
    for attempt in range(max_retries):
        try:
            response = requests.get(f"{url}/health")
            if response.status_code == 200:
                return True
        except:
            time.sleep(delay)
    raise TimeoutError("Service failed to start")
```

## Security Best Practices

### Frontend Security
- **No sensitive data**: Zero secrets in client code
- **HTTPS enforcement**: TLS for all production traffic
- **Content Security Policy**: Restricted resource loading
- **XSS Protection**: React's built-in XSS prevention

### Backend Security
- **Authentication required**: All endpoints require auth
- **Input validation**: Comprehensive request validation
- **SQL injection prevention**: Django ORM usage
- **CSRF protection**: Django CSRF middleware

### Network Security
- **TLS termination**: At ingress level
- **Internal communication**: Container network isolation
- **Secret management**: Environment variable isolation
- **Access control**: Group-based permissions

## Performance Optimization

### Frontend Performance
```javascript
// Code splitting
const AutomationServersPage = lazy(() => import('./pages/AutomationServersPage'));

// Query optimization
const { data } = useQuery(['servers'], fetchServers, {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Component optimization
const MemoizedComponent = React.memo(ExpensiveComponent);
```

### Backend Performance
```python
# Database optimization
class WorkspaceViewSet(viewsets.ModelViewSet):
    queryset = Workspace.objects.select_related('automation_server')
    
# Pagination
pagination_class = DefaultPagination

# Caching
@cache_page(60 * 15)  # Cache for 15 minutes
def expensive_view(request):
    return expensive_computation()
```

## Troubleshooting Guide

### Common Issues

#### Frontend Issues
1. **Backend not found**: Check hostname pattern (aoc. → api.)
2. **Authentication errors**: Verify JWT token handling
3. **CORS errors**: Check Django CORS_ALLOWED_ORIGINS

#### Backend Issues
1. **Token validation**: Check Keycloak public key
2. **Group access**: Verify user group memberships
3. **Database errors**: Check migrations and connections

#### Development Issues
1. **Live reload not working**: Check file watching environment variables
2. **Volume mounts failing**: Verify directory paths in dev mode
3. **Service not starting**: Check Docker container logs

### Debugging Tools
- **Frontend**: React DevTools, browser network tab
- **Backend**: Django Debug Toolbar, logging
- **Integration**: API documentation, Swagger UI
- **Infrastructure**: Docker logs, container inspection

This architecture provides a robust, scalable, and maintainable foundation for the AOC platform while ensuring security and development efficiency.
