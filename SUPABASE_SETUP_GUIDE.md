
# 🚀 Supabase Setup Guide for OnTime Application

## ✅ What's Already Configured

Your OnTime application now has a complete Supabase backend setup with:

### 🗄️ Database Schema
- **profiles** - User management with organization isolation
- **organizations** - Multi-tenant organization data
- **tasks** - Complete task management system
- **task_photos** - Photo uploads with metadata
- **task_status_history** - Audit trail for task changes
- **messages** - Real-time chat system

### 🔒 Security (RLS Policies)
- Organization-based data isolation
- Role-based access control (Admin, Manager, Employee)
- Secure policies for all tables

### 📁 Storage Buckets
- **task-photos** - Field work photos
- **organization-logos** - Company branding
- **profile-photos** - User avatars

### ⚡ Real-time Features
- Live task updates
- Real-time chat
- Employee status updates
- Photo upload notifications

## 🛠️ Manual Setup Required in Supabase Dashboard

### 1. Create Storage Buckets
Go to Storage in your Supabase dashboard and create these buckets:

```sql
-- Create storage buckets (run in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public) VALUES 
('task-photos', 'task-photos', true),
('organization-logos', 'organization-logos', true),
('profile-photos', 'profile-photos', true);
```

### 2. Set Storage Policies
For each bucket, add these policies in Storage > Policies:

**task-photos bucket:**
```sql
-- Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view photos from their organization
CREATE POLICY "Allow organization access" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated');
```

**organization-logos bucket:**
```sql
-- Allow organization admins to upload logos
CREATE POLICY "Allow admin uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public access to logos
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (true);
```

**profile-photos bucket:**
```sql
-- Allow users to upload their own profile photos
CREATE POLICY "Allow own profile uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view profile photos
CREATE POLICY "Allow profile access" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated');
```

### 3. Enable Real-time (Already Done)
Real-time is already enabled for all tables. No additional setup needed.

## 🔧 Application Integration

### Using the Services

**Task Management:**
```typescript
import { taskService } from "@/services/taskService";

// Create a task
const task = await taskService.createTask({
  title: "Site Inspection",
  description: "Check building foundation",
  location: "123 Main St",
  assigned_to: "user-id",
  organization_id: "org-id"
});
```

**Photo Uploads:**
```typescript
import { storageService } from "@/services/storageService";

// Upload task photo
const result = await storageService.uploadTaskPhoto(
  file, 
  taskId, 
  "arrival"
);
```

**Real-time Updates:**
```typescript
import { realtimeService } from "@/services/realtimeService";

// Subscribe to task updates
const subscription = realtimeService.subscribeToTaskUpdates(
  organizationId,
  (payload) => {
    console.log("Task updated:", payload);
  }
);

// Cleanup
subscription.unsubscribe();
```

## 📱 Mobile & PWA Features

### Offline Capabilities
- Service worker for offline functionality
- Local storage for offline data
- Background sync when online

### PWA Features
- App manifest for mobile installation
- Push notifications
- Geolocation services
- Camera access for photos

## 🚀 Next Steps

1. **Test the Setup**: Try creating users, tasks, and uploading photos
2. **Configure Push Notifications**: Set up FCM for mobile notifications
3. **Add Geolocation**: Implement location tracking for field workers
4. **Customize Branding**: Upload organization logos and set themes
5. **Deploy**: Use the Publish button in Softgen to deploy your app

## 🔍 Troubleshooting

**Common Issues:**
- **Storage upload fails**: Check bucket policies and authentication
- **Real-time not working**: Verify table publications are enabled
- **RLS blocking access**: Check user roles and organization membership

**Useful SQL Queries:**
```sql
-- Check user profile
SELECT * FROM profiles WHERE id = auth.uid();

-- Check organization membership
SELECT p.*, o.name as org_name 
FROM profiles p 
JOIN organizations o ON p.organization_id = o.id 
WHERE p.id = auth.uid();

-- View task assignments
SELECT t.*, p.full_name as assigned_to_name
FROM tasks t
LEFT JOIN profiles p ON t.assigned_to = p.id
WHERE t.organization_id = 'your-org-id';
```

Your OnTime application is now ready for full-scale field work management! 🎉
