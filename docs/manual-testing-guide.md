# OnTime Application - Manual Testing Guide

## Overview
This document provides comprehensive test scenarios for the OnTime workforce management application. The application supports multiple user roles with different access levels and functionality.

## Test Environment Setup
- **Application URL**: https://main.d29piw9kh0iuv1.amplifyapp.com/
- **Database**: Supabase (Production)
- **Authentication**: Supabase Auth

## User Roles & Test Accounts

### Super Admin
- **Email**: superadmin@ontime.com
- **Password**: [Contact admin for credentials]
- **Access**: System-wide management, organization oversight

### Organization Admin
- **Email**: sabuanchuparayil@gmail.com
- **Password**: [Use actual password]
- **Organization**: Grozeo
- **Access**: Organization management, employee management

### Task Manager
- **Employee ID**: 0003
- **PIN**: [4-digit PIN]
- **Access**: Task management, employee oversight

### Employee
- **Employee ID**: [Various employee IDs]
- **PIN**: [4-digit PIN]
- **Access**: Task execution, field work

## Test Scenarios

### 1. Authentication & Login Tests

#### 1.1 Super Admin Login
**Objective**: Verify super admin can access system dashboard
**Steps**:
1. Navigate to `/superadmin`
2. Enter super admin credentials
3. Click "Sign In"
**Expected Result**: 
- Successful login to Super Admin Dashboard
- Display system statistics (Organizations, Users, Tasks, Super Admins)
- Access to organization management features

#### 1.2 Organization Admin Login
**Objective**: Verify org admin can access organization dashboard
**Steps**:
1. Navigate to main login page
2. Enter org admin email and password
3. Click "Sign In"
**Expected Result**:
- Successful login to Organization Dashboard
- Display organization overview and statistics
- Access to employee and task management

#### 1.3 Employee PIN Login
**Objective**: Verify employees can login with PIN
**Steps**:
1. Navigate to main login page
2. Enter Employee ID
3. Enter 4-digit PIN
4. Click "Sign In"
**Expected Result**:
- Successful login to employee dashboard
- Display assigned tasks and field work options

#### 1.4 Invalid Login Attempts
**Objective**: Verify proper error handling for invalid credentials
**Steps**:
1. Try login with incorrect email/password
2. Try login with incorrect Employee ID/PIN
3. Try login with empty fields
**Expected Result**:
- Appropriate error messages displayed
- No unauthorized access granted
- Account lockout after multiple failed attempts (for PIN)

### 2. Super Admin Functionality Tests

#### 2.1 Organization Management
**Objective**: Test organization CRUD operations
**Steps**:
1. Login as Super Admin
2. View organizations list
3. Click "Add Organization" button
4. Fill organization details (name, logo URL, active status)
5. Save organization
6. Edit existing organization
7. View organization details
**Expected Result**:
- Organizations displayed with user/task counts
- Successful creation of new organization
- Successful editing of organization details
- Detailed organization view with user management

#### 2.2 Organization Details & User Management
**Objective**: Test comprehensive organization oversight
**Steps**:
1. Click "View Details" on an organization
2. Review organization statistics
3. View user list with roles
4. Test user role changes
5. Test password reset functionality
6. Test PIN reset functionality
7. Test user activation/deactivation
**Expected Result**:
- Complete organization overview displayed
- User management functions work correctly
- Password/PIN reset emails sent
- User status changes reflected immediately

#### 2.3 System Settings
**Objective**: Test system-wide configuration
**Steps**:
1. Click "System Settings"
2. Review system configuration options
3. Test backup/export functionality
4. Review system logs
**Expected Result**:
- System settings accessible
- Configuration changes saved
- Data export functionality works

### 3. Organization Admin Functionality Tests

#### 3.1 Dashboard Overview
**Objective**: Verify org admin dashboard displays correct information
**Steps**:
1. Login as Organization Admin
2. Review dashboard statistics
3. Check recent activities
4. Verify navigation menu
**Expected Result**:
- Accurate statistics displayed
- Recent activities shown
- All menu items accessible

