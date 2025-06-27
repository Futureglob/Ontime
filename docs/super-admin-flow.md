
# OnTime Application: Super Admin User Flow

## 1. Introduction

The Super Admin role provides the highest level of access and control over the entire OnTime platform. This user is responsible for managing client organizations, overseeing system-wide health, and configuring global settings. This document outlines the primary user flows for the Super Admin.

---

## 2. Authentication

### 2.1. Logging In
1.  **Navigate** to the Super Admin login page (e.g., `/superadmin`).
2.  **Enter** the unique Super Admin email and password.
3.  **Click** the "Login" button.
4.  **Result:** Upon successful authentication, the Super Admin is redirected to the main Super Admin Dashboard.

### 2.2. Logging Out
1.  **Click** on the "Logout" button, typically located in the user profile menu or sidebar.
2.  **Result:** The session is terminated, and the user is redirected back to the login page.

---

## 3. Dashboard &amp; Organization Management

The dashboard is the central hub for the Super Admin.

### 3.1. Viewing the Dashboard
-   **Overview:** The dashboard displays high-level statistics about the platform, such as:
    -   Total number of active organizations.
    -   Total number of registered users (admins, managers, employees).
    -   Platform-wide task volume and completion rates.
-   **Organization List:** A comprehensive table lists all organizations on the platform. Each entry includes:
    -   Organization Name
    -   Primary Admin Contact
    -   Creation Date
    -   Current Status (Active/Inactive)
    -   Action buttons (Edit, Deactivate/Activate, Manage).

### 3.2. Creating a New Organization
1.  **Click** the "Add New Organization" button on the dashboard.
2.  **A modal appears** with a form to enter the new organization's details:
    -   Organization Name
    -   Logo URL (optional)
    -   Theme Colors (optional)
3.  **The form also includes fields to create the initial Organization Admin:**
    -   Admin's Full Name
    -   Admin's Email (this will be their login username)
    -   A secure, temporary password for the admin.
4.  **Submit** the form.
5.  **Result:**
    -   A new organization is created in the system.
    -   A new profile for the Organization Admin is created and linked to the organization.
    -   The new organization appears in the main list on the dashboard.

### 3.3. Editing an Existing Organization
1.  **Locate** the desired organization in the dashboard list.
2.  **Click** the "Edit" button for that organization.
3.  **A modal appears** pre-filled with the organization's current details.
4.  **Modify** the necessary fields (e.g., name, logo, theme colors).
5.  **Save** the changes.
6.  **Result:** The organization's details are updated across the platform.

### 3.4. Managing Organization Status
1.  **Locate** the desired organization in the dashboard list.
2.  **Click** the "Deactivate" or "Activate" button.
3.  **Confirm** the action in the confirmation prompt.
4.  **Result:**
    -   **Deactivating** an organization prevents its users from logging in and suspends all operations.
    -   **Activating** a previously inactive organization restores full access and functionality.

---

## 4. System-Wide Management

### 4.1. System Settings
1.  **Click** on the "System Settings" button, typically found in the dashboard header or sidebar.
2.  **A modal appears** with various global configuration options:
    -   **API Keys:** Manage keys for third-party integrations (e.g., mapping services, notification gateways).
    -   **Feature Flags:** Enable or disable specific features across the entire platform.
    -   **Default Configurations:** Set default values for new organizations (e.g., default task types, notification settings).
3.  **Modify** the settings as needed and **save** the changes.

### 4.2. Platform Analytics
1.  **Navigate** to the "Analytics" section from the main sidebar.
2.  **View** aggregated data from all organizations, providing a complete picture of platform performance. Key metrics include:
    -   Overall task trends (created vs. completed).
    -   User growth and engagement over time.
    -   Performance metrics by location, task type, etc., aggregated across all clients.
3.  **Filter** the analytics by date range to analyze specific periods.
4.  **Export** reports for offline analysis.

---

## 5. Super Admin Profile Management

1.  **Navigate** to the "Profile" or "Settings" page.
2.  **Update** personal information, such as name or contact details.
3.  **Change** the Super Admin password for security purposes.
