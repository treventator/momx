# System Architecture and Flow Diagrams

## System Architecture

```mermaid
graph TD
    User[User/Customer] --> Frontend[Frontend <br> Nginx Web Server]
    Frontend --> Backend[Backend <br> Node.js API Server]
    Backend --> Database[MongoDB <br> Database]
    
    subgraph "Docker Containers"
        Frontend
        Backend
        Database
    end
    
    Backend --> PaymentSystem[Payment System <br> PromptPay/Bank Transfer]
    
    style Frontend fill:#f9f,stroke:#333,stroke-width:2px
    style Backend fill:#bbf,stroke:#333,stroke-width:2px
    style Database fill:#bfb,stroke:#333,stroke-width:2px
    style PaymentSystem fill:#fbb,stroke:#333,stroke-width:2px
```

## User Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database
    
    User->>Frontend: Access login/register page
    Frontend->>User: Display login/register form
    
    alt Registration
        User->>Frontend: Fill registration form
        Frontend->>Backend: POST /api/auth/register
        Backend->>Database: Create new user
        Database->>Backend: User created
        Backend->>Frontend: Return JWT token
        Frontend->>User: Redirect to dashboard
    else Login
        User->>Frontend: Enter credentials
        Frontend->>Backend: POST /api/auth/login
        Backend->>Database: Validate credentials
        Database->>Backend: User validated
        Backend->>Frontend: Return JWT token
        Frontend->>User: Redirect to dashboard
    end
```

## Shopping Flow

```mermaid
flowchart TD
    A[Customer Visits Website] --> B[Browse Products]
    B --> C{Add to Cart?}
    C -->|Yes| D[Add Product to Cart]
    C -->|No| B
    D --> E{Continue Shopping?}
    E -->|Yes| B
    E -->|No| F[View Cart]
    F --> G{Checkout?}
    G -->|No| B
    G -->|Yes| H[Enter Shipping Information]
    H --> I[Select Payment Method]
    I --> J{Payment Method}
    J -->|PromptPay| K1[Generate QR Code]
    J -->|Bank Transfer| K2[Display Bank Details]
    J -->|Cash on Delivery| K3[Confirm Order]
    
    K1 --> L[Customer Scans QR Code]
    K2 --> M[Customer Makes Transfer]
    K3 --> N[Order Confirmed]
    
    L --> O[Upload Payment Proof]
    M --> O
    
    O --> P[Admin Verifies Payment]
    N --> P
    
    P --> Q[Process Order]
    Q --> R[Ship Order]
    R --> S[Order Delivered]
```

## Order Processing Flow

```mermaid
stateDiagram-v2
    [*] --> Pending: Order Created
    Pending --> PaymentPending: Customer Checkout
    
    PaymentPending --> PaymentConfirmed: Payment Received
    PaymentPending --> Cancelled: Payment Timeout/Cancel
    
    PaymentConfirmed --> Processing: Admin Approval
    Processing --> Shipped: Order Shipped
    Shipped --> Delivered: Order Delivered
    
    Delivered --> [*]
    Cancelled --> [*]
```

## Admin Dashboard Flow

```mermaid
flowchart TD
    A[Admin Login] --> B[Admin Dashboard]
    B --> C{Select Management}
    
    C -->|Orders| D[Order Management]
    C -->|Products| E[Product Management]
    C -->|Users| F[User Management]
    C -->|Payments| G[Payment Management]
    
    D --> D1[View Orders]
    D --> D2[Update Order Status]
    D --> D3[Process Refunds]
    
    E --> E1[Add New Products]
    E --> E2[Edit Products]
    E --> E3[Manage Stock]
    
    F --> F1[View Users]
    F --> F2[Edit User Permissions]
    
    G --> G1[View Transactions]
    G --> G2[Manage Payment Settings]
    G --> G3[Payment Verification]