#### 3.2 Employee Management
**Objective**: Test employee CRUD operations
**Steps**:
1. Navigate to Employees section
2. View employee list with statistics
3. Click "Add Employee"
4. Fill employee form (name, ID, designation, mobile, role, email, password)
5. Save employee
6. Edit existing employee
7. Test employee search functionality
8. Test employee deletion (role-based permissions)
**Expected Result**:
- Employee statistics accurate
- Successful employee creation
- Email field visible for existing employees
- Role-based delete permissions enforced
- Search functionality works

#### 3.3 Task Management
**Objective**: Test task creation and assignment
**Steps**:
1. Navigate to Tasks section
2. Click "Add Task"
3. Fill task details (title, description, assignee, due date, priority)
4. Save task
5. Edit existing task
6. Test task status updates
7. Test task deletion
**Expected Result**:
- Tasks created successfully
- Proper assignment to employees
- Status updates reflected
- Task notifications sent

#### 3.4 Organization Settings
**Objective**: Test organization configuration
**Steps**:
1. Navigate to Organization section
2. Update organization details
3. Test logo upload
4. Configure organization settings
5. Save changes
**Expected Result**:
- Organization details updated
- Logo upload successful
- Settings saved correctly

### 4. Task Manager Functionality Tests

#### 4.1 Task Oversight
**Objective**: Verify task manager can oversee assigned tasks
**Steps**:
1. Login as Task Manager
2. View assigned tasks
3. Update task status
4. Add task comments
5. Assign tasks to employees
**Expected Result**:
- Tasks visible based on assignment
- Status updates successful
- Comments added correctly
- Task assignment works

#### 4.2 Employee Oversight
**Objective**: Test employee management capabilities
**Steps**:
1. View team members
2. Check employee task assignments
3. Review employee performance
4. Test communication features
**Expected Result**:
- Team visibility appropriate
- Task assignments visible
- Performance metrics displayed
- Communication functional

### 5. Employee Functionality Tests

#### 5.1 Task Execution
**Objective**: Test employee task management
**Steps**:
1. Login as Employee
2. View assigned tasks
3. Update task status
4. Add task comments
5. Upload task attachments
**Expected Result**:
- Only assigned tasks visible
- Status updates successful
- Comments and attachments uploaded

#### 5.2 Field Work
**Objective**: Test field work functionality
**Steps**:
1. Navigate to Field Work section
2. Check location permissions
3. Start field task
4. Capture photos with location
5. Submit field work report
**Expected Result**:
- Location access requested
- GPS coordinates captured
- Photos uploaded with metadata
- Field reports submitted

### 6. Communication & Notifications Tests

#### 6.1 Messaging System
**Objective**: Test internal communication
**Steps**:
1. Click notification bell icon
2. Navigate to Messages/Chat
3. Send message to team member
4. Receive and reply to messages
5. Test message notifications
**Expected Result**:
- Notification count accurate
- Messages sent/received successfully
- Real-time notifications work
- Chat interface functional

#### 6.2 WhatsApp Integration
**Objective**: Test external communication
**Steps**:
1. Open task details
2. Click "Share via WhatsApp"
3. Verify message content
4. Test sharing functionality
**Expected Result**:
- WhatsApp integration works
- Message content accurate
- Sharing successful

### 7. Analytics & Reporting Tests

#### 7.1 Analytics Dashboard
**Objective**: Test analytics and reporting features
**Steps**:
1. Navigate to Analytics section
2. Review dashboard metrics
3. Test date range filters
4. Export analytics data
5. Verify chart accuracy
**Expected Result**:
- Real data displayed (no mock data)
- Filters work correctly
- Export functionality successful
- Charts accurate and interactive

#### 7.2 Performance Metrics
**Objective**: Test performance tracking
**Steps**:
1. Review employee performance metrics
2. Check task completion rates
3. Analyze time tracking data
4. Test location analytics
**Expected Result**:
- Performance data accurate
- Completion rates calculated correctly
- Time tracking functional
- Location data displayed

