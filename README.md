# 📊 Pulseboard - Work Activity Tracker

**Track your impact. Build your performance story.**

Pulseboard is a comprehensive work activity tracking application that helps professionals document, organize, and showcase their achievements. Perfect for performance reviews, career development, and maintaining a record of your professional growth.

![Pulseboard Dashboard](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop)

## ✨ Features

### 📝 Activity Management
- **Log Work Activities**: Quickly capture your daily achievements, projects, and contributions
- **Rich Details**: Track date, category, team, status, impact notes, and attachments
- **File Attachments**: Upload images, documents, and PDFs (up to 10MB)
- **Praise Tracking**: Record recognition and positive feedback received

### 📊 Multiple Views
- **Dashboard**: Overview with weekly, monthly, and yearly statistics
- **Weekly View**: Calendar-style view of activities by week
- **Category View**: Organize and filter activities by category
- **Review Generator**: AI-powered performance review creation

### 📤 Import/Export
- **Excel Import**: Bulk import activities from Excel templates
- **Excel Export**: Download your complete activity history
- **Template Generation**: Pre-filled templates for easy data entry

### 🔐 User Management
- **Secure Authentication**: Email/password authentication via Supabase
- **User Profiles**: Customizable profiles with full name and avatar
- **Onboarding Flow**: Guided setup for categories and teams

### 👑 Admin Dashboard (Admin Role Only)
- **Analytics**: Total users, active users, total activities
- **Top Categories**: Most used activity categories across platform
- **Signup Timeline**: Visual chart of user growth over time
- **User Management**: View all users with search/filter capabilities
- **CSV Export**: Export complete user list for reporting

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack Query for server state
- **Routing**: React Router v6

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm installed
- Supabase account (or use Lovable Cloud)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd pulseboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

4. **Run database migrations**

The project includes migrations for:
- User profiles and roles tables
- Activities table with RLS policies
- User categories and teams tables
- Storage bucket for attachments

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

## 👤 User Setup

### For Regular Users

1. **Sign Up**: Create an account at `/auth`
2. **Onboarding**: Configure your categories and teams
3. **Start Tracking**: Begin logging your work activities

### For Admins

1. **Get Admin Role**: Have a super admin run this SQL in Supabase:

```sql
-- Replace <your-user-id> with your actual user ID from auth.users
INSERT INTO public.user_roles (user_id, role)
VALUES ('<your-user-id>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

2. **Access Admin Dashboard**: Click your avatar → Admin Dashboard

## 📱 Responsive Design

Pulseboard is fully responsive and works beautifully on:
- 📱 Mobile devices (phones)
- 📱 Tablets
- 💻 Desktop computers

## 🔒 Security Features

- **Row Level Security (RLS)**: All tables protected with RLS policies
- **Role-Based Access**: Admin features require server-side role validation
- **Secure File Storage**: Files stored in Supabase Storage with access policies
- **Authentication**: Email verification and password security via Supabase Auth

## 🎨 Customization

### Categories

Configure your activity categories during onboarding or in settings:
- Technology/Product Development
- Partnerships & Collaborations
- Knowledge Sharing
- Team Collaboration
- Strategic Initiatives
- And more...

### Teams

Add your team names to tag activities:
- Engineering
- Product
- Marketing
- Sales
- Operations
- etc.

## 📊 Admin Features

The admin dashboard provides:

1. **Platform Analytics**
   - Total registered users
   - Active users (last 30 days)
   - Total activities logged
   - Top activity categories

2. **User Management**
   - Complete user list with search
   - Signup dates and activity counts
   - CSV export for reporting
   - No access to individual user data (privacy-focused)

3. **Growth Tracking**
   - Signup timeline chart
   - Category usage trends

## 🌐 Deployment

### Deploy with Lovable (Recommended)

1. Open your project in [Lovable](https://lovable.dev)
2. Click **Share → Publish**
3. Your app will be deployed instantly

### Custom Domain

To connect a custom domain:
1. Navigate to **Project → Settings → Domains**
2. Click **Connect Domain**
3. Follow the DNS configuration steps

[Learn more about custom domains](https://docs.lovable.dev/features/custom-domain)

### Manual Deployment

Build for production:
```bash
npm run build
```

Deploy the `dist` folder to any static hosting service:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- etc.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For questions or issues:
1. Check the [documentation](https://docs.lovable.dev)
2. Open an issue on GitHub
3. Contact the development team

---

**Built with ❤️ using Lovable**