```

## Payment Processing Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant Backend
    participant PaymentSystem
    
    Customer->>Frontend: Select Payment Method
    
    alt PromptPay
        Frontend->>Backend: GET /api/payments/promptpay?amount=XXX
        Backend->>Backend: Generate QR Code
        Backend->>Frontend: Return QR Code
        Frontend->>Customer: Display QR Code
        Customer->>PaymentSystem: Scan & Pay
        Customer->>Frontend: Upload Payment Proof
        Frontend->>Backend: POST /api/payments/verify
        Backend->>Backend: Verify Payment
    else Bank Transfer
        Frontend->>Backend: GET /api/payments/bank-details
        Backend->>Frontend: Return Bank Details
        Frontend->>Customer: Display Bank Information
        Customer->>PaymentSystem: Make Bank Transfer
        Customer->>Frontend: Upload Payment Proof
        Frontend->>Backend: POST /api/payments/verify
        Backend->>Backend: Verify Payment
    else Cash on Delivery
        Frontend->>Backend: POST /api/orders with COD
        Backend->>Frontend: Confirm Order
        Frontend->>Customer: Display Order Confirmation
    end
    
    Backend->>Backend: Update Order Status
    Backend->>Frontend: Return Updated Order
    Frontend->>Customer: Display Order Status
```

## Data Model Relationships

```mermaid
erDiagram
    USER {
        string id PK
        string name
        string email
        string password
        string role
        date createdAt
    }
    
    PRODUCT {
        string id PK
        string name
        number price
        number stock
        string[] images
        string description
        date createdAt
    }
    
    CART {
        string id PK
        string user FK
        object[] items
        number totalPrice
        date updatedAt
    }
    
    ORDER {
        string id PK
        string user FK
        object[] orderItems
        object shippingAddress
        string paymentMethod
        string shippingMethod
        number itemsPrice
        number taxPrice
        number shippingPrice
        number totalPrice
        boolean isPaid
        date paidAt
        boolean isDelivered
        date deliveredAt
        date createdAt
    }
    
    SUBSCRIPTION {
        string id PK
        string user FK
        string status
        date startDate
        date endDate
        string paymentStatus
        number price
    }
    
    USER ||--o{ CART : has
    USER ||--o{ ORDER : places
    USER ||--o{ SUBSCRIPTION : subscribes
    PRODUCT ||--o{ CART : "added to"
    PRODUCT ||--o{ ORDER : "ordered in"
```

## Cookie Consent Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant CookieSystem
    participant LocalStorage
    
    User->>Frontend: Visit Website First Time
    Frontend->>CookieSystem: Initialize Cookie Consent
    CookieSystem->>Frontend: Display Cookie Banner
    Frontend->>User: Show Cookie Consent Banner
    
    alt Accept All Cookies
        User->>Frontend: Click "Accept All"
        Frontend->>CookieSystem: acceptAll()
        CookieSystem->>LocalStorage: Store Consent (All)
    else Customize Settings
        User->>Frontend: Click "Customize"
        Frontend->>User: Show Detailed Settings
        User->>Frontend: Select Preferences
        Frontend->>CookieSystem: savePreferences()
        CookieSystem->>LocalStorage: Store Selected Preferences
    else Reject Non-Essential
        User->>Frontend: Click "Reject All"
        Frontend->>CookieSystem: rejectAll()
        CookieSystem->>LocalStorage: Store Consent (Essential Only)
    end
    
    Frontend->>CookieSystem: Hide Banner
    CookieSystem->>Frontend: Enable/Disable Features Based on Consent
```

## Docker Infrastructure

```mermaid
graph TD
    subgraph "Docker Environment"
        dc[Docker Compose] --> |orchestrates| containers
        
        subgraph "containers"
            fe[Frontend Container<br>Port: 66:80] 
            be[Backend Container<br>Port: 4455:4455]
            db[MongoDB Container<br>Port: 27017:27017]
        end
        
        fe --> |depends on| be
        be --> |depends on| db
        
        subgraph "Volumes"
            feVol[Frontend Volume<br>./frontend/public:/usr/share/nginx/html]
            beVol[Backend Volume<br>./backend:/usr/src/app]
            dbVol[MongoDB Volume<br>mongo-data:/data/db]
        end
        
        fe --> feVol
        be --> beVol
        db --> dbVol
        
        subgraph "Network"
            net[tanyarat-network<br>bridge driver]
        end
        
        fe --> net
        be --> net
        db --> net
    end
    
    style dc fill:#f96,stroke:#333,stroke-width:2px
    style fe fill:#f9f,stroke:#333,stroke-width:2px
    style be fill:#bbf,stroke:#333,stroke-width:2px
    style db fill:#bfb,stroke:#333,stroke-width:2px
    style net fill:#ddd,stroke:#333,stroke-width:2px