### 8. Settings & Profile Tests

#### 8.1 Profile Management
**Objective**: Test user profile functionality
**Steps**:
1. Navigate to Profile section
2. Update profile information
3. Upload profile picture
4. Change password
5. Update contact information
**Expected Result**:
- Profile updates successful
- Avatar upload works
- Password change functional
- Contact info updated

#### 8.2 Application Settings
**Objective**: Test application configuration
**Steps**:
1. Navigate to Settings section
2. Configure notifications
3. Set theme preferences
4. Update language/timezone
5. Test data export
6. Clear cache
**Expected Result**:
- Settings saved correctly
- Notifications configured
- Theme changes applied
- Data export successful
- Cache cleared

### 9. Mobile & PWA Tests

#### 9.1 Mobile Responsiveness
**Objective**: Test mobile device compatibility
**Steps**:
1. Access application on mobile device
2. Test navigation and menus
3. Verify touch interactions
4. Test form inputs
5. Check image uploads
**Expected Result**:
- Responsive design works
- Navigation accessible
- Touch interactions smooth
- Forms functional on mobile
- Camera access works

#### 9.2 PWA Installation
**Objective**: Test Progressive Web App features
**Steps**:
1. Access application in browser
2. Look for install prompt
3. Install as PWA
4. Test offline functionality
5. Verify push notifications
**Expected Result**:
- Install prompt appears
- PWA installation successful
- Offline features work
- Push notifications functional

### 10. Security & Permissions Tests

#### 10.1 Role-Based Access Control
**Objective**: Verify proper access restrictions
**Steps**:
1. Test each role's access limitations
2. Attempt unauthorized actions
3. Verify data visibility restrictions
4. Test cross-organization access
**Expected Result**:
- Access properly restricted by role
- Unauthorized actions blocked
- Data visibility appropriate
- Cross-organization access denied

#### 10.2 Data Security
**Objective**: Test data protection measures
**Steps**:
1. Test SQL injection attempts
2. Verify HTTPS usage
3. Test session management
4. Check data encryption
**Expected Result**:
- Security measures effective
- HTTPS enforced
- Sessions managed properly
- Sensitive data encrypted

## Bug Reporting Template

When reporting bugs, please include:

### Bug Report Format
```
**Bug Title**: [Brief description]
**Severity**: [Critical/High/Medium/Low]
**User Role**: [Super Admin/Org Admin/Task Manager/Employee]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]
**Browser/Device**: [Browser version and device info]
**Screenshots**: [Attach if applicable]
**Console Errors**: [Any JavaScript errors]
```

## Test Completion Checklist

- [ ] All authentication methods tested
- [ ] Super Admin functionality verified
- [ ] Organization Admin features tested
- [ ] Task Manager capabilities verified
- [ ] Employee functionality tested
- [ ] Communication systems working
- [ ] Analytics displaying real data
- [ ] Settings and profiles functional
- [ ] Mobile responsiveness verified
- [ ] PWA features tested
- [ ] Security measures validated
- [ ] Performance acceptable
- [ ] All critical bugs reported

## Notes for Testers

1. **Test Data**: Use real data, not mock data
2. **Browser Testing**: Test on Chrome, Firefox, Safari, Edge
3. **Device Testing**: Test on desktop, tablet, and mobile
4. **Network Testing**: Test on different network speeds
5. **Error Handling**: Pay attention to error messages and edge cases
6. **User Experience**: Note any usability issues or confusing interfaces
7. **Performance**: Report any slow loading or unresponsive features

## Contact Information

For questions or issues during testing:
- **Technical Support**: [Contact details]
- **Project Manager**: [Contact details]
- **Development Team**: [Contact details]

---

**Document Version**: 1.0  
**Last Updated**: June 29, 2025  
**Next Review**: July 15, 2025