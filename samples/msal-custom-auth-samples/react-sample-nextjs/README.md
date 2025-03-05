# MSAL Custom Auth Next.js Sample

This is a [Next.js](https://nextjs.org) project that demonstrates custom authentication implementation using MSAL Custom Native Auth SDK. The project showcases a modern authentication flow with sign-in, sign-up, and password reset capabilities.

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app router directory
│   │   ├── sign-in/           # Sign-in route
│   │   ├── sign-up/           # Sign-up route
│   │   ├── reset-password/    # Password reset route
│   │   ├── layout.tsx         # Root layout with navigation
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   └── components/            # Shared components
│       ├── Navbar.tsx         # Navigation bar component
│       └── Navbar.module.css  # Navigation styles
```

## Features

-   Modern Next.js 14 App Router structure
-   Type-safe development with TypeScript
-   Responsive navigation with authentication routes
-   Styled using CSS Modules and global styles
-   Built-in font optimization with [Geist](https://vercel.com/font)

## Getting Started

### Prerequisites

-   Node.js 20.x or later
-   npm 10.x or later
-   yarn 4.6 or later

### Installation

1. Clone the repository:

```bash
git clone https://github.com/AzureAD/microsoft-authentication-library-for-js
cd samples/msal-custom-auth-samples/react-sample-nextjs
```

2. Install dependencies:

```bash
yarn install
```

3. Start the development server:

```bash
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Development

-   `src/app/page.tsx` - The main landing page
-   `src/app/layout.tsx` - The root layout containing the navigation
-   Authentication routes:
    -   `src/app/sign-in/page.tsx` - Sign-in page
    -   `src/app/sign-up/page.tsx` - Sign-up page
    -   `src/app/reset-password/page.tsx` - Password reset page

## Learn More

-   [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
-   [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js) - Microsoft Authentication Library for JavaScript
-   [TypeScript Documentation](https://www.typescriptlang.org/docs/) - Learn about TypeScript

## Contributing

Please read the [contributing guide](../../CONTRIBUTING.md) to learn about our development process.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