```

## Dockerfile & Configuration Relationships

```mermaid
flowchart LR
    dockerCompose[docker-compose.yml] --> frontendDockerfile[frontend/Dockerfile]
    dockerCompose --> backendDockerfile[backend/Dockerfile]
    dockerCompose --> mongoConfig[MongoDB Config]
    
    subgraph "Frontend"
        frontendDockerfile --> nginxConf[nginx.conf]
        frontendDockerfile --> frontendCode[Public HTML/JS/CSS]
        nginxConf --> |configures| frontendServer[Nginx Server]
        frontendCode --> |served by| frontendServer
        
        cookieConsent[Cookie Consent System] --> frontendCode
    end
    
    subgraph "Backend"
        backendDockerfile --> nodeModules[node_modules]
        backendDockerfile --> expressApp[Express App]
        expressApp --> controllers[Controllers]
        expressApp --> routes[Routes]
        expressApp --> models[Models]
        expressApp --> services[Services]
    end
    
    subgraph "Database"
        mongoConfig --> dbData[MongoDB Data Volume]
    end
    
    frontendServer --> |HTTP Requests| expressApp
    expressApp --> |Queries| dbData
    
    style dockerCompose fill:#f96,stroke:#333,stroke-width:2px
    style frontendDockerfile fill:#f9f,stroke:#333,stroke-width:2px
    style backendDockerfile fill:#bbf,stroke:#333,stroke-width:2px
    style mongoConfig fill:#bfb,stroke:#333,stroke-width:2px
    style cookieConsent fill:#fcf,stroke:#333,stroke-width:2px
```

## Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git Repository
    participant Server as Production Server
    participant Docker as Docker Engine
    
    Dev->>Git: Push changes
    Git->>Server: Pull changes
    
    Server->>Docker: docker-compose build
    Docker->>Docker: Build images with Dockerfiles
    Docker->>Docker: Pull MongoDB image
    
    Server->>Docker: docker-compose up -d
    Docker->>Docker: Start containers
    Docker->>Docker: Set up network
    Docker->>Docker: Mount volumes
    
    Note over Docker: Health check backend
    Note over Docker: Frontend depends on backend
    
    Docker->>Server: Services running
    Server->>Dev: Deployment complete
```

## Cookie Consent Docker Integration

```mermaid
flowchart TD
    subgraph "Docker Environment"
        fe[Frontend Container] 
        
        subgraph "Frontend Container Structure"
            nginx[Nginx/Caddy Server]
            
            subgraph "Static Files"
                html[HTML Pages]
                js[JavaScript Files]
                css[CSS Files]
                
                subgraph "Cookie Consent Components"
                    cookieJs[cookie-consent.js]
                    cookieCss[cookie-consent.css]
                end
                
                html --> cookieJs
                html --> cookieCss
            end
            
            nginx --> html
        end
    end
    
    subgraph "User Browser"
        webpage[Web Page]
        cookieBanner[Cookie Consent Banner]
        cookieSettings[Cookie Settings Modal]
        localStorage[Local Storage/Cookies]
        
        webpage --> cookieBanner
        cookieBanner --> |User Interaction| cookieSettings
        cookieSettings --> localStorage
    end
    
    fe --> |Serves| webpage
    
    style fe fill:#f9f,stroke:#333,stroke-width:2px
    style nginx fill:#aaf,stroke:#333,stroke-width:2px
    style cookieJs fill:#fda,stroke:#333,stroke-width:2px
    style cookieCss fill:#fda,stroke:#333,stroke-width:2px
    style cookieBanner fill:#faa,stroke:#333,stroke-width:2px
    style cookieSettings fill:#faa,stroke:#333,stroke-width:2px
    style localStorage fill:#afa,stroke:#333,stroke-width:2px
``` 