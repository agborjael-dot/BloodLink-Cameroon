# Cameroon Blood Donation: Sequence Diagrams

These diagrams are based on the current frontend routes and backend API flows in this project.

## 1. Core Platform Sequence

```mermaid
sequenceDiagram
    autonumber

    actor Donor
    actor PublicUser as Public User / Hospital Visitor
    actor Admin as Admin / Regional / National
    actor SuperAdmin

    box Client
        participant FE as React Frontend
    end

    box Backend
        participant API as Express API
        participant Auth as JWT Middleware
        database DB as MongoDB
    end

    box Background
        participant Cron as BackgroundServices
        participant Mail as Email Services
    end

    rect rgb(245, 248, 255)
        Note over Donor,DB: A. Registration and Login
        Donor->>FE: Open sign up / sign in page
        FE->>API: POST /api/v1/auth/register or /api/v1/auth/login
        API->>DB: Create or find User
        DB-->>API: User record / auth result

        alt Login successful
            API-->>FE: accessToken + user role/profile
            FE->>FE: Store token and user in localStorage
            FE-->>Donor: Redirect to donor or admin dashboard
        else Invalid credentials
            API-->>FE: 401 error message
            FE-->>Donor: Show inline error on login form
        else Database unavailable
            API-->>FE: 503 error message
            FE-->>Donor: Show server unavailable message
        end
    end

    rect rgb(245, 255, 248)
        Note over Donor,DB: B. Donor Dashboard Load and Profile Update
        Donor->>FE: Open /donor
        FE->>FE: Read token from localStorage
        par Protected donor profile
            FE->>API: GET /api/v1/donors/me with Bearer token
            API->>Auth: Verify token
            Auth-->>API: req.user
            API->>DB: Find User and donor profile by email
            DB-->>API: Account + donor profile
            API-->>FE: account + donor data
        and Public dashboard widgets
            FE->>API: GET /api/v1/hospitals/availability
            FE->>API: GET /api/v1/drives/public
            FE->>API: GET /api/v1/blood-requests/public
            API->>DB: Read public hospital/drive/request data
            DB-->>API: Public dashboard data
            API-->>FE: Public widgets data
        end
        Donor->>FE: Edit donor details
        FE->>API: PUT /api/v1/donors/me
        API->>Auth: Verify token
        Auth-->>API: req.user
        API->>DB: Update User and upsert Donor
        Note over API,DB: Recompute nextEligible and donationHistory when lastDonation changes
        DB-->>API: Updated donor profile
        API-->>FE: Updated account + donor data
        FE-->>Donor: Refresh donor profile UI
    end

    rect rgb(255, 249, 245)
        Note over PublicUser,DB: C. Blood Request Submission and Admin Review
        PublicUser->>FE: Submit blood request form
        FE->>API: POST /api/v1/blood-requests
        API->>DB: Create BloodRequest(status=pending)
        DB-->>API: Saved request
        API-->>FE: Request id + status
        FE-->>PublicUser: Show submission result

        Admin->>FE: Open admin dashboard
        FE->>API: GET /api/v1/blood-requests with token
        API->>Auth: Verify admin token/role
        Auth-->>API: Authorized admin
        API->>DB: Load blood requests
        DB-->>API: Requests list
        API-->>FE: Requests list

        Admin->>FE: Approve or update request
        FE->>API: PUT /api/v1/blood-requests/:id
        API->>DB: Update status and append system message
        Note over API,DB: If approved, generate a blood manifest
        DB-->>API: Updated request
        API-->>FE: Updated request details
    end

    rect rgb(250, 245, 255)
        Note over PublicUser,Mail: D. Hospital Onboarding and Scheduled Emails
        PublicUser->>FE: Submit hospital application
        FE->>API: POST /api/v1/hospital-applications
        API->>DB: Create HospitalApplication(status=pending)
        DB-->>API: Saved application
        API-->>FE: Application submitted

        SuperAdmin->>FE: Review pending applications
        FE->>API: GET /api/v1/hospital-applications with token
        API->>Auth: Verify super admin token
        Auth-->>API: Authorized super admin
        API->>DB: Read applications
        DB-->>API: Pending applications
        API-->>FE: Applications list

        SuperAdmin->>FE: Approve / reject application
        FE->>API: PUT /api/v1/hospital-applications/:id
        API->>DB: Update application status
        DB-->>API: Updated application
        API-->>FE: Updated application

        loop Every minute
            Cron->>DB: Read prospects, donor data, schedules
            DB-->>Cron: Matching records
            Cron->>Mail: Send eligibility, reminder, and donor/prospect emails
            Mail-->>Donor: Email notification
            Mail-->>PublicUser: Email notification
        end
    end
```

## 2. Donor Profile Detail Sequence

```mermaid
sequenceDiagram
    autonumber

    actor Donor
    participant FE as Donor.jsx
    participant API as /api/v1/donors/me
    participant Auth as verifyToken
    database Users as User Collection
    database Donors as Donor Collection

    Donor->>FE: Open donor profile page
    FE->>FE: Load token from localStorage
    FE->>API: GET donor profile
    API->>Auth: Validate Bearer token
    Auth-->>API: req.user.id
    API->>Users: Find authenticated user
    Users-->>API: User account
    API->>Donors: Find donor by email
    Donors-->>API: Existing donor record or null

    alt Donor record exists
        API-->>FE: account + donor profile + history + nextEligible
    else First-time donor profile
        API-->>FE: Seed default donor profile from user account
    end

    par Public side panels
        FE->>API: GET hospital availability
        API-->>FE: Availability data
    and Donation drives
        FE->>API: GET public drives
        API-->>FE: Drive data
    and Public blood requests
        FE->>API: GET public blood requests
        API-->>FE: Request summaries
    end

    Donor->>FE: Edit profile and save
    FE->>API: PUT donor profile
    API->>Auth: Validate Bearer token
    Auth-->>API: req.user.id
    API->>Users: Update user name when changed
    API->>Donors: Upsert donor profile by email
    Note over API,Donors: Compute nextEligible from lastDonation and update donationHistory
    Donors-->>API: Updated donor document
    API-->>FE: Updated account + donor profile
    FE-->>Donor: Render saved profile
```
