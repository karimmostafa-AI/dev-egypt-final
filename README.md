# E-commerce Application Backend

A full-stack e-commerce application backend built with Next.js, React, and Appwrite. This project provides a complete backend solution for e-commerce platforms with authentication, product management, order processing, customer management, analytics, and more.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**: JWT-based auth with role-based access control (RBAC)
- **Product Management**: Full CRUD operations with inventory tracking
- **Order Management**: Complete order lifecycle management
- **Customer Management**: Customer profiles, segmentation, and analytics
- **Admin Dashboard**: Comprehensive analytics and reporting
- **Payment Processing**: Integration ready for Stripe, PayPal, etc.
- **Security**: XSS/CSRF protection, input sanitization, rate limiting

### Advanced Features
- **Bulk Operations**: Import/export data in CSV/Excel formats
- **Report Generation**: Sales, inventory, customer, and financial reports
- **Analytics Dashboard**: Revenue tracking, customer insights, inventory analytics
- **Real-time Updates**: Live dashboard metrics and notifications
- **API Documentation**: Complete Postman collection and Swagger docs

## 🛠 Technology Stack

### Backend
- **Appwrite**: Database, authentication, storage, and cloud functions
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling

### Development & Deployment
- **Docker**: Containerized deployment
- **Nginx**: Reverse proxy and load balancing
- **GitHub Actions**: CI/CD pipelines
- **Jest & Testing Library**: Unit and integration testing

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Docker and Docker Compose (for local development)
- Appwrite account (for cloud deployment)
- Git

## 🏃‍♂️ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ecommerce-backend.git
cd ecommerce-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Appwrite credentials
nano .env.local
```

Required environment variables:
```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id

# Collection IDs
NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID=products
NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID=orders
NEXT_PUBLIC_APPWRITE_CUSTOMERS_COLLECTION_ID=customers

# Security
APPWRITE_API_KEY=your-server-api-key
JWT_SECRET=your-jwt-secret
```

### 4. Start Appwrite (Local Development)
```bash
# Using Docker Compose
docker-compose up -d

# Or using Appwrite CLI
appwrite start
```

### 5. Setup Database
```bash
# Run the setup script
npm run setup

# Or manually create collections in Appwrite Console
```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🗄 Database Schema

### Collections Overview

#### Products Collection
```typescript
{
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stockQuantity: number;
  categoryId: string;
  status: 'draft' | 'active' | 'archived';
  images: ProductImage[];
  tags: string[];
  viewCount: number;
  salesCount: number;
}
```

#### Orders Collection
```typescript
{
  orderNumber: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: Address;
  billingAddress: Address;
  timeline: OrderStatusChange[];
}
```

#### Customers Collection
```typescript
{
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addresses: Address[];
  ordersCount: number;
  totalSpent: number;
  segment: 'vip' | 'regular' | 'at-risk' | 'inactive';
  status: 'active' | 'blocked';
}
```

## 🔐 Authentication & Authorization

### User Roles
- **Customer**: Can browse products, place orders, manage their profile
- **Staff**: Can view and manage orders, basic customer support
- **Manager**: Can manage products, orders, customers, view analytics
- **Admin**: Full access to all features and settings

### JWT Token Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "customer|staff|manager|admin",
  "iat": 1609459200,
  "exp": 1609545600
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Customer login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - List products with filtering
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (Admin/Manager)
- `PUT /api/products/:id` - Update product (Admin/Manager)
- `DELETE /api/products/:id` - Delete product (Admin)
- `PATCH /api/products/:id/stock` - Update stock

### Orders
- `GET /api/orders` - List orders (Admin/Staff)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/cancel` - Cancel order

