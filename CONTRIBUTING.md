# Contributing to Trainlog

Thank you for your interest in contributing to Trainlog! We welcome contributions from everyone.

## How to Contribute

### 1. Fork & Clone
* Fork the repository on GitHub.
* Clone your fork locally: `git clone https://github.com/YOUR_USERNAME/trainlog.git`
* Navigate into the directory: `cd trainlog`

### 2. Setup
* Install dependencies: `npm install`
* Start the development server: `npm run dev`

### 3. Make Changes
* Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`
* Make your changes in the code.
* Verify your changes don't break the build: `npm run build`

### 4. Commit and Push
* Commit your changes with descriptive messages: `git commit -m "feat: add amazing new feature"`
* Push to your fork: `git push origin feature/your-feature-name`

### 5. Create a Pull Request
* Go to the original repository on GitHub.
* Click "Compare & pull request".
* Fill out the PR template.

## Code Style

* We use **React**, **Vite**, and **Tailwind CSS** (along with **Shadcn UI**) for our interface.
* Please try to use the existing UI components in `src/components/ui/` whenever possible instead of creating custom ones.
* Do not introduce new CSS frameworks or runtime-heavy CSS-in-JS libraries.
* Ensure your code is well-typed with TypeScript and follows the existing project structure.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
