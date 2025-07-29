# ScrapFlow 🚀

A powerful, visual web scraping platform built with Next.js 14 that enables users to create, manage, and execute complex web scraping workflows through an intuitive drag-and-drop interface. ScrapFlow combines the flexibility of code with the simplicity of no-code tools, making web scraping accessible to both developers and non-technical users.

## ✨ Key Highlights

- **Visual Workflow Builder**: Create scraping workflows using a drag-and-drop interface powered by React Flow
- **AI-Powered Data Extraction**: Leverage AI to intelligently extract structured data from web pages
- **Credit-Based System**: Built-in billing and credit management system with Stripe integration
- **Real-time Execution Monitoring**: Track your scraping jobs with detailed logs and execution phases
- **Scalable Architecture**: Built on modern technologies for performance and reliability

## 📸 Screenshots

### Workflow Editor
![Workflow Editor](https://github.com/user-attachments/assets/07105297-8b67-4419-a92f-ef5ff5a038c6)

### Dashboard & Analytics
![Dashboard](https://github.com/user-attachments/assets/ecf9c093-d03e-4ee0-bd71-48f1d0b38538)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Backend**: Next.js Server Actions, Prisma ORM
- **Database**: PostgreSQL (Neon DB)
- **UI/UX**: Tailwind CSS, Shadcn/ui, Lucide Icons
- **Workflow Engine**: React Flow for visual workflow building
- **Web Scraping**: Puppeteer for browser automation
- **Payments**: Stripe for billing and subscription management
- **Authentication**: Clerk for user management
- **AI Integration**: Custom AI models for intelligent data extraction

## 🎯 Features

### Browser Automation
- **🌐 Launch Browser**: Initiates a browser instance to begin the web scraping process, enabling interaction with web pages
- **📄 Page to HTML**: Extracts the complete HTML content of the current page for detailed analysis and processing
- **🔗 Navigate to URL**: Navigates to a specified URL, loading the desired web page for scraping or interaction

### Element Interaction
- **📝 Extract Text from Element**: Retrieves text content from specified HTML elements using CSS selectors
- **✏️ Fill Input**: Automatically fills input fields with desired values, emulating user input
- **👆 Click Element**: Simulates click actions on HTML elements, triggering events or navigation
- **📜 Scroll to Element**: Scrolls to specified elements, enabling dynamic content loading
- **⏳ Wait for Element**: Pauses workflow until specified elements become visible or hidden

### Data Processing
- **🧠 Extract Data via AI**: Uses AI to parse HTML content and extract structured data based on custom prompts, returning JSON output
- **📖 Read JSON**: Reads and retrieves specific keys or properties from JSON objects for use in workflows
- **🔧 Build JSON**: Adds or updates data within existing JSON objects or creates new ones with specified properties

### Output & Integration
- **📤 Deliver via Webhook**: Sends scraped data to external API endpoints through POST requests for further processing or storage

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Stripe account (for payments)
- Clerk account (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/scrapflow.git
   cd scrapflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="your-postgresql-url"
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-key"
   CLERK_SECRET_KEY="your-clerk-secret"
   
   # Stripe
   STRIPE_SECRET_KEY="your-stripe-secret"
   STRIPE_WEBHOOK_SECRET="your-webhook-secret"
   STRIPE_SMALL_PACK_PRICE_ID="price_id"
   STRIPE_MEDIUM_PACK_PRICE_ID="price_id"
   STRIPE_LARGE_PACK_PRICE_ID="price_id"
   
   # AI (Optional)
   OPENAI_API_KEY="your-openai-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage Guide

### Creating Your First Workflow

1. **Sign up/Login** using Clerk authentication
2. **Navigate to Workflows** from the dashboard
3. **Create New Workflow** using the visual editor
4. **Drag and Drop Nodes** to build your scraping logic
5. **Configure Each Node** with appropriate parameters
6. **Test Your Workflow** using the execution engine
7. **Schedule or Run** your workflow as needed

### Managing Credits

- **Purchase Credits** through the billing page
- **Monitor Usage** with real-time analytics
- **Track Costs** per workflow execution
- **View Transaction History** and download invoices

## 🏗️ Project Structure

```
scrapflow/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   └── workflow/          # Workflow editor
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/ui components
│   └── providers/        # Context providers
├── lib/                  # Utility functions
│   ├── workflow/         # Workflow execution engine
│   └── stripe/           # Payment processing
├── prisma/               # Database schema and migrations
├── actions/              # Server actions
└── schema/               # Validation schemas
```

## 🔧 Configuration

### Database Schema

The application uses Prisma with PostgreSQL. Key models include:

- **Workflow**: Stores workflow definitions and metadata
- **WorkflowExecution**: Tracks execution history and results
- **UserBalance**: Manages user credits and billing
- **UserPurchase**: Records payment transactions

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | ✅ |
| `CLERK_SECRET_KEY` | Clerk secret key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for AI features | ❌ |

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [React Flow](https://reactflow.dev/) for the visual workflow builder
- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Puppeteer](https://pptr.dev/) for browser automation
- [Stripe](https://stripe.com/) for payment processing
- [Clerk](https://clerk.com/) for authentication

<!-- ## 📞 Support

If you encounter any issues or have questions:

- 📧 Email: support@scrapflow.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/scrapflow/issues)
- 💬 Discord: [Join our community](https://discord.gg/scrapflow)

---

Made with ❤️ by the ScrapFlow team -->