### Customers
- `GET /api/customers` - List customers (Admin/Staff)
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/customers` - Customer analytics
- `GET /api/analytics/inventory` - Inventory analytics

### Reports
- `POST /api/reports/generate` - Generate reports (CSV/Excel)

### Bulk Operations
- `POST /api/bulk/import` - Bulk import data
- `POST /api/bulk/export` - Bulk export data
- `POST /api/bulk/update` - Bulk update records
- `POST /api/bulk/delete` - Bulk delete records

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test
```

### Test Coverage
- Unit tests for all service functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance and security testing

## 🚢 Deployment

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm start

# Or using Docker
docker-compose -f docker-compose.production.yml up -d
```

### Environment Variables for Production
```env
NODE_ENV=production
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-production-domain/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-production-project-id
APPWRITE_API_KEY=your-production-api-key
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
```

## 🔒 Security Features

### Implemented Security Measures
- **Input Sanitization**: All user inputs are sanitized to prevent XSS
- **CSRF Protection**: CSRF tokens for state-changing operations
- **Rate Limiting**: API rate limiting to prevent abuse
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions system
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **Password Validation**: Strong password requirements
- **SQL Injection Prevention**: Parameterized queries

### Security Best Practices
- Environment variables for sensitive data
- HTTPS enforcement in production
- Secure session management
- File upload validation
- API key authentication for server-side operations

## 📈 Monitoring & Analytics

### Built-in Analytics
- **Revenue Tracking**: Daily, weekly, monthly revenue reports
- **Customer Insights**: Customer behavior and segmentation
- **Product Performance**: Top products, inventory turnover
- **Order Analytics**: Order status, payment methods, fulfillment

### Performance Monitoring
- **Response Times**: API endpoint performance tracking
- **Error Rates**: Error monitoring and alerting
- **Database Performance**: Query performance optimization
- **Resource Usage**: Memory and CPU monitoring

## 🔧 Development

### Project Structure
```
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   │   ├── appwrite.ts     # Appwrite client configuration
│   │   ├── auth-service.ts # Authentication service
│   │   ├── product-service.ts # Product business logic
│   │   ├── order-service.ts   # Order business logic
│   │   ├── customer-service.ts # Customer business logic
│   │   ├── security.ts     # Security utilities
│   │   └── error-handler.ts   # Error handling
│   ├── types/              # TypeScript type definitions
│   └── cloud-functions/    # Appwrite cloud functions
├── docs/                   # Documentation
├── public/                 # Static assets
└── __tests__/             # Test files
```

### Adding New Features

1. **Database Changes**: Update schema in `src/lib/database-schema.ts`
2. **API Endpoints**: Add new API routes in `src/app/api/`
3. **Business Logic**: Create service functions in `src/lib/`
4. **Frontend Components**: Add React components in `src/components/`
5. **Tests**: Write unit and integration tests
6. **Documentation**: Update API docs and README

### Code Quality
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Pre-commit Hooks**: Automated code quality checks

## 📚 API Documentation

Complete API documentation is available in:
- **Postman Collection**: `docs/api-documentation.json`
- **Interactive Docs**: Import the collection into Postman
- **Authentication**: Use Bearer token authentication
- **Rate Limits**: 100 requests per 15 minutes for most endpoints

## 🛠 Troubleshooting

### Common Issues

#### Appwrite Connection Issues
```bash
# Check if Appwrite is running
curl http://localhost:3001/v1/health

# Verify environment variables
npm run env-check

# Reset Appwrite connection
npm run reset-appwrite
```

#### Database Issues
```bash
# Check database collections
npm run list-collections

# Recreate collections
npm run setup-collections
```

#### Authentication Issues
```bash
# Clear all sessions
npm run clear-sessions

# Reset admin user
npm run create-admin-user
```

### Debug Mode
Enable debug mode by setting:
```env
NEXT_PUBLIC_DEBUG=true
LOG_LEVEL=debug
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Update documentation
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Appwrite](https://appwrite.io/) - Backend as a Service
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## 📞 Support

For support, email support@yourstore.com or join our Slack community.

---

**Happy coding! 🎉**
